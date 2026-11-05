import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { crossesSolid } from '../src/flight.js';
import {
  CITY_DESTRUCTION_BEATS,
  CITY_STAGE_AUDIO,
  cityWarningText,
  cityDestructionAt,
  createCityDestructionScene,
  updateCityDestructionScene,
  createCityHangingTrainObstacle,
  animateCityHangingTrainObstacle,
  cityDestructionGroundState,
  CITY_STREET_TOP_Y,
  cityDestructionImpactState,
  createCityRoadImpact,
  updateCityRoadImpact,
} from '../src/city-destruction.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { harness } from './harness.mjs';
import { AUDIO_CUES } from '../src/audio-cues.js';

test('stage-1 story beats are deterministic and finish before mandatory orbital boost', () => {
  const ids = CITY_DESTRUCTION_BEATS.map(({ id }) => id);
  assert.deepEqual(ids, [
    'billboard',
    'billboardImpact',
    'vehicle',
    'vehicleImpact',
    'facade',
    'facadeImpact',
    'facadeDebrisImpact',
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

test('rotated sign, exploding hovercar and all seven facade fragments never enter the city floor', () => {
  const root = createCityDestructionScene();
  const samples = [
    0, 5.4, 5.8, 6.5, 7.1, 7.8, 8.5, 9.3, 10.05, 10.4, 11.1, 11.8, 12.1, 12.5, 12.95, 13.2, 15.5,
    22.6,
  ];
  for (const time of samples) {
    updateCityDestructionScene(root, time);
    const contact = cityDestructionGroundState(root);
    assert.equal(contact.floorY, CITY_STREET_TOP_Y);
    for (const [name, bottom] of [
      ['billboard', contact.billboardBottomY],
      ['vehicle', contact.vehicleBottomY],
      ['tower', contact.towerBottomY],
      ...contact.facadeFragmentBottoms.map((y, i) => ['facade-' + i, y]),
    ]) {
      assert.ok(Number.isFinite(bottom), name + ' has a valid world-space contact');
      assert.ok(
        bottom >= contact.floorY - 1e-4,
        name + ' must never sink below the road at t=' + time + ': ' + bottom,
      );
    }
  }
  updateCityDestructionScene(root, 7.2);
  let contact = cityDestructionGroundState(root);
  assert.ok(
    Math.abs(contact.billboardBottomY - contact.floorY) < 0.03,
    'rotated advertisement touches the road after its impact',
  );
  updateCityDestructionScene(root, 10.2);
  contact = cityDestructionGroundState(root);
  assert.ok(
    Math.abs(contact.vehicleBottomY - contact.floorY) < 0.03,
    'hovercar cannot fall through the road when overturned',
  );
  const blast = root.getObjectByName('city-hovercar-impact-fireball');
  assert.ok(blast.parent === root, 'impact stays in street/world space');
  assert.ok(blast.position.y - blast.scale.x * 6 >= CITY_STREET_TOP_Y - 1e-4);
  updateCityDestructionScene(root, 13.2);
  contact = cityDestructionGroundState(root);
  assert.ok(
    contact.facadeFragmentBottoms.every((y) => Math.abs(y - contact.floorY) < 0.04),
    'all falling façade pieces complete their fall resting on the actual street',
  );
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
  assert.ok(state.cityDestruction.triggered.includes('facadeDebrisImpact'));
  assert.equal(state.cityDestruction.wrecks.length, 0);
  assert.ok(
    state.cityDestruction.ground.facadeFragmentBottoms.every(
      (y) => y >= CITY_STREET_TOP_Y - 0.001 && y <= CITY_STREET_TOP_Y + 0.05,
    ),
  );
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

test('three stage-1 impacts have readable short-lived ground shockwaves without new per-frame meshes', () => {
  const root = createCityDestructionScene();
  const expected = [
    ['billboard', 7.1, 1],
    ['vehicle', 10.05, 1.4],
    ['facade', 12.95, 1.5],
  ];
  for (const [event, at] of expected) {
    updateCityDestructionScene(root, at - 0.06);
    let effects = cityDestructionImpactState(root);
    assert.equal(effects[event].visible, false, event + ' must never fire early');
    updateCityDestructionScene(root, at + 0.22);
    effects = cityDestructionImpactState(root);
    assert.equal(effects[event].visible, true);
    assert.equal(effects[event].dustCount, 3);
    assert.equal(effects[event].drawCount, 5, 'pooled shock ring, dust and single spark batch');
    assert.ok(effects[event].groundY > CITY_STREET_TOP_Y);
    const impact = root.userData.impacts[event];
    assert.ok(impact.children.every((node) => node.userData.visualOnly));
    const ring = impact.getObjectByName('city-ground-impact-shock-ring');
    assert.ok(ring?.material.opacity > 0 && ring.material.opacity <= 0.76);
    assert.ok(Math.abs(ring.rotation.x + Math.PI / 2) < 1e-6);
    const dust = impact.userData.nodes.dust;
    for (const cloud of dust) {
      const bottom = cloud.position.y - cloud.scale.y;
      assert.ok(
        bottom >= CITY_STREET_TOP_Y - 0.001,
        'smoke starts on pavement, never buried in it',
      );
    }
    const original = impact.children.slice();
    updateCityDestructionScene(root, at + 0.7);
    assert.ok(
      impact.children.every((node, i) => node === original[i]),
      'dust effect reuses the same GPU meshes',
    );
    updateCityDestructionScene(root, at + 1.25);
    assert.equal(
      cityDestructionImpactState(root)[event].visible,
      false,
      'old visual event clears; no permanent HUD or screen clutter',
    );
  }
  assert.equal(
    root.userData.impacts.vehicle.getObjectByName('city-ground-impact-sparks').type,
    'Points',
  );
});

test('impact helpers stay deterministic over pause/seek and discard impossible timing', () => {
  const impact = createCityRoadImpact('qa-road-shock');
  assert.equal(updateCityRoadImpact(impact, 4, 5, 10, -20), false);
  assert.equal(impact.visible, false);
  assert.equal(updateCityRoadImpact(impact, 5.32, 5, 10, -20), true);
  const original = impact.userData.nodes.ring.scale.x;
  const glow = impact.userData.nodes.ring.material.opacity;
  const x = impact.position.x,
    z = impact.position.z;
  updateCityRoadImpact(impact, 5.32, 5, 10, -20);
  assert.equal(impact.userData.nodes.ring.scale.x, original);
  assert.equal(impact.userData.nodes.ring.material.opacity, glow);
  assert.equal(impact.position.x, x);
  assert.equal(impact.position.z, z);
  assert.equal(updateCityRoadImpact(impact, 6.2, 5, 10, -20), false);
});

test('train setpiece signals a real right-side route and shows electrical danger while hanging', () => {
  const wreck = createCityHangingTrainObstacle();
  const safe = wreck.getObjectByName('city-train-safe-right-lane-indicator');
  const edges = safe.children.filter((node) => node.name === 'city-train-safe-lane-edge');
  assert.equal(edges.length, 2);
  assert.ok(edges.every((edge) => edge.userData.visualOnly));
  assert.ok(edges.every((edge) => edge.position.y > CITY_STREET_TOP_Y));
  assert.deepEqual(
    edges.map((edge) => edge.position.x),
    [19, 35],
  );
  assert.equal(
    safe.children.filter((child) => child.name === 'city-train-right-lane-chevron').length,
    3,
  );
  animateCityHangingTrainObstacle(wreck, 15.3);
  const sparks = wreck.getObjectByName('city-train-torn-powerline-sparks');
  assert.ok(sparks.visible, 'sparks expose the broken power line before hitbox activates');
  assert.equal(sparks.children.length, 4);
  assert.equal(wreck.userData.solids.length, 0, 'warning remains passable until collision');
  animateCityHangingTrainObstacle(wreck, 16.3);
  assert.equal(wreck.userData.solids.length, 2);
  assert.equal(wreck.userData.safeLane, 'right');
  animateCityHangingTrainObstacle(wreck, 22);
  assert.equal(sparks.visible, false, 'decorative sparks expire after encounter');
  assert.equal(safe.visible, false, 'guides do not persist after the dodge section');
});

test('stage-1 audio cues follow distinct events and radio only interrupts for actionable train dodge', () => {
  const audible = [
    'billboardImpact', 'vehicleImpact', 'facadeImpact',
    'facadeDebrisImpact', 'trainWarning', 'trainSpawn', 'trainImpact',
  ];
  assert.deepEqual(Object.keys(CITY_STAGE_AUDIO), audible);
  for (const event of audible) {
    const signature = AUDIO_CUES[CITY_STAGE_AUDIO[event]];
    assert.ok(signature, event + ' needs a real synthesizable cue');
    assert.ok(signature.tones.length >= 1);
    assert.ok(signature.tones.length + (signature.noises?.length ?? 0) <= 4,
      event + ' should keep voice allocation bounded on mobile');
    assert.ok(signature.cooldown >= 0.2);
  }
  assert.notDeepEqual(AUDIO_CUES.cityMetalDrop, AUDIO_CUES.cityTrainCrash);
  assert.notDeepEqual(AUDIO_CUES.cityVehicleCrash, AUDIO_CUES.cityFacadeCollapse);
  assert.deepEqual(CITY_DESTRUCTION_BEATS.filter((beat) => beat.message).map((beat) => beat.id),
    ['trainWarning'], 'no repeated radio text during noninteractive background demolition');
  assert.equal(cityWarningText('pt'), 'TREM AVARIADO · DESVIE À DIREITA');
  assert.equal(cityWarningText('en'), 'DAMAGED TRAIN · DODGE RIGHT');
  assert.equal(cityWarningText('es'), 'TREN AVERIADO · ESQUIVA A LA DERECHA');
  assert.equal(cityWarningText('unknown'), cityWarningText('pt'));
});

test('real stage-1 collision timeline triggers each authored sound exactly at event time', (t) => {
  const h = harness({
    spawnEncounters: false, enableCitySetpieces: true, enableSquadIntro: false,
  });
  t.after(() => h.close());
  h.game.start(true);
  for (const [at, name] of [
    [7.2, 'cityMetalDrop'],
    [10.15, 'cityVehicleCrash'],
    [12.15, 'cityFacadeCollapse'],
    [13.0, 'cityConcreteDebris'],
    [13.4, 'cityTrainAlarm'],
    [14.3, 'cityRailTear'],
    [16.3, 'cityTrainCrash'],
  ]) {
    const current = h.game.snapshot().seconds;
    h.advance(at - current);
    const snapshot = h.game.snapshot();
    assert.equal(snapshot.audio?.lastCue, name, 'wrong SFX at t=' + at);
    assert.ok(snapshot.audio.voices <= 32, 'voice pool budget still enforced');
  }
  h.game.pause();
  assert.equal(h.game.snapshot().audio.voices, 0, 'pause clears scene sounds');
  h.advance(3);
  assert.equal(h.game.snapshot().audio.lastCue, 'cityTrainCrash',
    'paused simulation must not replay impact sounds');
});
