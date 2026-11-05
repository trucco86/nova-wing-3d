import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { crossesSolid } from '../src/flight.js';
import {
  CITY_DESTRUCTION_BEATS,
  cityDestructionAt,
  createCityDestructionScene,
  updateCityDestructionScene,
  createCityHangingTrainObstacle,
  animateCityHangingTrainObstacle,
} from '../src/city-destruction.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { harness } from './harness.mjs';

test('stage-1 story beats are deterministic and finish before mandatory orbital boost', () => {
  const ids = CITY_DESTRUCTION_BEATS.map(({ id }) => id);
  assert.deepEqual(ids, [
    'billboard',
    'vehicle',
    'facade',
    'trainWarning',
    'trainSpawn',
    'trainImpact',
  ]);
  const times = CITY_DESTRUCTION_BEATS.map(({ at }) => at);
  assert.ok(times.every((at, i) => i === 0 || at > times[i - 1]));
  assert.ok(times.at(-1) < 23, 'set pieces must not interrupt mandatory boost');
  assert.equal(cityDestructionAt(0).phase, 'city-calm');
  assert.equal(cityDestructionAt(6).phase, 'city-under-fire');
  assert.equal(cityDestructionAt(11.5).phase, 'facade-collapse');
  assert.equal(cityDestructionAt(14.5).phase, 'train-failing');
  assert.equal(cityDestructionAt(18).phase, 'train-obstacle');
  assert.equal(cityDestructionAt(23).phase, 'orbital-handoff');
  assert.equal(cityDestructionAt(18).safeLane, 'right');
  assert.throws(() => cityDestructionAt(-1), RangeError);
  assert.throws(() => cityDestructionAt(NaN), RangeError);
});

test('billboard, falling car, building façade and explosions animate only at authored times', () => {
  const root = createCityDestructionScene();
  assert.equal(root.name, 'city-scripted-destruction');
  assert.equal(root.userData.visualOnly, true);
  const sign = root.getObjectByName('city-sign-structure');
  const car = root.getObjectByName('city-falling-hovercar');
  const tower = root.getObjectByName('city-collapsing-facade');
  assert.ok(sign && car && tower);
  updateCityDestructionScene(root, 3.5);
  assert.equal(sign.visible, false);
  assert.equal(car.visible, false);
  assert.equal(tower.visible, false);
  updateCityDestructionScene(root, 6.5);
  assert.equal(sign.visible, true);
  assert.ok(sign.getObjectByName('city-falling-advertisement').rotation.z < -0.2);
  updateCityDestructionScene(root, 9.4);
  assert.equal(car.visible, true);
  assert.ok(car.position.y < 47);
  updateCityDestructionScene(root, 12.5);
  assert.equal(tower.visible, true);
  assert.ok(tower.getObjectByName('city-tower-impact-flash').visible);
  const fragments = tower.getObjectByName('city-tower-damaged-crown').children;
  assert.ok(fragments.every((node) => node.position.y < node.userData.origin.y));
  updateCityDestructionScene(root, 23.5);
  assert.equal(root.visible, false);
  assert.equal(updateCityDestructionScene(root, 6.5, false).seconds, 6.5);
  assert.equal(root.visible, false);
});

test('hanging maglev warns from above, then blocks left/center but leaves real right flight lane', () => {
  const wreck = createCityHangingTrainObstacle();
  assert.equal(wreck.userData.kind, 'city-hanging-train');
  assert.equal(wreck.userData.safeLane, 'right');
  assert.equal(wreck.userData.solids.length, 0, 'warning may not have invisible collider');
  assert.ok(wreck.getObjectByName('city-maglev-damaged-carriages'));
  assert.ok(wreck.getObjectByName('city-broken-guideway'));
  assert.ok(wreck.getObjectByName('city-train-right-dodge-arrow'));
  const startY = wreck.getObjectByName('city-derailed-hanging-maglev').position.y;
  animateCityHangingTrainObstacle(wreck, 15.6);
  assert.equal(wreck.userData.solids.length, 0, 'the descent warns before any damage');
  animateCityHangingTrainObstacle(wreck, 16.3);
  assert.equal(wreck.userData.solids.length, 2, 'real carriage and snapped guideway hitboxes');
  assert.ok(wreck.getObjectByName('city-derailed-hanging-maglev').position.y < startY);
  const hits = (x, y = 9) =>
    wreck.userData.solids.some(({ center, half }) =>
      crossesSolid(new T.Vector3(x, y, -65), new T.Vector3(x, y, 65), center, half, 2.5),
    );
  assert.equal(hits(0), true, 'center flight path must require a dodge');
  assert.equal(hits(-20), true, 'left lane is genuinely blocked');
  assert.equal(hits(24), false, 'right path remains wide enough for pilot collision margin');
  assert.equal(hits(34), false, 'right edge is never clipped by wreck');
  assert.equal(wreck.userData.solids.length, 2);
  animateCityHangingTrainObstacle(wreck, 16.7);
  assert.equal(wreck.userData.solids.length, 2, 'no duplicated/increasing hitboxes per frame');
});

test('stage-1 environment director is isolated from Mars, other worlds and city loop', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0], 0);
  const city = scene.getObjectByName('city-scripted-destruction');
  assert.ok(city);
  assert.equal(world.setCityDestruction(6.4).phase, 'city-under-fire');
  assert.equal(city.visible, true);
  world.setLaunchAscent(0.85, true);
  world.setCityDestruction(18);
  assert.equal(city.visible, false, 'orbital transition always hides ground demolition');
  world.setSector(SECTORS[1], 1);
  world.setCityDestruction(18);
  assert.equal(city.visible, false);
});

test('real stage-1 mission plays wreck only once and preserves the boost challenge', (t) => {
  const h = harness({ spawnEncounters: false, enableCitySetpieces: true, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start(true);
  h.advance(13.45);
  let state = h.game.snapshot();
  assert.ok(state.cityDestruction.triggered.includes('trainWarning'));
  assert.equal(state.cityDestruction.wrecks.length, 0);
  h.key('ArrowRight');
  h.advance(3.5);
  h.key('ArrowRight', false);
  state = h.game.snapshot();
  assert.ok(state.cityDestruction.triggered.includes('trainSpawn'));
  assert.ok(state.cityDestruction.triggered.includes('trainImpact'));
  assert.equal(state.cityDestruction.wrecks[0].collisionActive, true);
  assert.equal(state.cityDestruction.wrecks[0].safeLane, 'right');
  assert.ok(state.player.x > 19, 'real pilot can steer into safe lane');
  h.advance(5.1);
  state = h.game.snapshot();
  assert.equal(state.cityDestruction.phase, 'orbital-handoff');
  assert.equal(state.cityDestruction.triggered.length, CITY_DESTRUCTION_BEATS.length);
  assert.equal(state.lives, 3, 'no forced crash if right path is used');
  h.advance(1.4);
  state = h.game.snapshot();
  assert.equal(state.orbitalLaunch.phase, 'boost', 'the existing mandatory boost remains intact');
});
