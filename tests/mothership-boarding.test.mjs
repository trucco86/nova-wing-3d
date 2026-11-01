import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';
import {
  BOARDING,
  mothershipApproachAt,
  createMothershipApproach,
  updateMothershipApproach,
} from '../src/mothership-approach.js';
import { createMothershipInterior, updateMothershipInterior } from '../src/mothership-interior.js';

test('phase 4 ship grows continuously in projected size as pilot approaches', () => {
  const at = (s) => mothershipApproachAt(s);
  const screenWidth = (s) => (280 * at(s).scale) / (32 - at(s).z);
  assert.deepEqual(
    [0, 8, 14, 17].map((s) => at(s).phase),
    ['sighting', 'approaching', 'approaching', 'hangar-alignment'],
  );
  assert.ok(screenWidth(0) < screenWidth(8));
  assert.ok(screenWidth(8) < screenWidth(14));
  assert.ok(screenWidth(14) < screenWidth(17));
  assert.ok(at(18).opening > 0.95, 'hangar shutters open before the crossing');
  assert.equal(at(0).visible, true, 'ship exists from the first stage frame');
  assert.equal(at(BOARDING.clear).visible, false, 'no external ship inside corridor');
  assert.equal(at(BOARDING.entry).inside, true);
  assert.equal(at(0).jupiterOpacity, 0);
  assert.equal(at(12).jupiterOpacity, 0);
  assert.equal(at(22).jupiterOpacity, 0);
  assert.throws(() => at(-1), RangeError);
});

test('same modeled ship opens the hangar and crosses the actual corridor gate', () => {
  const external = createMothershipApproach();
  const interior = createMothershipInterior();
  assert.ok(external.getObjectByName('devastador-hangar-upper-shutter'));
  assert.ok(external.getObjectByName('devastador-hangar-lower-shutter'));
  assert.ok(external.getObjectByName('devastador-engine-plasma'));
  const closed = external.getObjectByName('devastador-hangar-upper-shutter').position.y;
  updateMothershipApproach(external, 18);
  const opened = external.getObjectByName('devastador-hangar-upper-shutter').position.y;
  assert.ok(opened > closed + 29, 'door physically slides out of the pilot path');
  assert.equal(updateMothershipInterior(interior, 18).visible, false);
  const boarding = updateMothershipApproach(external, 21);
  const inside = updateMothershipInterior(interior, 21);
  assert.equal(inside.visible, true);
  assert.ok(
    Math.abs(interior.userData.threshold.position.z - (boarding.frontZ - 48)) < 0.001,
    'tunnel gate stays linked to the exterior hangar aperture',
  );
  assert.ok(
    external.userData.fixedSky,
    'authoring controls ship approach, not random scenery drift',
  );
  const state = external.userData.motion;
  updateMothershipApproach(external, 21);
  assert.deepEqual(external.userData.motion, state, 'same stage time is idempotent');
  updateMothershipApproach(external, 28);
  assert.equal(external.visible, false);
});

test('stage 4 shows only the Devastador and never shows Jupiter; stages 1–3 unchanged', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[3], 3);
  const actor = scene.getObjectByName('devastador-mothership-boarding');
  const corridor = scene.getObjectByName('marvin-mothership-interior');
  const globe = scene.getObjectByName('destination-celestial-body');
  assert.ok(actor && corridor && globe);
  assert.equal(scene.getObjectByName('distant-orbital-flagship').visible, false);
  assert.equal(world.setDestinationArrival(0).label, 'NAVE-MÃE DEVASTADOR À VISTA');
  assert.equal(actor.visible, true);
  assert.equal(corridor.visible, false);
  assert.equal(globe.visible, false);
  const entry = world.setDestinationArrival(22);
  assert.equal(entry.boardingPhase, 'threshold');
  assert.equal(entry.boardingInside, true);
  assert.equal(corridor.visible, true);
  assert.equal(globe.visible, false);
  assert.equal(scene.getObjectByName('destination-landmarks').visible, false);
  world.setDestinationArrival(25);
  assert.match(world.setDestinationArrival(25).label, /INTERIOR DO DEVASTADOR/);
  assert.equal(actor.visible, true);
  world.setDestinationArrival(28);
  assert.equal(actor.visible, false);
  assert.equal(corridor.visible, true);
  const gateAt28 = corridor.userData.threshold.position.z;
  world.setDestinationArrival(28);
  assert.equal(corridor.userData.threshold.position.z, gateAt28);
  for (let i = 0; i < 3; i++) {
    world.setSector(SECTORS[i], i);
    assert.equal(scene.getObjectByName('devastador-mothership-boarding'), undefined);
  }
  assert.deepEqual(
    SECTORS.slice(0, 3).map((s) => s.theme),
    ['city', 'mars', 'asteroids'],
  );
});
