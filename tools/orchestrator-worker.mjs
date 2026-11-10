import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, readFileSync, lstatSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  artifactDirectory,
  claimJob,
  finishJob,
  getJob,
  resolveReviewJob,
} from './orchestrator-queue.mjs';
import { plan } from './orchestrator.mjs';
import { requestReview, responseProblem, reviewContext } from './agent-review.mjs';

function matchesSnapshot(root, job) {
  const current = plan({ root, spec: job.spec });
  if (current.commit !== job.commit || current.sourceDigest !== job.sourceDigest) return false;
  if (job.kind === 'review') {
    const context = reviewContext({ root, runId: job.input.runId });
    if (
      context.spec !== job.spec ||
      context.commit !== job.commit ||
      context.sourceDigest !== job.sourceDigest
    )
      return false;
  }
  return true;
}

// This process API is code-only. The CLI never accepts command/args from a task.
export function runTaskProcess({ command, args, timeoutMs, logFile, cwd }) {
  return new Promise((resolve) => {
    const log = createWriteStream(logFile, { flags: 'wx', mode: 0o600 });
    let timedOut = false,
      outputExceeded = false,
      bytes = 0,
      error = null,
      cancelled = null;
    const child = spawn(command, args, {
      cwd,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stop = () => {
      try {
        if (process.platform === 'win32') child.kill('SIGKILL');
        else process.kill(-child.pid, 'SIGKILL');
      } catch (failure) {
        if (failure.code !== 'ESRCH') error ??= failure.code;
      }
    };
    const timer = setTimeout(() => {
      timedOut = true;
      stop();
    }, timeoutMs);
    const onTerm = () => {
      cancelled = 'SIGTERM';
      process.exitCode = 143;
      stop();
    };
    const onInt = () => {
      cancelled = 'SIGINT';
      process.exitCode = 130;
      stop();
    };
    process.once('SIGTERM', onTerm);
    process.once('SIGINT', onInt);
    for (const stream of [child.stdout, child.stderr])
      stream.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > 8388608) {
          outputExceeded = true;
          stop();
        } else log.write(chunk);
      });
    child.on('error', (failure) => {
      error = failure.code ?? 'spawn-error';
    });
    log.on('error', (failure) => {
      error = failure.code ?? 'log-error';
      stop();
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      process.removeListener('SIGTERM', onTerm);
      process.removeListener('SIGINT', onInt);
      // Kill descendants left behind by a terminated task, including npm children.
      stop();
      const done = () => resolve({ code, signal, error, timedOut, outputExceeded, cancelled });
      if (log.destroyed) done();
      else log.end(done);
    });
  });
}

function readResult(path, limit = 32768) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.size > limit) throw new Error('Resultado de tarefa inválido.');
  return JSON.parse(readFileSync(path, 'utf8'));
}

export async function workOne({ root = process.cwd(), workerId }, execute = runTaskProcess) {
  const job = claimJob({ root, workerId });
  if (!job) return { status: 'idle' };
  const attempt = job.attempts.at(-1);
  const leaseId = attempt.leaseId;
  const directory = artifactDirectory(root, 'jobs', job.id, 'attempts', leaseId);
  const resultPath = join(directory, 'result.json');
  let outcome,
    result = null,
    reason,
    retryable = false;
  try {
    if (!matchesSnapshot(root, job)) throw new Error('A fonte mudou; replaneje o trabalho.');
    const processResult = await execute({
      command: process.execPath,
      args: [
        fileURLToPath(new URL('./orchestrator-task.mjs', import.meta.url)),
        root,
        job.id,
        leaseId,
      ],
      timeoutMs: job.limits.timeoutMs,
      logFile: join(directory, 'task.log'),
      cwd: root,
    });
    if (processResult.cancelled) {
      outcome = 'blocked';
      reason = 'task-cancelled:' + processResult.cancelled;
    } else if (
      processResult.timedOut ||
      processResult.outputExceeded ||
      processResult.error ||
      processResult.code !== 0
    ) {
      outcome = 'failed';
      retryable = Boolean(processResult.timedOut || processResult.error);
      reason = processResult.timedOut
        ? 'task-timeout'
        : processResult.outputExceeded
          ? 'output-limit'
          : (processResult.error ?? 'task-process-failed');
    } else {
      const payload = readResult(resultPath);
      if (
        payload.jobId !== job.id ||
        payload.leaseId !== leaseId ||
        !Object.hasOwn(payload, 'result') ||
        !['succeeded', 'blocked', 'waiting-review'].includes(payload.outcome)
      )
        throw new Error('Resultado divergente da tarefa.');
      outcome = payload.outcome;
      result = payload.result;
      reason = payload.reason ?? null;
    }
    if (!matchesSnapshot(root, job)) {
      outcome = 'blocked';
      reason = 'A fonte mudou durante a execução.';
      retryable = false;
    }
  } catch (error) {
    outcome = 'blocked';
    reason = (error instanceof Error ? error.message : 'task-error').slice(0, 2048);
  }
  return finishJob({ root, jobId: job.id, leaseId, outcome, result, reason, retryable });
}

export function reconcileReview({ root = process.cwd(), jobId }) {
  const job = getJob({ root, jobId });
  if (job.kind !== 'review') throw new Error('O trabalho não é uma revisão.');
  if (!matchesSnapshot(root, job)) throw new Error('A fonte mudou; replaneje o trabalho.');
  const request = requestReview({
    root,
    runId: job.input.runId,
    implementerId: job.input.implementerId,
    requestId: job.id,
  });
  if (request.spec !== job.spec) throw new Error('Spec da solicitação diverge do trabalho.');
  const outcomePath = join(request.directory, 'outcome.json');
  if (!existsSync(outcomePath)) return { status: 'waiting-review', jobId };
  const outcome = readResult(outcomePath);
  const response = readResult(join(request.directory, 'review-result.json'), 262144);
  const reason = responseProblem(response, request);
  if (
    reason ||
    outcome.runId !== request.runId ||
    outcome.requestId !== request.requestId ||
    outcome.spec !== job.spec ||
    outcome.commit !== job.commit ||
    outcome.sourceDigest !== job.sourceDigest ||
    outcome.releaseReady !== false ||
    !['awaiting-ci', 'changes-requested', 'blocked'].includes(outcome.status) ||
    (outcome.status === 'awaiting-ci' && response.verdict !== 'PASS')
  )
    throw new Error(reason ?? 'Parecer divergente do trabalho.');
  return resolveReviewJob({
    root,
    jobId,
    outcome: outcome.status === 'awaiting-ci' ? 'succeeded' : 'blocked',
    result: {
      runId: request.runId,
      requestId: request.requestId,
      status: outcome.status,
      directory: request.directory,
    },
  });
}
