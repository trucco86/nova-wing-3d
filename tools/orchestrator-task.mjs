import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { artifactDirectory, getJob } from './orchestrator-queue.mjs';
import { check, plan } from './orchestrator.mjs';
import { requestReview, reviewContext } from './agent-review.mjs';

const [root, jobId, leaseId] = process.argv.slice(2);
try {
  const job = getJob({ root, jobId });
  if (job.status !== 'running' || job.attempts.at(-1)?.leaseId !== leaseId)
    throw new Error('Lease de execução inválida.');
  const snapshot = plan({ root, spec: job.spec });
  if (snapshot.commit !== job.commit || snapshot.sourceDigest !== job.sourceDigest)
    throw new Error('Fonte divergente.');
  let observed, outcome;
  if (job.kind === 'validation') {
    observed = check({
      root,
      spec: job.spec,
      isolated: true,
      timeoutMs: Math.max(100, job.limits.timeoutMs - 1000),
    });
    outcome = observed.status === 'awaiting-review' ? 'succeeded' : 'blocked';
  } else if (job.kind === 'review') {
    const context = reviewContext({ root, runId: job.input.runId });
    if (
      context.spec !== job.spec ||
      context.commit !== job.commit ||
      context.sourceDigest !== job.sourceDigest
    )
      throw new Error('Spec da revisão divergente.');
    observed = requestReview({ root, ...job.input, requestId: job.id });
    outcome = 'waiting-review';
  } else if (job.kind === 'evaluations') {
    const { evaluateContracts } = await import('./orchestrator-evals.mjs');
    observed = await evaluateContracts({ root });
    outcome = observed.passed ? 'succeeded' : 'blocked';
  } else if (job.kind === 'operations-audit') {
    const { auditOperations } = await import('./orchestrator-ops.mjs');
    observed = await auditOperations({ root });
    outcome = observed.passed ? 'succeeded' : 'blocked';
  } else throw new Error('Tipo de tarefa não permitido.');
  const result = {};
  for (const key of ['status', 'passed', 'directory', 'reportPath', 'runId', 'requestId'])
    if (observed[key] !== undefined) result[key] = observed[key];
  const directory = artifactDirectory(root, 'jobs', jobId, 'attempts', leaseId);
  writeFileSync(
    join(directory, 'result.json'),
    JSON.stringify(
      {
        jobId,
        leaseId,
        outcome,
        result,
        reason: outcome === 'blocked' ? 'O gate ou auditoria reportou bloqueio.' : null,
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
