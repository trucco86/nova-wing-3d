import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bossEncounterGate, SUBBOSS_BOSS_RECOVERY_SECONDS } from '../src/encounter-separation.js';

const source = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');

// A correct helper is insufficient if the real game loop stops calling it.
test('QA155: the game loop wires subboss resolution to the final boss gate', () => {
  for (const contract of [
    "enemy('subboss')",
    'const activeSubboss = enemies.some(',
    'bossEncounterGate({',
    'subbossStarted: subDone',
    'subbossClearedAt,',
    'activeSubboss,',
    'blocked: bossBlocked',
    'bossSeparated &&',
    'bossWarned &&',
    'bossWarningTime === 0',
    'bossWarningTime = 3.5;',
  ]) {
    assert.ok(source.includes(contract), 'Missing runtime gate: ' + contract);
  }
});

test('QA155: all natural subboss exits record the recovery timestamp', () => {
  const recorded = source.match(/subbossClearedAt = elapsed;/g) ?? [];
  assert.ok(recorded.length >= 3, 'Defeat, scripted exit and retreat must record time');
  assert.ok(source.includes('subbossClearedAt = null;'), 'Reset between sectors is required');
});

test('QA155: elapsed time alone never bypasses the recovered subboss gate', () => {
  const event = {
    elapsed: 82,
    subbossStarted: true,
    subbossClearedAt: 75,
    activeSubboss: false,
    blocked: false,
  };
  assert.equal(bossEncounterGate(event), false);
  assert.equal(
    bossEncounterGate({ ...event, elapsed: 75 + SUBBOSS_BOSS_RECOVERY_SECONDS }),
    true,
  );
  assert.equal(bossEncounterGate({ ...event, elapsed: 200, activeSubboss: true }), false);
  assert.equal(bossEncounterGate({ ...event, elapsed: 200, blocked: true }), false);
  assert.equal(bossEncounterGate({ ...event, elapsed: 200, subbossStarted: false }), false);
  assert.equal(bossEncounterGate({ ...event, elapsed: 200, subbossClearedAt: null }), false);
});
