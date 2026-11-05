import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { crossesSolid } from '../src/flight.js';
import {
  CITY_DESTRUCTION_BEATS,
  CITY_COLLISION_FLOOR_Y,
  cityImpactBounce,
  settleCityDebrisOnFloor,
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
    'billboardImpact',
    'vehicle',
    'vehicleImpact',
    'facade',
    'facadeImpact',
    'trainWarning',
    'facadeDebrisImpact',
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

test('falling street objects always land on rotated world-space bounds, never below the road', () => {
  const root = createCityDestructionScene();
  const sign = root.getObjectByName('city-sign-structure');
  const car = root.getObjectByName('city-falling-hovercar');
  const facade = root.getObjectByName('city-collapsing-facade');
  const building = facade.getObjectByName('city-tower-surviving-shell');
  const shards = facade.getObjectByName('city-tower-damaged-crown').children;
  const eps = 0.002;
  for (const seconds of [5, 5.4, 5.8, 6.6, 7.1, 7.4, 8.5, 9.3, 9.7, 10.05, 10.5, 11.1, 12.0, 12.8, 13.4, 13.65, 14.4, 17.8, 20.3]) {
    const state = updateCityDestructionScene(root, seconds);
    for (const [name, node] of [['falling billboard', sign], ['rolling hovercar', car], ['tower foundation', building], ...shards.map((shard, i) => ['facade fragment ' + i, shard])]) {
      // Three.js calculates bounds from the actual rotated geometry, not
      // object.position.y. This catches corners clipping during roll/tilt.
      const bounds = new T.Box3().setFromObject(node, true);
      assert.ok(bounds.min.y >= CITY_COLLISION_FLOOR_Y - eps,
        name + ' crossed road at t=' + seconds + ', bottom=' + bounds.min.y);
    }
    assert.ok(Math.abs(state.impacts.billboard.y - (CITY_COLLISION_FLOOR_Y + 0.35)) < eps);
    assert.ok(Math.abs(state.impacts.vehicle.y - (CITY_COLLISION_FLOOR_Y + 0.35)) < eps);
    assert.ok(Math.abs(state.impacts.debris.y - (CITY_COLLISION_FLOOR_Y + 0.35)) < eps);
    const effect = root.getObjectByName('city-hovercar-impact-fireball');
    assert.ok(effect.position.y >= CITY_COLLISION_FLOOR_Y, 'fireball center remains above asphalt');
  }
  const first = shards.map((shard) => shard.position.clone());
  updateCityDestructionScene(root, 12.1);
  updateCityDestructionScene(root, 20.3);
  shards.forEach((shard, i) => assert.ok(shard.position.distanceTo(first[i]) < 0.001,
    'stage rewind/replay keeps stable deterministic landed position'));
});

test('floor contact solver handles rotations, rebounds and empty geometry without tunneling', () => {
  const g = new T.Group();
  const part = new T.Mesh(new T.BoxGeometry(12, 4, 6), new T.MeshBasicMaterial());
  part.rotation.set(0.4, 0, -0.85);
  part.position.y = -12;
  g.add(part);
  const result = settleCityDebrisOnFloor(g);
  assert.equal(result.contacted, true);
  assert.ok(result.correction > 0);
  assert.ok(new T.Box3().setFromObject(g, true).min.y >= CITY_COLLISION_FLOOR_Y - 0.002);
  assert.ok(settleCityDebrisOnFloor(g).correction < 0.001, 'already grounded geometry stays stable');
  assert.equal(settleCityDebrisOnFloor(new T.Group()).bottomY, null);
  assert.throws(() => settleCityDebrisOnFloor(g, NaN), RangeError);
  assert.equal(cityImpactBounce(10, 10), 0);
  assert.ok(cityImpactBounce(10.3, 10, 2.5) > 0);
  assert.equal(cityImpactBounce(11, 10, 2.5), 0);
  assert.throws(() => cityImpactBounce(NaN, 10), RangeError);
});

test('train remains suspended above road and its safe collision route is unchanged', () => {
  const wreck = createCityHangingTrainObstacle();
  for (const at of [14.2, 14.8, 15.6, 16.2, 17.5, 21.5]) {
    animateCityHangingTrainObstacle(wreck, at);
    // A standalone model has no render loop to propagate parent pivot/world
    // matrices, so update the hierarchy before reading bounds.
    wreck.updateMatrixWorld(true);
    const body = wreck.getObjectByName('city-maglev-damaged-carriages');
    const bounds = new T.Box3().setFromObject(body, true);
    assert.ok(bounds.min.y >= CITY_COLLISION_FLOOR_Y - 0.002,
      'train should hang above road instead of clipping into it at ' + at);
  }
  assert.equal(wreck.userData.safeLane, 'right');
  assert.equal(wreck.userData.solids.length, 2);
});
