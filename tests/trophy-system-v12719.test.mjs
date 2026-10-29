import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TROPHIES, TROPHY_TIERS, PRIMARY_TROPHIES } from '../src/trophy-catalog.js';
import { createTrophySystem, readTrophies, TROPHY_STORAGE_KEY } from '../src/trophy-system.js';

const storage = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const win = (runId, overrides = {}) => ({
  type: 'stage-finished', runId, outcome: 'cleared', sector: 1,
  points: 90, kills: 15, rings: 3, durationMs: 170000,
  bossDefeated: true, primaryOnly: true, mechaFinisher: false,
  damageTaken: false, bombsUsed: false, squadSpecialUsed: false,
  difficulty: 'normal', pilot: 'bia', ...overrides,
});
const earned = (system, id) => system.list().find((trophy) => trophy.id === id);

test('catalog has 10 unique story bosses, four rarity levels and final platinum', () => {
  assert.equal(new Set(TROPHIES.map((entry) => entry.id)).size, TROPHIES.length);
  assert.equal(TROPHIES.filter((t) => t.category === 'bosses').length, 10);
  assert.deepEqual(Object.keys(TROPHY_TIERS), ['bronze', 'silver', 'gold', 'platinum']);
  assert.ok(PRIMARY_TROPHIES.length > 30);
  assert.ok(TROPHIES.find((t) => t.id === 'marvin-primary'));
});

test('genuine clears unlock sector, pure primary boss, clean sheet, no-bombs and speed', () => {
  const s = storage(), system = createTrophySystem({ storage: s, clock: () => '2026-10-29T00:00:00Z' });
  const unlocked = system.record(win('run-a'));
  for (const id of ['boss-1', 'first-flight', 'primary-one', 'clean-one',
    'no-bombs-one', 'fast-one']) assert.ok(unlocked.find((entry) => entry.id === id), id);
  assert.equal(system.record(win('run-a')).length, 0);
  assert.equal(system.summary().points, unlocked.reduce((sum, item) => sum + TROPHY_TIERS[item.tier].points, 0));
  assert.equal(readTrophies(s).processed.length, 1);
});

test('first clear is not a record; later higher score is and lesser attempts are not', () => {
  const s = storage(), system = createTrophySystem({ storage: s });
  system.record(win('a', { points: 100 }));
  assert.equal(earned(system, 'record-once').progress, 0);
  system.record(win('b', { points: 90 }));
  assert.equal(earned(system, 'record-once').progress, 0);
  system.record(win('c', { points: 105 }));
  assert.ok(earned(system, 'record-once').unlockedAt);
  assert.equal(earned(system, 'record-once').progress, 1);
});

test('boss completion with secondary damage never earns pure-gun trophies', () => {
  const system = createTrophySystem({ storage: storage() });
  system.record(win('dirty', { sector: 10, primaryOnly: false, bombsUsed: true,
    damageTaken: true, difficulty: 'hard', durationMs: 500000 }));
  assert.ok(earned(system, 'boss-10').unlockedAt);
  for (const id of ['primary-one', 'marvin-primary', 'no-bombs-one',
    'clean-one', 'fast-one', 'secret-hard-primary']) assert.equal(earned(system, id).unlockedAt, null, id);
});

test('QA, failed missions and missing run IDs never unlock; persistence survives reload', () => {
  const s = storage(), system = createTrophySystem({ storage: s });
  assert.deepEqual(system.record(win('practice', { practice: true })), []);
  assert.deepEqual(system.record(win('lost', { outcome: 'defeated' })), []);
  assert.deepEqual(system.record(win('')), []);
  assert.equal(system.summary().unlocked, 0);
  system.record(win('good', { sector: 6, difficulty: 'hard' }));
  const restored = createTrophySystem({ storage: s });
  assert.ok(earned(restored, 'boss-6').unlockedAt);
  assert.ok(earned(restored, 'secret-hard-perfect').unlockedAt);
  assert.ok(earned(restored, 'secret-hard-primary').unlockedAt);
  assert.ok(s.getItem(TROPHY_STORAGE_KEY));
});

test('corrupt or older save is isolated from campaign data', () => {
  const s = storage();
  s.setItem(TROPHY_STORAGE_KEY, '{"version":1,"stats":{}}');
  assert.equal(readTrophies(s).stats.kills, 0);
  s.setItem(TROPHY_STORAGE_KEY, '{broken');
  const system = createTrophySystem({ storage: s });
  assert.equal(system.summary().unlocked, 0);
  system.record(win('ok'));
  assert.ok(earned(system, 'boss-1').unlockedAt);
});
