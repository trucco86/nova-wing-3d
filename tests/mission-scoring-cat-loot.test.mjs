import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMissionScoring, formatMissionTime, MAX_COMBO } from '../src/mission-scoring.js';
import { PET_ITEMS, readPetCare, collectPetItem } from '../src/pet-collectibles.js';

test('faster boss clears get higher bonuses after the scripted flight runway', () => {
  const quick = createMissionScoring(145).finish({
    durationSeconds: 165,
    cleared: true,
    noDamage: false,
  });
  const slow = createMissionScoring(145).finish({
    durationSeconds: 225,
    cleared: true,
    noDamage: false,
  });
  assert.ok(quick.timeBonus > slow.timeBonus);
  assert.equal(slow.timeBonus, 0);
  assert.equal(quick.cleanBonus, 0);
  assert.equal(formatMissionTime(165), '02:45');
});

test('combo rewards confirmed hits only, expires naturally, caps, and breaks on damage', () => {
  const s = createMissionScoring(100);
  assert.equal(s.hit(0), 0);
  assert.equal(s.hit(-2), 0);
  assert.equal(s.hit(5), 2);
  for (let i = 0; i < 40; i++) s.hit(1);
  assert.equal(s.snapshot().maxCombo, MAX_COMBO);
  const before = s.snapshot().maxCombo;
  s.damage();
  assert.equal(s.snapshot().combo, 0);
  assert.equal(s.hit(1), 2);
  s.advance(4.6);
  assert.equal(s.snapshot().combo, 0);
  assert.equal(s.snapshot().maxCombo, before);
});

test('real dodges and cat pickups are bounded and completion rewards are one-time', () => {
  const s = createMissionScoring(90);
  for (let i = 0; i < 90; i++) s.dodge();
  s.pickup();
  assert.equal(s.snapshot().dodges, 80);
  assert.equal(s.snapshot().pickups, 1);
  const result = s.finish({ durationSeconds: 112, cleared: true, noDamage: true });
  assert.equal(result.cleanBonus, 175);
  assert.equal(result.totalBonus, result.timeBonus + 175);
  assert.deepEqual(s.finish({ durationSeconds: 2, cleared: false }), result);
  assert.equal(s.hit(20), 0);
});

test('defeats and invalid seconds never give a time or perfect bonus', () => {
  const result = createMissionScoring(90).finish({
    durationSeconds: Number.NaN,
    cleared: false,
    noDamage: true,
  });
  assert.equal(result.timeBonus, 0);
  assert.equal(result.cleanBonus, 0);
  assert.equal(formatMissionTime(Number.NaN), '00:00');
});

test('cat rewards exclude dog bones and keep legacy campaign pet counts readable', () => {
  assert.deepEqual(
    PET_ITEMS.map((item) => item.id),
    ['can', 'fish', 'pouch', 'treat', 'toy', 'catnip'],
  );
  assert.equal(
    PET_ITEMS.some((item) => /osso|bone|litter|areia/i.test(item.name + item.id)),
    false,
  );
  const previous = readPetCare({ can: 3, litter: 9 });
  assert.equal(previous.can, 3);
  assert.equal(previous.litter, 9);
  const tuna = collectPetItem(previous, 'can');
  assert.equal(tuna.care.can, 4);
  assert.equal(tuna.effect, 'shield');
  assert.equal(collectPetItem(previous, 'litter'), null);
  assert.equal(collectPetItem(previous, 'bone'), null);
  for (const item of PET_ITEMS) {
    const reward = collectPetItem(previous, item.id);
    assert.ok(reward.points > 0);
    assert.ok(reward.amount > 0);
    assert.ok(['energy', 'shield', 'xp', 'arcana'].includes(reward.effect));
  }
});
