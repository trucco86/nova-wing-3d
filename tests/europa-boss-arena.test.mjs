import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { bossTacticsAt } from '../src/tactics.js';
import { bossDepartureAt } from '../src/boss-departure.js';
import { createWorld } from '../src/visuals.js';
import {
  europaBossMinimumCenterHeight,
  europaBossArenaHeight,
  europaBossFloorY,
  europaBossArenaDepth,
  EUROPA_ARENA_BOSS_DEPTH,
  EUROPA_ARENA_MIN_CENTER_TARGET,
  EUROPA_ARENA_FLOOR_Y,
  EUROPA_ARENA_FLOOR_GAP,
  EUROPA_ARENA_PORTRAIT_FOV,
  europaBossPortraitFov,
} from '../src/europa-boss-arena.js';

test('Europa Colossus legs, hull and ice-quake visual never penetrate the ice floor', () => {
  const boss = createBossModel(SECTORS[5], 5, true);
  try {
    const originalMinY = europaBossMinimumCenterHeight(boss);
    const floorY = europaBossFloorY(boss);
    const minY = europaBossMinimumCenterHeight(boss, floorY);
    assert.ok(originalMinY > 22, 'the old 12-unit airborne center height clipped the legs');
    assert.ok(floorY < -25, 'sink the glacial floor instead of lifting the entire model');
    assert.ok(minY <= EUROPA_ARENA_MIN_CENTER_TARGET + 0.001, 'keep real boss at camera eye level');
    const initialBounds = new T.Box3().setFromObject(boss);
    assert.ok(initialBounds.min.y < -18, 'Colossus has a substantial lower body');
    const weak = boss.userData.parts.map((p) => p.mesh.position.clone());
    const muzzles = boss.userData.batteries.map((p) => p.position.clone());
    for (const phase of [1, 2, 3]) {
      for (const age of [0, 1, 3, 6, 8, 9.2, 10.5, 12, 16, 21, 28]) {
        const t = bossTacticsAt(5, age, phase);
        const approach = 1 - Math.pow(1 - Math.min(1, age / 3), 3);
        const pose = bossDepartureAt(age, t, approach);
        boss.position.set(pose.x, europaBossArenaHeight(pose.y, minY), pose.z);
        boss.rotation.z = t.bank;
        for (const kind of ['ice-quake', 'cryo-pincer']) {
          animateBossSignature(boss, 5, age, phase, t.state, kind);
          const bounds = new T.Box3().setFromObject(boss);
          assert.ok(
            bounds.min.y >= floorY + 2,
            'Colossus floor clipping during ' +
              kind +
              ' at age ' +
              age +
              ', minY=' +
              bounds.min.y.toFixed(2),
          );
        }
        boss.userData.parts.forEach((p, i) =>
          assert.ok(p.mesh.position.equals(weak[i]), 'weak point position must remain intact'),
        );
        boss.userData.batteries.forEach((p, i) =>
          assert.ok(p.position.equals(muzzles[i]), 'real emitter must remain intact'),
        );
      }
    }
    assert.ok(EUROPA_ARENA_FLOOR_GAP >= 8);
  } finally {
    disposeBoss(boss);
  }
});

test('world hides Europa near-field props but retains remote icy ridges during boss fight', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  world.setDestinationArrival(90);
  world.showCarrierForBoss();
  const crystals = scene.getObjectByName('europa-near-field-crystals');
  const landmarks = scene.getObjectByName('destination-landmarks');
  const living = scene.getObjectByName('world-living-depth-ice');
  assert.ok(crystals && landmarks && living);
  assert.equal(crystals.children.length, 60, 'preserve crystals during pre-boss flight');
  const floor = -83;
  const arena = world.setEuropaBossArena(true, floor);
  assert.equal(arena.active, true);
  assert.equal(arena.floorY, floor);
  assert.equal(world.europaBossArenaState().floorY, floor);
  assert.equal(crystals.visible, false);
  assert.equal(landmarks.position.z, -280);
  assert.equal(living.position.z, -280);
  assert.equal(world.europaBossArenaState().carrierHidden, true);
  world.setDestinationArrival(110);
  world.update(0.2, 110, 480, true);
  assert.equal(
    crystals.visible,
    false,
    'arrival or moving world cannot restore foreground clutter',
  );
  assert.equal(landmarks.visible, true, 'the distant glacial backdrop remains');
  world.setEuropaBossArena(false);
  assert.equal(world.europaBossArenaState().floorY, EUROPA_ARENA_FLOOR_Y);
  assert.equal(crystals.visible, true);
  assert.equal(landmarks.position.z, 0);
  assert.equal(living.position.z, 0);
  const other = world.setEuropaBossArena(true, floor);
  assert.equal(other.active, true);
  world.setSector(SECTORS[4], 4);
  assert.equal(world.europaBossArenaState().active, false, 'changing mission clears arena state');
  assert.equal(world.setEuropaBossArena(true).active, false, 'no global environment regression');
});

test('Europa Colossus occupies more of portrait combat view without changing physical model', () => {
  const boss = createBossModel(SECTORS[5], 5, true);
  try {
    const bounds = new T.Box3().setFromObject(boss);
    const physicalHeight = bounds.getSize(new T.Vector3()).y;
    assert.ok(physicalHeight > 30, 'test the real Colossus silhouette, not a dummy target');

    const cameraZ = 62; // combat chase eye: player z=9 + 53
    const oldDepth = -205;
    const oldFov = 98;
    const apparentHeight = (depth, fov) =>
      physicalHeight / (2 * (cameraZ - depth) * Math.tan(T.MathUtils.degToRad(fov / 2)));
    const oldPresence = apparentHeight(oldDepth, oldFov);
    const newPresence = apparentHeight(EUROPA_ARENA_BOSS_DEPTH, EUROPA_ARENA_PORTRAIT_FOV);
    assert.ok(newPresence > oldPresence * 1.35, 'the new shot should feel substantially closer');

    boss.position.z = EUROPA_ARENA_BOSS_DEPTH;
    boss.updateMatrixWorld(true);
    const closestPoint = new T.Box3().setFromObject(boss).max.z;
    assert.ok(closestPoint < -20, 'keep the boss out of the pilot cockpit at z=9');
    assert.equal(boss.scale.x, 1, 'do not inflate the boss and its hitboxes');
    assert.equal(europaBossPortraitFov(390 / 844), EUROPA_ARENA_PORTRAIT_FOV);
    assert.equal(europaBossPortraitFov(844 / 390), null);
    assert.throws(() => europaBossPortraitFov(0), RangeError);
  } finally {
    disposeBoss(boss);
  }
});

test('Europa floor clamp rejects invalid inputs and never lowers legitimate flight poses', () => {
  assert.equal(europaBossArenaHeight(60, 38), 60);
  assert.equal(europaBossArenaDepth(-94), EUROPA_ARENA_BOSS_DEPTH);
  assert.equal(europaBossArenaDepth(-680), -680);
  assert.ok(9 - EUROPA_ARENA_BOSS_DEPTH < 38 * 6, 'slow arcane bolts still reach the pilot');
  assert.throws(() => europaBossArenaDepth(Number.NaN), RangeError);
  assert.equal(europaBossArenaHeight(9, 38), 38);
  assert.throws(() => europaBossArenaHeight(Number.NaN, 32), RangeError);
  assert.throws(() => europaBossMinimumCenterHeight(null), RangeError);
  assert.throws(() => europaBossMinimumCenterHeight(new T.Group()), RangeError);
  assert.throws(() => europaBossFloorY(null), RangeError);
});
