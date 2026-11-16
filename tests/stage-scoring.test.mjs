import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Object3D, Vector3 } from 'three';
import { comboBonus, nearMissCrossing, scoreStageClear, stageClock } from '../src/stage-scoring.js';
import { collectPetItem, PET_ITEMS, readPetCare } from '../src/pet-collectibles.js';

test('stage timer is deterministic and does not apply a real-time pause penalty', () => {
  assert.equal(stageClock(0), '00:00');
  assert.equal(stageClock(125.9), '02:05');
  assert.equal(stageClock(-1), '00:00');
  assert.equal(stageClock(NaN), '00:00');
});

test('speed bonus strictly falls with completion time and clean shield awards once', () => {
  assert.deepEqual(scoreStageClear({ seconds: 130, baselineSeconds: 145, damageTaken: false }), {
    speed: 600,
    pristine: 400,
    total: 1000,
  });
  const fast = scoreStageClear({ seconds: 165, baselineSeconds: 145, damageTaken: true });
  const slow = scoreStageClear({ seconds: 200, baselineSeconds: 145, damageTaken: true });
  assert.ok(fast.speed > slow.speed);
  assert.equal(fast.pristine, 0);
  assert.equal(scoreStageClear({ seconds: 999, baselineSeconds: 145, damageTaken: true }).total, 0);
  assert.equal(scoreStageClear({ seconds: NaN, baselineSeconds: 145, damageTaken: true }).speed, 0);
});

test('combos reward consecutive enemies but have a bounded maximum', () => {
  assert.equal(comboBonus(1), 0);
  assert.equal(comboBonus(2), 10);
  assert.equal(comboBonus(5), 40);
  assert.equal(comboBonus(60), 80);
  assert.equal(comboBonus(-4), 0);
});

test('real near misses require physical swept trajectory crossing the ship plane', () => {
  const ship = { x: 0, y: 0, z: 9 };
  assert.ok(nearMissCrossing({ x: 7, y: 0, z: -8 }, { x: 7, y: 0, z: 20 }, ship));
  assert.equal(nearMissCrossing({ x: 0, y: 0, z: -8 }, { x: 0, y: 0, z: 20 }, ship), false);
  assert.equal(nearMissCrossing({ x: 12, y: 0, z: -8 }, { x: 12, y: 0, z: 20 }, ship), false);
  assert.equal(nearMissCrossing({ x: 7, y: 0, z: -8 }, { x: 7, y: 0, z: -2 }, ship), false);
  assert.equal(nearMissCrossing({ x: 0, y: 0, z: 9 }, { x: 9, y: 0, z: 9 }, ship), false);
});

test('real fighter coordinates are used for near-miss scoring and trophy progression', () => {
  const fighter = new Object3D();
  fighter.position.set(0, 0, 9);
  const from = new Vector3(7, 0, -8);
  const to = new Vector3(7, 0, 20);

  // Passing a Three.js Object3D directly silently fails the finite check;
  // gameplay must pass its Vector3 position, as it does for projectile hits.
  assert.equal(nearMissCrossing(from, to, fighter), false);
  assert.equal(nearMissCrossing(from, to, fighter.position), true);
  assert.equal(nearMissCrossing(new Vector3(0, 0, -8), new Vector3(0, 0, 20), fighter.position), false);
  assert.equal(nearMissCrossing(new Vector3(12, 0, -8), new Vector3(12, 0, 20), fighter.position), false);

  // Guard the live game call path, not just the math helper's happy path.
  const gameSource = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
  assert.match(gameSource, /nearMissCrossing\(from, b\.o\.position, player\.position\)/);
});

test('collectibles contain only cat-appropriate items and preserve previous save IDs', () => {
  assert.deepEqual(
    PET_ITEMS.map((item) => item.id),
    ['can', 'treat', 'toy', 'litter'],
  );
  assert.deepEqual(
    PET_ITEMS.map((item) => item.name),
    ['ATUM', 'PEIXE', 'RATINHO', 'SACHÊ'],
  );
  assert.equal(
    PET_ITEMS.some((item) => /osso|bone|dog/i.test(item.name)),
    false,
  );
  const legacy = readPetCare({ can: 3, treat: 2, toy: 4, litter: 1 });
  assert.deepEqual(legacy, { can: 3, treat: 2, toy: 4, litter: 1 });
  for (const item of PET_ITEMS) {
    const result = collectPetItem(legacy, item.id);
    assert.ok(result.points > 0);
    assert.ok(['shield', 'energy', 'xp'].includes(result.perk.type));
    assert.ok(result.perk.amount > 0);
    assert.equal(result.care[item.id], legacy[item.id] + 1);
  }
  assert.equal(collectPetItem(legacy, 'bone'), null);
});
