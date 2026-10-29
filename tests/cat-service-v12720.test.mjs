import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAT_RANKS, CAT_MEDALS, PILOT_IDS, catRankForPoints, catUniformForRank } from '../src/cat-rank-catalog.js';
import { createCatService, readCatService, servicePoints, CAT_SERVICE_STORAGE_KEY } from '../src/cat-service.js';

const memory = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};
const clear = (runId, values = {}) => ({
  type: 'stage-finished', runId, sector: 1, outcome: 'cleared',
  pilot: 'bia', points: 160, kills: 20, rings: 4, durationMs: 175000,
  difficulty: 'normal', bossDefeated: true, damageTaken: false, bombsUsed: false,
  primaryOnly: true, mechaFinisher: false, squadSpecialUsed: false,
  newRecord: false, trophiesUnlocked: 0, ...values,
});

test('ten titles and five visual uniform tiers preserve all five real cat IDs', () => {
  assert.equal(CAT_RANKS.length, 10);
  assert.equal(CAT_MEDALS.length, 12);
  assert.deepEqual(PILOT_IDS, ['bia', 'bob', 'christopher', 'calvin', 'jenifer']);
  assert.equal(catRankForPoints(0).title, 'Recruta');
  assert.equal(catRankForPoints(3750).title, 'Lenda Five Cats');
  assert.equal(catUniformForRank(0), 0);
  assert.equal(catUniformForRank(9), 4);
});

test('valid mission grants service points only to its pilot, medals and promotions once', () => {
  const storage = memory();
  const service = createCatService({ storage });
  const result = service.record(clear('one'));
  assert.ok(result.accepted);
  assert.ok(result.points >= 150);
  assert.equal(service.pilotView('bia').wins, 1);
  assert.equal(service.pilotView('bob').wins, 0);
  assert.ok(result.medals.some((medal) => medal.id === 'bronze-claw'));
  assert.ok(result.medals.some((medal) => medal.id === 'cat-eye'));
  assert.ok(result.medals.some((medal) => medal.id === 'nine-lives'));
  assert.ok(result.promotion);
  assert.equal(service.record(clear('one')).accepted, false);
  assert.equal(service.pilotView('bia').wins, 1);
  assert.equal(createCatService({ storage }).pilotView('bia').points, result.points);
});

test('five unique boss sectors required for silver claw; repeats do not inflate unique boss count', () => {
  const service = createCatService({ storage: memory() });
  for (let i = 1; i <= 5; i++)
    service.record(clear('boss-' + i, { sector: i, pilot: 'jenifer' }));
  assert.equal(service.pilotView('jenifer').bossSectors.length, 5);
  assert.ok(service.pilotView('jenifer').medals.includes('silver-claw'));
  service.record(clear('repeat', { sector: 5, pilot: 'jenifer' }));
  assert.equal(service.pilotView('jenifer').bossSectors.length, 5);
  assert.equal(service.pilotView('bia').points, 0);
});

test('pilot specialty bonuses vary with real gameplay, not XP multipliers', () => {
  const shared = clear('special', { bossDefeated: false, damageTaken: true, squadSpecialUsed: false });
  assert.ok(servicePoints({ ...shared, pilot: 'bob', damageTaken: false }) >
    servicePoints({ ...shared, pilot: 'bob', damageTaken: true }));
  assert.ok(servicePoints({ ...shared, pilot: 'calvin', squadSpecialUsed: true }) >
    servicePoints({ ...shared, pilot: 'calvin', squadSpecialUsed: false }));
  assert.ok(servicePoints({ ...shared, pilot: 'jenifer', newRecord: true }) >
    servicePoints({ ...shared, pilot: 'jenifer', newRecord: false }));
});

test('invalid, defeated, practice and replayed runs never promote cats', () => {
  const service = createCatService({ storage: memory() });
  for (const e of [
    clear('dev', { practice: true }),
    clear('lose', { outcome: 'defeated' }),
    clear('broken', { sector: 11 }),
    clear('invalid', { pilot: 'marvin' }),
    clear(''),
  ]) assert.equal(service.record(e).accepted, false);
  assert.equal(service.squad().points, 0);
  service.record(clear('legit'));
  assert.equal(service.record(clear('legit')).accepted, false);
});

test('Marvin medal, hard medal, trophy bonus and corrupt storage recovery', () => {
  const storage = memory(), service = createCatService({ storage });
  const reward = service.record(clear('marvin', {
    sector: 10, pilot: 'calvin', difficulty: 'hard',
    trophiesUnlocked: 2,
  }));
  assert.ok(reward.medals.some((m) => m.id === 'marvin-shadow'));
  assert.ok(reward.medals.some((m) => m.id === 'feline-shield'));
  assert.ok(service.squad().points > 0);
  assert.equal(readCatService(storage).pilots.calvin.marvinWins, 1);
  storage.setItem(CAT_SERVICE_STORAGE_KEY, '{broken');
  assert.equal(createCatService({ storage }).pilotView('calvin').points, 0);
});
