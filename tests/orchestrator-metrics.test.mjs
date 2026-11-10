import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectMetrics, summarizeJobs } from '../tools/orchestrator-metrics.mjs';

const runId = '11111111-1111-4111-8111-111111111111';
const requestId = '22222222-2222-4222-8222-222222222222';
const otherId = '33333333-3333-4333-8333-333333333333';
const date = (seconds) => new Date(Date.UTC(2020, 0, 1) + seconds * 1000).toISOString();
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'nw-metrics-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const save = (path, value) => {
    const file = join(root, path);
    mkdirSync(join(file, '..'), { recursive: true });
    writeFileSync(file, JSON.stringify(value));
  };
  return { root, save, run: `artifacts/orchestrator/${runId}` };
}

test('metrics preserves provenance, failures, stage percentiles and unavailable billing', (t) => {
  const { root, save, run } = fixture(t);
  save(`${run}/handoff.json`, {
    schemaVersion: 1,
    runId,
    commit: 'sha',
    sourceDigest: 'digest',
    status: 'blocked',
    reason: 'test failed',
    started: date(0),
    finished: date(8),
  });
  save(`${run}/validation.json`, {
    commit: 'sha',
    sourceDigest: 'digest',
    checks: [
      { command: 'test', exitCode: 1, durationMs: 6000 },
      { command: 'lint', exitCode: 0, durationMs: 1000 },
    ],
  });
  save(`${run}/reviews/${requestId}/request.json`, {
    schemaVersion: 1,
    runId,
    requestId,
    created: date(8),
  });
  save(`${run}/reviews/${requestId}/outcome.json`, {
    schemaVersion: 1,
    runId,
    requestId,
    status: 'changes-requested',
    recorded: date(12),
  });
  const operation = `artifacts/orchestrator/operations/${otherId}`;
  save(`${operation}/ci-observation.json`, {
    schemaVersion: 1,
    runId: otherId,
    githubRunId: 123,
    status: 'blocked',
    passed: false,
    started: date(12),
    finished: date(13),
  });
  save(`${operation}/github-run.json`, {
    jobs: [
      {
        databaseId: 1,
        name: 'browser (1)',
        status: 'completed',
        conclusion: 'failure',
        startedAt: date(3),
        completedAt: date(13),
      },
      { databaseId: 2, name: 'quality', status: 'in_progress', startedAt: date(5) },
    ],
  });
  const report = collectMetrics({ root });
  assert.deepEqual(report.sampleCounts, {
    validations: 1,
    reviews: 1,
    ci: 1,
    checks: 2,
    ciJobs: 2,
    ciRuns: 0,
  });
  assert.equal(report.failures.validations[0].reason, 'test failed');
  assert.equal(report.failures.ciJobs.length, 1);
  assert.equal(report.samples.ciJobs[0].passed, false);
  assert.equal(report.samples.ciJobs[1].passed, null);
  assert.deepEqual(report.durationsMs.validations, {
    count: 1,
    missing: 0,
    p50: 8000,
    p95: 8000,
    samples: [8000],
  });
  assert.equal(report.byStage.test.p95, 6000);
  assert.equal(report.byStage['browser (1)'].p50, 10000);
  assert.equal(report.durationsMs.ciJobs.missing, 1);
  assert.equal(report.rework.reviewChangesRequested, 1);
  assert.deepEqual(report.unavailable, { cost: null, tokens: null, humanTimeMs: null });
  assert.equal(report.releaseReady, false);
  assert.deepEqual(JSON.parse(readFileSync(report.reportPath)), report);
  const next = collectMetrics({ root });
  assert.notEqual(next.reportId, report.reportId);
  assert.deepEqual(next.sampleCounts, report.sampleCounts);
});

test('queue samples retain pending jobs, retries, waits and nearest-rank percentiles', () => {
  const first = {
    id: runId,
    taskId: 'task',
    kind: 'validation',
    status: 'succeeded',
    createdAt: date(0),
    attempts: [
      { startedAt: date(2), expiresAt: date(5), finishedAt: null, outcome: 'expired' },
      { startedAt: date(8), finishedAt: date(12), outcome: 'succeeded' },
    ],
  };
  const pending = { id: requestId, status: 'queued', createdAt: date(0), attempts: [] };
  const running = {
    id: otherId,
    status: 'running',
    createdAt: date(0),
    attempts: [{ startedAt: date(1), finishedAt: null, outcome: null }],
  };
  const summary = summarizeJobs([first, structuredClone(first), pending, running, null]);
  assert.equal(summary.count, 3);
  assert.equal(summary.duplicates, 1);
  assert.equal(summary.invalid, 1);
  assert.equal(summary.pending, 2);
  assert.equal(summary.retries, 1);
  assert.equal(summary.failedAttempts, 1);
  assert.deepEqual(summary.waitsMs.samples, [1000, 2000, 3000]);
  assert.equal(summary.waitsMs.p50, 2000);
  assert.equal(summary.waitsMs.p95, 3000);
  assert.deepEqual(summary.durationsMs, {
    count: 1,
    missing: 2,
    p50: 4000,
    p95: 4000,
    samples: [4000],
  });
  assert.throws(() => summarizeJobs({}), /array/);
});

test('empty samples and missing/invalid dates remain null, never a zero duration', (t) => {
  const { root, save, run } = fixture(t);
  const empty = collectMetrics({ root });
  assert.equal(empty.durationsMs.validations.p95, null);
  assert.equal(empty.queue.durationsMs.p50, null);
  save(`${run}/handoff.json`, {
    schemaVersion: 1,
    runId,
    status: 'awaiting-review',
    started: date(2),
    finished: date(1),
    durationMs: -1,
  });
  const report = collectMetrics({ root });
  assert.equal(report.samples.validations[0].durationMs, null);
  assert.equal(report.samples.validations[0].passed, null);
  assert.equal(report.durationsMs.validations.missing, 1);
  assert.equal(report.failures.validations.length, 0);
});

test('only known artifacts are read; symlinked files, bad schemas and oversized JSON are recorded', (t) => {
  const { root, save, run } = fixture(t);
  save(`${run}/handoff.json`, { schemaVersion: 99, runId });
  save('secret.json', { schemaVersion: 1, runId: otherId });
  mkdirSync(join(root, `artifacts/orchestrator/${otherId}`));
  symlinkSync(
    join(root, 'secret.json'),
    join(root, `artifacts/orchestrator/${otherId}/handoff.json`),
  );
  save(`${run}/arbitrary.json`, { password: 'not read' });
  writeFileSync(join(root, run, 'validation.json'), 'x'.repeat(262145));
  const report = collectMetrics({ root });
  assert.equal(report.sampleCounts.validations, 0);
  assert.equal(report.ignored.length, 3);
  assert.ok(report.ignored.every((item) => !item.path.endsWith('arbitrary.json')));
  assert.ok(!JSON.stringify(report).includes('not read'));
});

test('redirected artifact ancestors are rejected before writing outside root', (t) => {
  const { root } = fixture(t);
  const outside = mkdtempSync(join(tmpdir(), 'nw-metrics-outside-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  symlinkSync(outside, join(root, 'artifacts'));
  assert.throws(() => collectMetrics({ root }), /Diretório/);
  assert.equal(existsSync(join(outside, 'orchestrator')), false);
});

test('duplicate CI observations count the remote run and jobs only once', (t) => {
  const { root, save, run } = fixture(t);
  for (const directory of [`${run}/ci`, `artifacts/orchestrator/operations/${otherId}`]) {
    save(`${directory}/ci-observation.json`, {
      schemaVersion: 1,
      runId: otherId,
      githubRunId: 321,
      status: 'pending',
    });
    save(`${directory}/github-run.json`, { jobs: [{ name: 'quality', status: 'in_progress' }] });
  }
  const report = collectMetrics({ root });
  assert.equal(report.sampleCounts.ci, 1);
  assert.equal(report.sampleCounts.ciJobs, 1);
  assert.ok(report.ignored.some((item) => item.reason === 'Identidade duplicada.'));
});

test('enveloped GitHub facts measure completed run windows; skipped jobs remain unknown', (t) => {
  const { root, save } = fixture(t);
  const operation = `artifacts/orchestrator/operations/${runId}`;
  save(`${operation}/ci-observation.json`, {
    schemaVersion: 1,
    runId,
    githubRunId: '123',
    expectedCommit: 'sha',
    expectedDigest: 'digest',
    status: 'pending',
    durationMs: 4,
  });
  save(`${operation}/github-run.json`, {
    state: 'observed',
    data: {
      databaseId: 123,
      headSha: 'sha',
      status: 'completed',
      conclusion: 'success',
      createdAt: date(0),
      updatedAt: date(60),
      jobs: [
        {
          name: 'browser',
          status: 'completed',
          conclusion: 'skipped',
          startedAt: date(1),
          completedAt: date(1),
        },
      ],
    },
  });
  const report = collectMetrics({ root });
  assert.equal(report.durationsMs.ci.p50, 4);
  assert.equal(report.durationsMs.ciRuns.p50, 60000);
  assert.equal(report.samples.ciRuns[0].sourceDigest, 'digest');
  assert.equal(report.samples.ciJobs[0].passed, null);
  assert.equal(report.samples.ciJobs[0].durationMs, 0);
  assert.equal(report.samples.ciJobs[0].status, 'skipped');
  assert.equal(report.failures.ciJobs.length, 0);
});

test('malformed JSON and mismatched CI identity are reported without fabricated job samples', (t) => {
  const { root, save, run } = fixture(t);
  save(`${run}/handoff.json`, {});
  writeFileSync(join(root, run, 'handoff.json'), '{invalid');
  save(`${run}/ci/ci-observation.json`, {
    schemaVersion: 1,
    githubRunId: '123',
    status: 'blocked',
  });
  save(`${run}/ci/github-run.json`, {
    databaseId: 456,
    jobs: [{ name: 'quality', status: 'completed', conclusion: 'success' }],
  });
  const report = collectMetrics({ root });
  assert.equal(report.sampleCounts.ciJobs, 0);
  assert.equal(report.ignored.length, 2);
  assert.ok(report.ignored.some((item) => item.reason.includes('Identidade CI')));
});
