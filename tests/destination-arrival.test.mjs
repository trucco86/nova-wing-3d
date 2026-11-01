import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
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
      ['space', 'orbit', 'entry', 'descent', 'arena'],
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
    assert.equal(transition.phase, 'entry');
    assert.ok(transition.haze > 0);
    if (index === 3) {
      assert.ok(
        scene.fog.density <= 0.0003,
        'Devastador close-up stays visible; approach is not obscured by generic re-entry haze',
      );
    } else {
      assert.ok(scene.fog.density > 0.0004);
    }
    const arrived = world.setDestinationArrival(27);
    assert.equal(arrived.combatReady, true);
    assert.equal(root.userData.arrivalPhase, 'arena');
    assert.ok(scene.fog.density < 0.002);
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
