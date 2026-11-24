import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameplayReport } from './gameplay-quality-report.mjs';

const input = {
  scenario: 'city',
  project: 'desktop',
  viewport: { width: 1366, height: 768 },
  commit: 'abc',
  checkpoints: [{ name: 'flight' }],
  checks: [{ id: 'movement', ok: true }],
};

test('observed success never grants human approval or release authorization', () => {
  const report = gameplayReport(input);
  assert.equal(report.status, 'OBSERVED_OK');
  assert.equal(report.humanApproval, 'PENDING');
  assert.equal(report.releaseAuthorized, false);
});

test('failed observation remains visible for triage', () => {
  const checks = [{ id: 'collision', ok: false, observed: 'penetration' }];
  const report = gameplayReport({ ...input, checks });
  assert.equal(report.status, 'FINDINGS');
  assert.deepEqual(report.findings, checks);
});

test('executor error or missing observations cannot be interpreted as success', () => {
  assert.equal(gameplayReport({ ...input, error: 'timeout' }).status, 'BLOCKED');
  assert.equal(gameplayReport({ ...input, checks: [] }).status, 'BLOCKED');
  assert.equal(gameplayReport({ ...input, checkpoints: [] }).status, 'BLOCKED');
});

test('human review request is explicit without presenting it as an observed bug', () => {
  const report = gameplayReport({
    ...input,
    reviews: [
      {
        id: 'reactor-orbit-framing',
        reason: 'Visual camera composition requires a human decision',
      },
    ],
  });
  assert.equal(report.status, 'REVIEW_REQUIRED');
  assert.equal(report.findings.length, 0);
  assert.equal(report.reviews.length, 1);
  assert.equal(report.humanApproval, 'PENDING');
  assert.equal(report.releaseAuthorized, false);
});
