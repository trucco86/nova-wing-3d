import test from 'node:test';
import assert from 'node:assert/strict';
import { newWeakpointEvidence, recordWeakpointContact, bossIntegrityRatio, weakpointReadout, REVEAL_HITS } from '../src/boss-weakpoint-feedback.js';
test('physical generator contacts reveal a real weak point, but ordinary hull hits never do', () => {
  const parts = [{ hp: 200, max: 200 }, { hp: 220, max: 220 }];
  const evidence = newWeakpointEvidence(parts);
  assert.equal(weakpointReadout(parts[0], evidence[0], false), null);
  for (let i = 1; i < REVEAL_HITS; i++) {
    recordWeakpointContact(evidence, 0, 0);
    assert.equal(evidence[0].revealed, false);
  }
  recordWeakpointContact(evidence, 0, 0);
  assert.deepEqual(weakpointReadout(parts[0], evidence[0], false), { label: 'BLINDADO · ORBITE', state: 'armored' });
  assert.deepEqual(weakpointReadout(parts[0], evidence[0], true), { label: 'FRACO · 100%', state: 'open' });
  assert.equal(evidence[1].revealed, false);
  assert.equal(recordWeakpointContact(evidence, 200, 99), null);
  recordWeakpointContact(evidence, 1, 10);
  assert.equal(evidence[1].revealed, true);
  parts[1].hp = 0;
  assert.equal(weakpointReadout(parts[1], evidence[1], true), null);
});
test('integrity changes with generator damage before core exposure', () => {
  const parts = [{ hp: 200, max: 200 }, { hp: 200, max: 200 }];
  assert.equal(bossIntegrityRatio(parts, 1000, 1000), 1);
  parts[0].hp = 100;
  assert.ok(bossIntegrityRatio(parts, 1000, 1000) < 0.85);
  parts[0].hp = parts[1].hp = 0;
  assert.ok(Math.abs(bossIntegrityRatio(parts, 1000, 1000) - 0.35) < 0.001);
  assert.equal(bossIntegrityRatio(parts, 0, 1000), 0);
});
