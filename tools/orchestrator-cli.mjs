import { plan, check } from './orchestrator.mjs';
import { requestReview, recordReview } from './agent-review.mjs';

try {
  const [action, target, ...flags] = process.argv.slice(2);
  const needsQueue = action?.startsWith('queue-') || action === 'metrics';
  if (needsQueue && Number(process.versions.node.split('.')[0]) < 24)
    throw new Error('A fila persistente e suas métricas exigem Node 24 ou superior.');
  const { enqueueJob, claimJob, listJobs, getJob } = needsQueue
    ? await import('./orchestrator-queue.mjs')
    : {};
  const { workOne, reconcileReview } = ['queue-work', 'queue-reconcile'].includes(action)
    ? await import('./orchestrator-worker.mjs')
    : {};
  let result;
  if (action === 'queue-enqueue' && (flags.length === 2 || flags.length === 4)) {
    if (target !== 'review' && flags.length !== 2)
      throw new Error('Argumentos extras não permitidos.');
    result = enqueueJob({
      kind: target,
      spec: flags[0],
      taskId: flags[1],
      input: target === 'review' ? { runId: flags[2], implementerId: flags[3] } : {},
    });
  } else if (action === 'queue-status' && flags.length === 0) {
    result = target ? getJob({ jobId: target }) : listJobs();
  } else if (action === 'queue-claim' && target && flags.length === 0) {
    result = claimJob({ workerId: target }) ?? { status: 'idle' };
  } else if (action === 'queue-reconcile' && target && flags.length === 0) {
    result = reconcileReview({ jobId: target });
  } else if (action === 'queue-work' && target && flags.length <= 1) {
    const mode = flags[0];
    if (mode && mode !== '--drain' && !/^--watch=([1-9][0-9]{0,3})$/.test(mode))
      throw new Error('Modo de worker inválido.');
    const seconds = mode?.startsWith('--watch=') ? Number(mode.slice(8)) : 0;
    if (seconds > 3600) throw new Error('Watch limitado a uma hora.');
    const deadline = Date.now() + seconds * 1000;
    const jobs = [];
    do {
      const job = await workOne({ workerId: target });
      if (job.status === 'idle') {
        if (!seconds || Date.now() >= deadline) break;
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        jobs.push(job);
        if (job.attempts?.at(-1)?.reason?.startsWith('task-cancelled:')) break;
      }
      if (!mode || jobs.length >= 32) break;
    } while (!seconds || Date.now() < deadline);
    result = {
      status: jobs.some((job) => ['blocked', 'failed'].includes(job.status))
        ? 'blocked'
        : 'processed',
      jobs,
    };
  } else if (['metrics', 'evals', 'ops-audit', 'recovery-drill'].includes(action) && !target) {
    if (action === 'metrics') {
      const { collectMetrics } = await import('./orchestrator-metrics.mjs');
      result = await collectMetrics({ root: process.cwd(), jobs: listJobs() });
    } else if (action === 'evals') {
      const { evaluateContracts } = await import('./orchestrator-evals.mjs');
      result = await evaluateContracts({ root: process.cwd() });
    } else {
      const { auditOperations, recoveryDrill } = await import('./orchestrator-ops.mjs');
      result = await (action === 'ops-audit' ? auditOperations : recoveryDrill)({
        root: process.cwd(),
      });
    }
  } else if (action === 'ci-observe' && target && flags.length === 2) {
    const { observeCI } = await import('./orchestrator-ops.mjs');
    result = await observeCI({
      root: process.cwd(),
      githubRunId: target,
      expectedCommit: flags[0],
      expectedDigest: flags[1],
    });
  } else if (['request-review', 'record-review'].includes(action) && flags.length === 1) {
    result =
      action === 'request-review'
        ? requestReview({ runId: target, implementerId: flags[0] })
        : recordReview({ runId: target, requestId: flags[0] });
  } else if (['plan', 'check'].includes(action) && flags.every((flag) => flag === '--browser')) {
    const options = { spec: target, browser: flags.includes('--browser') };
    result = action === 'plan' ? plan(options) : check(options);
  } else
    throw new Error(
      'Uso: agent:orchestrate plan|check <spec> [--browser]; request-review|record-review <runId> <actor/request>; queue-enqueue <kind> <spec> <taskId> [runId actor]; queue-status [jobId]; queue-claim|queue-work <worker> [--drain|--watch=seconds]; queue-reconcile <jobId>; metrics|evals|ops-audit|recovery-drill; ci-observe <githubRunId> <SHA> <digest>',
    );
  console.log(JSON.stringify(result, null, 2));
  if (['blocked', 'changes-requested', 'failed'].includes(result.status) || result.passed === false)
    process.exitCode ||= 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
