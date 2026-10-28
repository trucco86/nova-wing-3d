import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bossSignatureVolley, bossSignaturePose, SIGNATURE_BOSSES } from '../src/boss-signature.js';

test('four signature bosses have distinct spatial attacks, more than renaming the same projectiles', () => {
  assert.deepEqual(SIGNATURE_BOSSES, [2, 5, 6, 9]);
  const signatures = new Set();
  for (const boss of SIGNATURE_BOSSES) {
    const attack = bossSignatureVolley(boss, 4, 2);
    assert.ok(attack.shots.length >= 4 && attack.shots.length <= 10);
    assert.ok(attack.shots.every((s) => [...s.origin, ...s.target].every(Number.isFinite)));
    const origins = new Set(attack.shots.map((s) => s.origin.join(':')));
    assert.ok(origins.size > 2, 'shots must launch from different real body parts');
    signatures.add(JSON.stringify(attack.shots));
    assert.notDeepEqual(
      bossSignaturePose(boss, 2, 2, 'windup'),
      bossSignaturePose(boss, 2, 2, 'attack'),
    );
  }
  assert.equal(signatures.size, SIGNATURE_BOSSES.length);
  assert.equal(bossSignatureVolley(0), null, 'other encounters keep their verified behavior');
});
test('destroying a glacial generator disables its matching cannon without skipping core phase', () => {
  const both = bossSignatureVolley(5, 1, 3, [true, true]);
  const left = bossSignatureVolley(5, 1, 3, [true, false]);
  const core = bossSignatureVolley(5, 1, 3, [false, false]);
  assert.equal(both.shots.length, 8);
  assert.equal(left.shots.length, 4);
  assert.ok(left.shots.every((s) => s.origin[0] < 0));
  assert.equal(core.shots.length, 1);
  assert.equal(core.shots[0].origin[0], 0);
});
test('hydra and Marvin reconfigure active attack modules instead of using dead generators', () => {
  for (const id of [6, 9]) {
    const both = bossSignatureVolley(id, 2, 3, [true, true]);
    const one = bossSignatureVolley(id, 2, 3, [false, true]);
    assert.ok(one.shots.length < both.shots.length);
    assert.ok(one.shots.every((s) => s.origin[0] >= 0));
    assert.ok(bossSignatureVolley(id, 2, 3, [false, false]).shots.length >= 1);
  }
});
test('combat choreography is time-driven, finite and unique across four bosses', () => {
  for (const id of SIGNATURE_BOSSES) {
    const a = bossSignaturePose(id, 1, 1, 'windup');
    const b = bossSignaturePose(id, 3, 3, 'attack');
    assert.notDeepEqual(a, b);
    assert.ok(Object.values(a).every(Number.isFinite));
    assert.ok(Object.values(b).every(Number.isFinite));
  }
});
