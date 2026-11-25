import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECTS,
  SCENARIOS,
  summarizeGameplayObservations,
} from '../tools/gameplay-observer-summary.mjs';

const reports = () =>
  SCENARIOS.flatMap((scenario) =>
    PROJECTS.map((project) => ({
      scenario,
      project,
      status: 'OBSERVED_OK',
      checks: [{ id: 'scene', ok: true }],
      checkpoints: [{ name: 'start' }],
      findings: [],
    })),
  );

test('nightly summary requires fourteen journeys and never approves release', () => {
  const summary = summarizeGameplayObservations(reports());
  assert.equal(summary.status, 'OBSERVED_OK');
  assert.equal(summary.received, 14);
  assert.equal(summary.humanApproval, 'PENDING');
  assert.equal(summary.releaseAuthorized, false);
});

test('missing or blocked evidence cannot count as healthy observation', () => {
  const missing = summarizeGameplayObservations(reports().slice(1));
  assert.equal(missing.status, 'BLOCKED');
  assert.equal(missing.missing.length, 1);
  const blocked = reports();
  blocked[0].status = 'BLOCKED';
  blocked[0].error = 'WebGL init';
  assert.equal(summarizeGameplayObservations(blocked).status, 'BLOCKED');
});

test('findings produce a deterministic, deduplicable advisory signature', () => {
  const input = reports();
  input[0].status = 'FINDINGS';
  input[0].findings = [{ id: 'steering', ok: false, observed: 0 }];
  input[0].video = {
    file: 'city-desktop-review.mp4',
    triggers: ['steering'],
  };
  const first = summarizeGameplayObservations(input);
  input[0].findings[0].observed = 0.4;
  const second = summarizeGameplayObservations(input);
  assert.equal(first.status, 'FINDINGS');
  assert.equal(first.signature, second.signature);
  assert.equal(first.findings.length, 1);
});

test('duplicate identifiers are rejected, not silently overwritten', () => {
  const data = reports();
  assert.throws(() => summarizeGameplayObservations([...data, data[0]]));
});

test('unknown status or empty findings fail closed', () => {
  const input = reports();
  input[0].status = 'UNKNOWN';
  assert.equal(summarizeGameplayObservations(input).status, 'BLOCKED');
  input[0].status = 'FINDINGS';
  assert.equal(summarizeGameplayObservations(input).status, 'BLOCKED');
});

test('a finding without a review video is blocked rather than silently approved', () => {
  const input = reports();
  input[0].status = 'FINDINGS';
  input[0].findings = [{ id: 'collision', ok: false }];
  assert.equal(summarizeGameplayObservations(input).status, 'BLOCKED');
});

test('manual review is advisory, retains clip evidence and a stable signature', () => {
  const input = reports();
  input[0].status = 'REVIEW_REQUIRED';
  input[0].reviews = [{ id: 'reactor-orbit-framing', reason: 'Check visibility' }];
  input[0].video = { file: 'reactor-desktop-review.mp4', triggers: ['reactor-orbit-framing'] };
  const summary = summarizeGameplayObservations(input);
  assert.equal(summary.status, 'REVIEW_REQUIRED');
  assert.equal(summary.findings.length, 0);
  assert.equal(summary.received, 14);
  assert.equal(summary.observed[0].clip, 'reactor-desktop-review.mp4');
  assert.equal(summary.humanApproval, 'PENDING');
  assert.equal(summary.releaseAuthorized, false);
  assert.ok(summary.signature.includes('review:reactor-orbit-framing'));
});

test('review without playable clip metadata fails closed', () => {
  const input = reports();
  input[0].status = 'REVIEW_REQUIRED';
  input[0].reviews = [{ id: 'framing', reason: 'Manual check' }];
  assert.equal(summarizeGameplayObservations(input).status, 'BLOCKED');
});
