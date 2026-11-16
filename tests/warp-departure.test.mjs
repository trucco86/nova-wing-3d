import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  warpExitAt,
  victoryDialogueAt,
  VICTORY_EXIT_SECONDS,
  createWarpStreaks,
  updateWarpStreaks,
} from '../src/warp-departure.js';

test('a defeated boss can trigger the light-speed jump only after the explosion', () => {
  assert.equal(warpExitAt(4.7, true).active, false);
  assert.equal(warpExitAt(4.88, true).active, false);
  assert.equal(warpExitAt(5, false).active, false);
  assert.equal(warpExitAt(5, true).active, true);
  assert.equal(warpExitAt(5.79, false).active, false);
  assert.equal(warpExitAt(5.8, false).active, true);
  assert.equal(warpExitAt(6.4, false).active, true);
  assert.equal(warpExitAt(7.8, false).speed, 420);
  assert.equal(VICTORY_EXIT_SECONDS, 8);
  assert.throws(() => warpExitAt(-0.1), RangeError);
});

test('the universal warp effect renders in the scene and clears on intermission', () => {
  const streaks = createWarpStreaks();
  assert.equal(streaks.visible, false);
  assert.equal(streaks.geometry.getAttribute('position').count, 96);
  assert.equal(streaks.frustumCulled, false);
  const player = new T.Vector3(8, 14, -120);
  updateWarpStreaks(streaks, true, 7, player);
  assert.equal(streaks.visible, true);
  assert.ok(streaks.position.equals(player));
  assert.ok(streaks.scale.z > 1);
  updateWarpStreaks(streaks, false, 8, player);
  assert.equal(streaks.visible, false);
  streaks.geometry.dispose();
  streaks.material.dispose();
});

test('post-boss squad lines are sequential and do not run before the first beat', () => {
  assert.equal(victoryDialogueAt(0), null);
  assert.equal(victoryDialogueAt(0.59), null);
  assert.deepEqual(
    [0.6, 2.8, 5.4].map((second) => victoryDialogueAt(second).speaker),
    ['bia', 'bob', 'calvin'],
  );
  assert.equal(victoryDialogueAt(2.79).index, 0);
  assert.equal(victoryDialogueAt(5.39).index, 1);
  assert.equal(victoryDialogueAt(9.8).index, 2);
  assert.ok(victoryDialogueAt(9.8).text.includes('SALTO DE LUZ'));
  assert.throws(() => victoryDialogueAt(Infinity), RangeError);
  assert.throws(() => victoryDialogueAt(-1), RangeError);
});
