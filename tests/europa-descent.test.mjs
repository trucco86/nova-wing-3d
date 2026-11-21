import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { marsDescentAt } from '../src/mars-descent.js';
import { europaDescentAt, EUROPA_TOUCHDOWN_SECONDS } from '../src/europa-descent.js';
import { europaSurfaceAt } from '../src/europa-surface.js';
import { destinationArrivalAt } from '../src/destination-arrival.js';
import { createDestinationVista, updateDestinationVista } from '../src/destination-vista.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('Europa has the same ordered four-beat arrival grammar as Mars, not unrelated abrupt scene cuts', () => {
  assert.deepEqual(
    [0, 8, 15, 22, 26].map((t) => europaDescentAt(t).phase),
    ['space', 'orbit', 'entry', 'descent', 'surface'],
  );
  assert.deepEqual(
    [0, 8, 15, 22, 28].map((t) => marsDescentAt(t).phase),
    ['space', 'orbit', 'entry', 'descent', 'surface'],
  );
  assert.equal(EUROPA_TOUCHDOWN_SECONDS, 25);
  assert.equal(europaDescentAt(24.99).combatReady, false);
  assert.equal(europaDescentAt(25).combatReady, true);
  for (const t of [0, 6, 12, 17, 19, 22, 25, 32]) {
    assert.deepEqual(europaDescentAt(t), europaDescentAt(t), 'pause/resume must be deterministic');
    assert.equal(destinationArrivalAt(5, t).combatReady, europaDescentAt(t).combatReady);
  }
  assert.throws(() => europaDescentAt(-1), RangeError);
  assert.throws(() => europaDescentAt(NaN), RangeError);
});

test('moon disappears at orbit handoff and the ice fog masks every intermediate frame', () => {
  for (let t = 0; t <= 25; t += 0.25) {
    const arrival = europaDescentAt(t);
    const ice = europaSurfaceAt(t);
    const destination = destinationArrivalAt(5, t);
    assert.ok(
      arrival.planetOpacity > 0.01 || ice.groundVisible || arrival.iceMist > 0.65,
      'flight cannot lose both planet and surface at ' + t + 's',
    );
    assert.ok(arrival.terrainReveal >= 0 && arrival.terrainReveal <= 1);
    assert.ok(arrival.planetOpacity >= 0 && arrival.planetOpacity <= 1);
    assert.equal(destination.reveal, arrival.terrainReveal);
    assert.equal(destination.globeOpacity, arrival.planetOpacity);
  }
  assert.equal(europaDescentAt(12).planetOpacity, 0);
  assert.ok(europaDescentAt(12).iceMist > 0.9);
  assert.equal(europaDescentAt(19).planetOpacity, 0);
  assert.ok(europaSurfaceAt(19).groundVisible);
  assert.equal(europaDescentAt(25).planetOpacity, 0);
  assert.equal(europaDescentAt(25).terrainReveal, 1);
  assert.equal(europaDescentAt(25).terrainLift, 0);
  assert.equal(europaSurfaceAt(7).groundVisible, false);
  for (const t of [8, 9, 10, 11, 12, 16]) {
    assert.equal(europaSurfaceAt(t).groundVisible, true, 'glacier must exist under veil at ' + t);
    assert.ok(europaDescentAt(t).terrainLift > -65, 'glacier horizon begins close enough to read');
  }
  for (let t = 7; t < 25; t += 0.5) {
    assert.ok(
      europaDescentAt(t + 0.5).terrainLift >= europaDescentAt(t).terrainLift,
      'same continuous canyon must never sink back below orbit at ' + t,
    );
  }
});

test('camera follows one controlled glacial descent and settles without a cut at combat unlock', () => {
  const at = [11, 12, 15, 18, 20, 23, 25, 27].map(europaDescentAt);
  assert.equal(at[0].cameraAscent, 0);
  assert.ok(at[2].cameraAscent < 0);
  assert.ok(at[3].cameraAscent < 0);
  assert.equal(at[6].cameraAscent, 0);
  assert.equal(at[7].cameraAscent, 0);
  for (let i = 1; i < at.length; i++)
    assert.ok(Math.abs(at[i].cameraAscent - at[i - 1].cameraAscent) < 0.32);
});

test('Europa uses exactly one celestial globe and raises the same ice scenery continuously', () => {
  const vista = createDestinationVista(5);
  const globe = vista.getObjectByName('destination-celestial-body');
  const iceParticles = vista.getObjectByName('europa-fissure-entry-ice');
  assert.ok(iceParticles?.isPoints, 'one low-cost glacial debris effect replaces generic reentry');
  assert.equal(iceParticles.userData.visualOnly, true);
  assert.equal(iceParticles.geometry.getAttribute('position').count, 90);
  assert.equal(iceParticles.visible, false);
  updateDestinationVista(vista, 5, 16);
  assert.equal(iceParticles.visible, true);
  assert.ok(iceParticles.material.opacity > 0.2);
  updateDestinationVista(vista, 5, 25);
  assert.equal(iceParticles.visible, false);
  for (const t of [0, 7, 10, 11, 12, 16, 20, 24]) {
    const state = updateDestinationVista(vista, 5, t);
    assert.equal(globe.visible, t < 8, 'moon must vanish as orbital mist develops at ' + t);
    assert.equal(globe.position.x, state.globeX);
    assert.equal(globe.position.y, state.globeY);
    assert.ok(globe.scale.x <= 1.64, 'moon stays at a believable apparent size');
  }
  updateDestinationVista(vista, 5, 25);
  assert.equal(globe.visible, false);
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  const legacy = scene.getObjectByName('world-orbital-globe');
  const root = scene.getObjectByName('europa-frozen-surface');
  assert.ok(legacy && root);
  for (const t of [0, 9, 14, 16, 19, 22, 25]) {
    const state = world.setDestinationArrival(t);
    assert.equal(legacy.visible, false, 'no duplicate generic globe');
    assert.equal(scene.getObjectByName('destination-celestial-body').visible, t < 8);
    assert.ok(Math.abs(root.position.y - state.terrainLift) < 1e-8);
    assert.equal(root.visible, europaSurfaceAt(t).groundVisible);
  }
  world.setEuropaTunnel(true);
  assert.equal(root.visible, false);
  world.setEuropaTunnel(false);
  assert.equal(root.visible, true);
  world.setEuropaBossArena(true, -83);
  assert.equal(root.visible, false);
  world.setDestinationArrival(40);
  assert.equal(root.visible, false);
  world.reset();
  assert.equal(scene.getObjectByName('destination-celestial-body').visible, true);
});
