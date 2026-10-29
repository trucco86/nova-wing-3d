import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_FAMILIES, bossAttackProgram, bossDamageMultipliers } from '../src/boss-director.js';

test('boss attack style actually differs in all ten sectors and escalates by phase', () => {
  assert.equal(BOSS_FAMILIES.length, 10);
  const signatures = new Set();
  for (let i = 0; i < 10; i++) {
    const first = bossAttackProgram(i, 1, 1);
    const enraged = bossAttackProgram(i, 3, 2);
    signatures.add(JSON.stringify(first));
    assert.ok(enraged.cadence < first.cadence);
    assert.ok(enraged.sources.length >= first.sources.length);
    assert.ok(first.sources.every((s) => [s.x, s.y, s.volley].every(Number.isFinite)));
    assert.ok(first.sources.length <= 4, 'mobile performance guardrail');
  }
  assert.equal(signatures.size, 10);
  assert.notDeepEqual(bossAttackProgram(5, 2).sources, bossAttackProgram(7, 2).sources);
  assert.throws(() => bossAttackProgram(10), RangeError);
});

test('damaging armored hull is possible but never replaces weak-point strategy', () => {
  assert.equal(bossDamageMultipliers('sealed', 2), 0);
  assert.ok(bossDamageMultipliers('hull', 2) > 0);
  assert.ok(bossDamageMultipliers('hull', 0) > bossDamageMultipliers('hull', 2));
  assert.ok(bossDamageMultipliers('generator', 2) > bossDamageMultipliers('hull', 2) * 10);
  assert.ok(bossDamageMultipliers('core', 0) > bossDamageMultipliers('hull', 0) * 5);
});
