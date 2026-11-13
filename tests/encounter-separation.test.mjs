import test from 'node:test';
import assert from 'node:assert/strict';
import { bossEncounterGate, SUBBOSS_BOSS_RECOVERY_SECONDS } from '../src/encounter-separation.js';

const base = { elapsed: 120, subbossStarted: true, subbossClearedAt: 100, activeSubboss: false };
test('boss cannot begin before mid-stage subboss starts', () => {
  assert.equal(bossEncounterGate({ ...base, subbossStarted: false }), false);
});
test('boss cannot overlap an active subboss even if stage timer expires', () => {
  assert.equal(bossEncounterGate({ ...base, activeSubboss: true }), false);
});
test('boss must wait for defeat or completed retreat', () => {
  assert.equal(bossEncounterGate({ ...base, subbossClearedAt: null }), false);
});
test('boss must wait for distinct recovery beat after subboss', () => {
  assert.equal(bossEncounterGate({ ...base, subbossClearedAt: 119 }), false);
  assert.equal(bossEncounterGate({ ...base, subbossClearedAt: 120 - SUBBOSS_BOSS_RECOVERY_SECONDS }), true);
});
test('boss respects tunnel and other blockers', () => {
  assert.equal(bossEncounterGate({ ...base, blocked: true }), false);
});
test('invalid encounter timing cannot bypass gate', () => {
  assert.equal(bossEncounterGate({ ...base, subbossClearedAt: 130 }), false);
  assert.equal(bossEncounterGate({ ...base, elapsed: NaN }), false);
});
