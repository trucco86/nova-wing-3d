import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { saturnPassageAt, saturnObstacleKindAt } from '../src/saturn-ring-passage.js';
import { SECTORS } from '../src/campaign.js';
import { STAGE_JOURNEYS } from '../src/stage-journey.js';
import { createWorld } from '../src/visuals.js';
import {
  DESTINATION_PROFILES,
  ARRIVAL_SECONDS,
  destinationArrivalAt,
  destinationExitAt,
} from '../src/destination-arrival.js';
import {
  createDestinationVista,
  createDestinationEscape,
  updateDestinationEscape,
} from '../src/destination-vista.js';

test('all later destinations retain independent celestial routes, and entry is deterministic', () => {
  assert.equal(SECTORS.length, 10);
  assert.equal(new Set(Object.values(DESTINATION_PROFILES).map((p) => p.location)).size, 7);
  assert.deepEqual(Object.keys(DESTINATION_PROFILES).map(Number), [3, 4, 5, 6, 7, 8, 9]);
  for (const index of [3, 4, 5, 6, 7, 8, 9]) {
    const profile = DESTINATION_PROFILES[index];
    assert.ok(profile.label.includes(profile.location));
    assert.ok(STAGE_JOURNEYS[index].world);
    const phases = [0, 8, 15, 22, 26].map((seconds) => destinationArrivalAt(index, seconds));
    assert.deepEqual(
      phases.map((x) => x.phase),
      index === 7
        ? ['space', 'arena', 'arena', 'arena', 'arena']
        : ['space', 'orbit', 'entry', 'descent', 'arena'],
    );
    assert.ok(phases[0].globeOpacity >= phases[3].globeOpacity);
    assert.equal(phases[0].combatReady, false);
    assert.equal(phases[4].combatReady, true);
    assert.equal(phases[4].reveal, 1);
    assert.deepEqual(destinationArrivalAt(index, 17), destinationArrivalAt(index, 17));
  }
  assert.equal(ARRIVAL_SECONDS, 25);
  for (const index of [0, 1, 2]) assert.equal(destinationArrivalAt(index, 15), null);
  assert.throws(() => destinationArrivalAt(5, Number.NaN), RangeError);
  assert.throws(() => destinationArrivalAt(5, -0.1), RangeError);
});

test('the planetary vistas are non-colliding and only Saturn has astronomical rings', () => {
  for (const index of [3, 4, 5, 6, 7, 8, 9]) {
    const root = createDestinationVista(index);
    assert.ok(root.userData.fixedSky);
    const globe = root.getObjectByName('destination-celestial-body');
    assert.ok(globe?.isMesh);
    assert.equal(
      globe.getObjectByName('saturn-planetary-ring-system')?.isMesh ?? false,
      index === 7,
    );
    assert.equal(root.getObjectByName('destination-entry-mist').children.length, 3);
    root.traverse((obj) => assert.notEqual(obj.userData.hitbox, true));
  }
});

test('the scene begins in space, reveals a distinct planetary world, and resets without leaking assets', () => {
  for (const index of [3, 4, 5, 6, 7, 8, 9]) {
    const scene = new T.Scene();
    const world = createWorld(scene, () => 0.5, true);
    world.setSector(SECTORS[index], index);
    const root = scene.getObjectByName('destination-orbital-vista');
    assert.ok(root, 'each later mission has an authored orbital approach');
    const initial = root.userData.arrivalPhase;
    assert.equal(initial, 'space');
    assert.ok(scene.fog.density <= 0.00015);
    const transition = world.setDestinationArrival(16);
    assert.equal(transition.phase, index === 7 ? 'arena' : 'entry');
    if (index === 7) assert.equal(transition.haze, 0, 'Saturn has no invented atmosphere crossing');
    else assert.ok(transition.haze > 0);
    if (index === 3) {
      assert.ok(
        scene.fog.density <= 0.0003,
        'Devastador close-up stays visible; approach is not obscured by generic re-entry haze',
      );
    } else if (index !== 7) {
      assert.ok(scene.fog.density > 0.0004);
    }
    const arrived = world.setDestinationArrival(27);
    assert.equal(arrived.combatReady, true);
    assert.equal(root.userData.arrivalPhase, 'arena');
    if (index === 5) {
      assert.ok(
        scene.fog.density >= 0.002 && scene.fog.density <= 0.0035,
        'Europa surface keeps bounded icy haze; combat remains visible',
      );
      assert.equal(scene.getObjectByName('world-orbital-globe').visible, false);
      assert.equal(scene.getObjectByName('destination-celestial-body').visible, false);
    } else assert.ok(scene.fog.density < 0.002);
    assert.equal(scene.getObjectByName('destination-escape').visible, false);
    world.setDestinationExit(7.7);
    assert.equal(scene.getObjectByName('destination-escape').visible, true);
    world.reset();
    assert.equal(root.userData.arrivalPhase, 'space');
    assert.equal(scene.getObjectByName('destination-escape').visible, false);
    world.setSector(SECTORS[0], 0);
    assert.equal(scene.getObjectByName('destination-orbital-vista'), undefined);
    assert.equal(world.setDestinationArrival(15), null);
  }
});

test('after each boss, time controls the exit effect; pause and reset never move particles', () => {
  for (let i = 0; i < SECTORS.length; i++) {
    const exit = createDestinationEscape(i);
    assert.ok(exit.userData.visualOnly);
    assert.equal(exit.visible, false);
    assert.equal(destinationExitAt(i, 3).active, false);
    const state = updateDestinationEscape(exit, i, 7);
    assert.ok(state.progress > 0.7 && state.progress < 1);
    assert.equal(destinationExitAt(i, 8).progress, 1, 'exit accelerates smoothly until 8s');
    const particle = exit.getObjectByName('escape-hyperspeed-particles');
    const sample = [...particle.geometry.getAttribute('position').array.slice(0, 12)];
    updateDestinationEscape(exit, i, 7);
    assert.deepEqual([...particle.geometry.getAttribute('position').array.slice(0, 12)], sample);
    updateDestinationEscape(exit, i, 0);
    assert.equal(exit.visible, false);
  }
  assert.match(destinationExitAt(9, 8).label, /VITÓRIA/);
  assert.throws(() => destinationExitAt(3, Infinity), RangeError);
});

test('Saturn stage 8 starts near its rings and reaches combat without an arbitrary 25-second transition', () => {
  const first = destinationArrivalAt(7, 0);
  const near = destinationArrivalAt(7, 7.9);
  const ready = destinationArrivalAt(7, 8);
  const battle = destinationArrivalAt(7, 90);
  assert.equal(first.phase, 'space');
  assert.equal(first.globeOpacity, 1);
  assert.equal(near.combatReady, false);
  assert.equal(ready.phase, 'arena');
  assert.equal(ready.combatReady, true);
  assert.equal(battle.globeOpacity, 1, 'Saturn stays readable throughout the battle');
  assert.equal(battle.haze, 0);
  assert.ok(Math.abs(battle.globeScale - 1.4) < 1e-9);
  assert.equal(destinationArrivalAt(6, 8).combatReady, false, 'Neptune pacing unchanged');
  assert.equal(destinationArrivalAt(9, 8).combatReady, false, 'Titan pacing unchanged');
});

test('Saturn crossing is legible: orbit, icy rings, Cassini opening and Omega blockade', () => {
  const timeline = [0, 14, 36, 72, 87];
  const zones = timeline.map((t) => saturnPassageAt(t).zone);
  assert.deepEqual(zones, ['approach', 'outer', 'ice-field', 'cassini-gap', 'blockade']);
  const states = timeline.map((t) => saturnPassageAt(t));
  assert.ok(states[2].density > states[1].density);
  assert.ok(states[2].density > states[3].density);
  assert.equal(states[2].meteor, true);
  assert.equal(states[3].meteor, true);
  assert.equal(states[4].meteor, false);
  for (const t of timeline) {
    assert.equal(destinationArrivalAt(7, t).label, saturnPassageAt(t).label);
    assert.equal(destinationArrivalAt(7, t).haze, 0);
  }
  assert.equal(destinationArrivalAt(7, 87).combatReady, true);
  assert.equal(destinationArrivalAt(6, 14).phase, 'entry');
  assert.throws(() => saturnPassageAt(Number.NaN), RangeError);
  assert.throws(() => saturnPassageAt(-5), RangeError);
  assert.throws(() => saturnPassageAt(10, 6), RangeError);
});

test('Saturn hazard schedule leaves the approach and boss arena free of cargo obstacles', () => {
  for (const t of [0, 5, 9, 16, 23, 80, 87, 98]) {
    assert.equal(saturnObstacleKindAt(t), null, 'quiet Saturn corridor at ' + t);
  }
  assert.equal(saturnObstacleKindAt(25), 'ice-meteor');
  assert.equal(saturnObstacleKindAt(36), 'ice-meteor');
  assert.equal(saturnObstacleKindAt(48), 'ice-meteor');
  assert.equal(saturnObstacleKindAt(56), 'ice-meteor');
  assert.equal(saturnObstacleKindAt(64), 'carrier', 'one occasional combat cover ship');
  assert.equal(saturnObstacleKindAt(72), 'ice-meteor');
  assert.equal(saturnObstacleKindAt(72), saturnObstacleKindAt(72));
  assert.throws(() => saturnObstacleKindAt(-1), RangeError);
});

test('Saturn ring depth is clipped by the opaque globe, keeping the front arc visible', () => {
  const saturn = createDestinationVista(7);
  const planet = saturn.getObjectByName('destination-celestial-body');
  const ring = saturn.getObjectByName('saturn-planetary-ring-system');
  assert.equal(planet.material.transparent, false);
  assert.equal(planet.material.depthWrite, true);
  assert.equal(ring.material.depthTest, true);
  assert.equal(ring.material.depthWrite, false);
  assert.equal(ring.renderOrder, 2);
  assert.equal(ring.parent, planet, 'the ring tilts and scales with Saturn');
  const earthOrOther = createDestinationVista(6);
  assert.equal(
    earthOrOther.getObjectByName('destination-celestial-body').material.transparent,
    true,
  );
  assert.equal(
    earthOrOther.getObjectByName('destination-celestial-body').material.depthWrite,
    false,
  );
});

test('Cassini Saturn palette and real equatorial ring plane keep both arcs around the sphere', () => {
  const saturn = createDestinationVista(7);
  const globe = saturn.getObjectByName('destination-celestial-body');
  const rings = saturn.getObjectByName('saturn-planetary-ring-system');
  const bands = globe.children.filter((mesh) => mesh.name === 'saturn-astronomical-band');
  assert.equal(globe.geometry.parameters.radius, 180);
  assert.equal(rings.geometry.parameters.innerRadius, 205);
  assert.equal(rings.geometry.parameters.outerRadius, 346);
  assert.ok(Math.abs(rings.rotation.x - Math.PI / 2) < 0.000001);
  assert.ok(Math.abs(globe.rotation.x) > 0.3, 'planet pole and rings share the camera tilt');
  assert.equal(rings.parent, globe, 'orbiting disk must stay attached to Saturn');
  assert.equal(bands.length, 3);
  assert.ok(bands.every((band) => band.parent === globe && band.rotation.x === rings.rotation.x));
  assert.equal(globe.material.transparent, false);
  assert.equal(globe.material.depthWrite, true);
  assert.equal(rings.material.depthTest, true, 'rear arc is occluded by globe');
  assert.equal(rings.material.depthWrite, false);
  assert.match(rings.material.fragmentShader, /Cassini|gap=1\.-smoothstep/);
  assert.match(globe.material.fragmentShader, /Cassini natural-color reference/);
  const profile = DESTINATION_PROFILES[7];
  assert.equal(profile.colors[1], '#f3e5be');
  assert.equal(profile.colors[0], '#aea08a');
  const earthSafe = createDestinationVista(4);
  assert.equal(earthSafe.getObjectByName('saturn-planetary-ring-system'), undefined);
  assert.equal(earthSafe.getObjectByName('destination-celestial-body').rotation.x, 0);
});
