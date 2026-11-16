import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bossEncounterGate, SUBBOSS_BOSS_RECOVERY_SECONDS } from '../src/encounter-separation.js';

const source = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');

// The helper had tests before, but the game could still bypass it if its
// call site or clearance timestamp were inadvertently removed in a merge.
test('QA155: the ordinary runtime gates the final boss behind its subboss', () => {
  assert.match(source, /subDone = true;\s*enemy\('subboss'\)/);
  assert.match(
    source,
    /const activeSubboss = enemies\.some\(\(e\) => !e\.dead && e\.kind === 'subboss'\);/,
  );
  assert.match(
    source,
    /bossEncounterGate\(\{\s*elapsed,\s*subbossStarted: subDone,\s*subbossClearedAt,\s*activeSubboss,\s*blocked: bossBlocked,/,
  );
  assert.match(
    source,
    /elapsed >= current\(\)\.duration &&\s*!boss &&\s*bossSeparated &&\s*bossWarned &&\s*bossWarningTime === 0/,
  );
  assert.match(source, /bossWarningTime = 3\.5;/);
});

test('QA155: all normal subboss exits record the recovery timestamp', () => {
  assert.match(source, /if \(e\.kind === 'subboss'\) \{\s*subbossClearedAt = elapsed;/);
  assert.match(source, /if \(departure\?\.complete\) \{\s*subbossClearedAt = elapsed;/);
  assert.match(
    source,
    /if \(e\.o\.position\.z > 40\) \{\s*if \(e\.kind === 'subboss'\) \{[\s\S]*?subbossClearedAt = elapsed;/,
  );
  assert.match(source, /subbossClearedAt = null;/);
});

test('QA155: elapsed time alone cannot bypass subboss recovery or a blocked arena', () => {
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
