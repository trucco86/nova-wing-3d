import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enqueueJob, claimJob, finishJob, listJobs, getJob } from '../tools/orchestrator-queue.mjs';
import { workOne, runTaskProcess, reconcileReview } from '../tools/orchestrator-worker.mjs';
import { check, plan } from '../tools/orchestrator.mjs';
import { recordReview } from '../tools/agent-review.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'nw-queue-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'specs'));
  writeFileSync(join(root, 'specs', 'task.md'), '# Queue task\n');
  writeFileSync(join(root, '.gitignore'), 'artifacts/\n');
  for (const args of [
    ['init', '-q'],
    ['add', '.'],
    ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'],
  ])
    assert.equal(spawnSync('git', args, { cwd: root }).status, 0);
  return { root, kind: 'evaluations', spec: 'specs/task.md', taskId: 'sample' };
}

test('enqueue is persistent and idempotent, with conflicting task keys rejected', (t) => {
  const options = fixture(t);
  const first = enqueueJob(options);
  assert.equal(enqueueJob(options).id, first.id);
  assert.equal(listJobs(options).length, 1);
  assert.throws(() => enqueueJob({ ...options, kind: 'validation' }), /outro contrato/);
  assert.throws(() => enqueueJob({ ...options, kind: 'shell' }), /inválido/);
  assert.throws(() => enqueueJob({ ...options, input: { command: 'publish' } }), /inválida/);
  assert.equal(first.releaseReady, false);
});

test('concurrent processes claim each job once', async (t) => {
  const options = fixture(t);
  const jobs = Array.from({ length: 4 }, (_, n) => enqueueJob({ ...options, taskId: 'task-' + n }));
  const module = fileURLToPath(new URL('../tools/orchestrator-queue.mjs', import.meta.url));
  const claim = (worker) =>
    new Promise((resolve, reject) => {
      const script = `import {claimJob} from ${JSON.stringify(module)}; console.log(JSON.stringify(claimJob({root:process.argv[1],workerId:process.argv[2]})));`;
      const process = spawn(globalThis.process.execPath, [
        '--input-type=module',
        '-e',
        script,
        options.root,
        worker,
      ]);
      let output = '',
        error = '';
      process.stdout.on('data', (chunk) => (output += chunk));
      process.stderr.on('data', (chunk) => (error += chunk));
      process.on('error', reject);
      process.on('close', (code) =>
        code === 0 ? resolve(JSON.parse(output)) : reject(new Error(error)),
      );
    });
  const claimed = await Promise.all(Array.from({ length: 8 }, (_, n) => claim('worker-' + n)));
  const ids = claimed.filter(Boolean).map((job) => job.id);
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, 4);
  assert.deepEqual(new Set(ids), new Set(jobs.map((job) => job.id)));
});

test('lease expiry resumes after restart and fences the old completion', (t) => {
  const options = fixture(t);
  const now = Date.now();
  const job = enqueueJob({ ...options, timeoutMs: 100, leaseMs: 200, now });
  const old = claimJob({ ...options, workerId: 'old', now });
  const resumed = claimJob({ ...options, workerId: 'new', now: now + 201 });
  assert.equal(resumed.id, job.id);
  assert.equal(resumed.attempts.length, 2);
  assert.equal(resumed.attempts[0].outcome, 'expired');
  assert.throws(
    () =>
      finishJob({
        ...options,
        jobId: job.id,
        leaseId: old.attempts[0].leaseId,
        outcome: 'succeeded',
        now: now + 202,
      }),
    /Lease perdida/,
  );
  const done = finishJob({
    ...options,
    jobId: job.id,
    leaseId: resumed.attempts[1].leaseId,
    outcome: 'succeeded',
    result: { ok: true },
    now: now + 202,
  });
  const again = finishJob({
    ...options,
    jobId: job.id,
    leaseId: resumed.attempts[1].leaseId,
    outcome: 'succeeded',
    result: { ok: true },
    now: now + 203,
  });
  assert.equal(done.status, 'succeeded');
  assert.equal(again.events.length, done.events.length);
  assert.equal(getJob({ ...options, jobId: job.id }).attempts.length, 2);
});

test('attempt limits stop repeated lease loss and operational failures', (t) => {
  const options = fixture(t),
    now = Date.now();
  const job = enqueueJob({ ...options, timeoutMs: 100, leaseMs: 200, now });
  claimJob({ ...options, workerId: 'one', now });
  claimJob({ ...options, workerId: 'two', now: now + 201 });
  assert.equal(claimJob({ ...options, workerId: 'three', now: now + 402 }), null);
  assert.equal(getJob({ ...options, jobId: job.id }).status, 'failed');
  const retry = enqueueJob({ ...options, taskId: 'retry' });
  const attempt = claimJob({ ...options, workerId: 'one' }).attempts.at(-1);
  assert.equal(
    finishJob({
      ...options,
      jobId: retry.id,
      leaseId: attempt.leaseId,
      outcome: 'failed',
      reason: 'ETIMEDOUT',
      retryable: true,
    }).status,
    'queued',
  );
  const next = claimJob({ ...options, workerId: 'two' }).attempts.at(-1);
  assert.equal(
    finishJob({
      ...options,
      jobId: retry.id,
      leaseId: next.leaseId,
      outcome: 'failed',
      reason: 'ETIMEDOUT',
      retryable: true,
    }).status,
    'failed',
  );
});

test('behavioral blocks never retry automatically and invalid limits are rejected', (t) => {
  const options = fixture(t);
  assert.throws(() => enqueueJob({ ...options, maxAttempts: 6 }), /Limites/);
  assert.throws(() => enqueueJob({ ...options, timeoutMs: 1000, leaseMs: 500 }), /Limites/);
  const job = enqueueJob(options);
  const claim = claimJob({ ...options, workerId: 'worker' });
  assert.equal(
    finishJob({
      ...options,
      jobId: job.id,
      leaseId: claim.attempts[0].leaseId,
      outcome: 'blocked',
      retryable: true,
    }).status,
    'blocked',
  );
  assert.equal(claimJob({ ...options, workerId: 'worker' }), null);
});

test('worker executes a bounded typed task and blocks changed snapshots', async (t) => {
  const options = fixture(t);
  const job = enqueueJob(options);
  let executed = 0;
  const execute = async ({ args, logFile }) => {
    executed++;
    const [root, id, leaseId] = args.slice(-3);
    assert.equal(root, options.root);
    const resultPath = join(logFile, '..', 'result.json');
    writeFileSync(
      resultPath,
      JSON.stringify({ jobId: id, leaseId, outcome: 'succeeded', result: { status: 'passed' } }),
    );
    return { code: 0 };
  };
  const result = await workOne({ ...options, workerId: 'worker' }, execute);
  assert.equal(result.id, job.id);
  assert.equal(result.status, 'succeeded');
  enqueueJob({ ...options, taskId: 'stale' });
  writeFileSync(join(options.root, 'source.js'), 'changed');
  const blocked = await workOne({ ...options, workerId: 'worker' }, execute);
  assert.equal(blocked.status, 'blocked');
  assert.equal(executed, 1);
});

test('worker rejects a result for another lease and retains process failure', async (t) => {
  const options = fixture(t);
  enqueueJob(options);
  const wrong = await workOne({ ...options, workerId: 'worker' }, async ({ logFile }) => {
    writeFileSync(
      join(logFile, '..', 'result.json'),
      JSON.stringify({ jobId: 'wrong', leaseId: 'wrong', outcome: 'succeeded' }),
    );
    return { code: 0 };
  });
  assert.equal(wrong.status, 'blocked');
  enqueueJob({ ...options, taskId: 'process-error', maxAttempts: 1 });
  const failed = await workOne({ ...options, workerId: 'worker' }, async () => ({
    code: 1,
    timedOut: true,
  }));
  assert.equal(failed.status, 'failed');
  assert.equal(failed.attempts[0].reason, 'task-timeout');
});

test('real task process timeout terminates its process group', async (t) => {
  const options = fixture(t);
  const result = await runTaskProcess({
    command: process.execPath,
    args: ['-e', 'setInterval(()=>{},1000)'],
    timeoutMs: 150,
    logFile: join(options.root, 'timeout.log'),
    cwd: options.root,
  });
  assert.equal(result.timedOut, true);
  assert.equal(result.code, null);
  assert.ok(readFileSync(join(options.root, 'timeout.log'), 'utf8').length < 1000);
});

test('an unavailable log fails without hanging or overwriting it', async (t) => {
  const options = fixture(t),
    logFile = join(options.root, 'existing.log');
  writeFileSync(logFile, 'preserve');
  const result = await runTaskProcess({
    command: process.execPath,
    args: ['-e', 'setInterval(()=>{},1000)'],
    timeoutMs: 1000,
    logFile,
    cwd: options.root,
  });
  assert.equal(result.error, 'EEXIST');
  assert.equal(readFileSync(logFile, 'utf8'), 'preserve');
});

test('queue rejects symlinked stores', (t) => {
  const options = fixture(t);
  enqueueJob(options);
  const db = join(options.root, 'artifacts', 'orchestrator', 'queue.sqlite');
  rmSync(db);
  symlinkSync(join(options.root, 'specs', 'task.md'), db);
  assert.throws(() => listJobs(options), /redirecionado/);
});

test('dangling SQLite and WAL symlinks never create targets outside the store', (t) => {
  for (const suffix of ['', '-wal', '-shm']) {
    const options = fixture(t);
    enqueueJob(options);
    const file = join(options.root, 'artifacts', 'orchestrator', 'queue.sqlite' + suffix);
    rmSync(file, { force: true });
    const outside = join(options.root, 'outside-' + (suffix || 'db'));
    symlinkSync(outside, file);
    assert.throws(() => listJobs(options), /redirecionado/);
    assert.equal(existsSync(outside), false);
  }
});

test('invalid CLI arity has no durable enqueue side effect', (t) => {
  const options = fixture(t);
  const cli = fileURLToPath(new URL('../tools/orchestrator-cli.mjs', import.meta.url));
  const result = spawnSync(
    process.execPath,
    [cli, 'queue-enqueue', 'evaluations', options.spec, 'bad-args', 'extra', 'args'],
    { cwd: options.root, encoding: 'utf8' },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /extras/);
  assert.equal(existsSync(join(options.root, 'artifacts')), false);
});

test('review jobs bind the exact spec, dispatch once, and reconcile the real recorded review', async (t) => {
  const options = fixture(t);
  const other = 'specs/other.md';
  writeFileSync(join(options.root, other), '# Another task\n');
  const run = check({ root: options.root, spec: other }, () => {
    const snapshot = plan({ root: options.root, spec: other });
    writeFileSync(
      join(options.root, 'artifacts', 'validation.json'),
      JSON.stringify({
        started: new Date().toISOString(),
        finished: new Date().toISOString(),
        commit: snapshot.commit,
        sourceDigest: snapshot.sourceDigest,
        passed: true,
        browser: 'not-run',
        checks: ['format:check', 'lint', 'test', 'check:repo', 'build:check'].map((command) => ({
          command,
          exitCode: 0,
          error: null,
        })),
      }),
    );
    return { status: 0 };
  });
  const input = { runId: run.runId, implementerId: '/root' };
  assert.throws(() => enqueueJob({ ...options, kind: 'review', input }), /Spec ou versão/);
  const job = enqueueJob({ ...options, spec: other, kind: 'review', input });
  assert.equal(
    enqueueJob({
      ...options,
      spec: other,
      kind: 'review',
      input: { implementerId: '/root', runId: run.runId },
    }).id,
    job.id,
  );
  const dispatched = await workOne({ root: options.root, workerId: 'dispatcher' });
  assert.equal(dispatched.status, 'waiting-review');
  const directory = join(options.root, 'artifacts', 'orchestrator', run.runId, 'reviews', job.id);
  const request = JSON.parse(readFileSync(join(directory, 'request.json')));
  assert.equal(request.spec, other);
  writeFileSync(
    join(directory, 'response.json'),
    JSON.stringify({
      ...request.responseExample,
      reviewerId: '/root/qa',
      checks: [{ command: 'node --test actual-fixture', outcome: 'passed' }],
    }),
  );
  const recorded = recordReview({ root: options.root, runId: run.runId, requestId: job.id });
  assert.equal(recorded.spec, other);
  const done = reconcileReview({ root: options.root, jobId: job.id });
  assert.equal(done.status, 'succeeded');
  assert.equal(
    reconcileReview({ root: options.root, jobId: job.id }).events.length,
    done.events.length,
  );
});

test('SIGTERM of a worker stops its detached task before a delayed write', async (t) => {
  const options = fixture(t);
  const workerModule = fileURLToPath(new URL('../tools/orchestrator-worker.mjs', import.meta.url));
  const late = join(options.root, 'orphan-write');
  const script = `import {runTaskProcess} from ${JSON.stringify(workerModule)};
    const promise=runTaskProcess({command:process.execPath,args:['-e',${JSON.stringify("setTimeout(()=>require('fs').writeFileSync(process.argv[1],'orphan'),600);setInterval(()=>{},1000)")},process.argv[2]],timeoutMs:5000,logFile:process.argv[3],cwd:process.argv[1]});
    console.log('started'); const result=await promise; console.log(JSON.stringify(result));`;
  const child = spawn(process.execPath, [
    '--input-type=module',
    '-e',
    script,
    options.root,
    late,
    join(options.root, 'cancel.log'),
  ]);
  let output = '';
  const exited = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => resolve(code));
  });
  await new Promise((resolve) =>
    child.stdout.on('data', (chunk) => {
      output += chunk;
      if (output.includes('started')) resolve();
    }),
  );
  child.kill('SIGTERM');
  assert.equal(await exited, 143);
  // Wait beyond the deliberate delayed write: an orphan would create this file.
  await new Promise((resolve) => setTimeout(resolve, 700));
  assert.equal(existsSync(late), false);
});
