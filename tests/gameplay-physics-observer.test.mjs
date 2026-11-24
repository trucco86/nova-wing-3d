import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectCityPhysics } from '../tools/gameplay-physics-observer.mjs';

const sample = (seconds, x = 0, changes = {}) => ({
  seconds,
  sector: 1,
  state: 'playing',
  player: { x, y: 0 },
  playerDepth: 0,
  cityPhysicalSolids: [
    {
      kind: 'wall',
      active: true,
      x: 0,
      y: 0,
      z: 0,
      halfX: 2,
      halfY: 2,
      halfZ: 2,
    },
  ],
  cityCameraOcclusion: [],
  ...changes,
});

test('persistent center penetration is a deduplicated candidate, never release approval', () => {
  const result = inspectCityPhysics([0, 1, 2, 3].map((t) => sample(t)));
  assert.equal(result.status, 'FINDINGS');
  assert.equal(result.findings.length, 1);
  assert.equal(result.findings[0].rule, 'NW-R001');
  assert.equal(result.findings[0].detectedAt, 2);
  assert.equal(result.findings[0].depth, 2);
  assert.equal(result.humanApproval, 'PENDING');
  assert.equal(result.releaseAuthorized, false);
});

test('contact tolerance, brief overlap and escaped solid are not persistent defects', () => {
  const samples = [0, 0, 1.9, 0, 4, 4].map((x, t) => sample(t, x));
  assert.equal(inspectCityPhysics(samples).status, 'OBSERVED_OK');
});

test('inactive decoration alone does not establish physics coverage', () => {
  const samples = [0, 1, 2].map((t) => sample(t, 0, { cityPhysicalSolids: [] }));
  const result = inspectCityPhysics(samples);
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.findings.length, 0);
});

test('persistent inconsistent fade is separate from physical penetration', () => {
  const samples = [0, 1, 2].map((t) =>
    sample(t, 4, {
      cityCameraOcclusion: [{ tile: 'city', kind: 'bridge', fade: 0.8, opacity: 1 }],
    }),
  );
  const result = inspectCityPhysics(samples);
  assert.equal(result.status, 'FINDINGS');
  assert.deepEqual(result.findings.map((finding) => finding.rule), ['NW-R002']);
});

test('malformed, frozen or incomplete telemetry fails closed', () => {
  assert.equal(inspectCityPhysics([]).status, 'BLOCKED');
  assert.equal(inspectCityPhysics([sample(0), sample(0), sample(1)]).status, 'BLOCKED');
  assert.equal(
    inspectCityPhysics([sample(0), sample(1, 0, { playerDepth: null }), sample(2)]).status,
    'BLOCKED',
  );
  assert.throws(() => inspectCityPhysics([], { consecutive: 1 }), /calibration/);
});
