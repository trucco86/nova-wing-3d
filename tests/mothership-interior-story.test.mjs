import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createMothershipInterior,
  updateMothershipInterior,
  carrierInteriorState,
} from '../src/mothership-interior.js';
import { SECTORS } from '../src/campaign.js';

test('sector 4 actually traverses a massive interior hangar instead of ring geometry', () => {
  const root = createMothershipInterior();
  assert.match(SECTORS[3].name, /NAVE-MÃE/);
  assert.ok(root.userData.fixedSky);
  assert.equal(root.userData.sections.length, 6);
  const names = new Set();
  root.traverse((child) => {
    if (child.name) names.add(child.name);
    assert.equal(child.geometry?.type === 'TorusGeometry', false);
  });
  for (const name of [
    'carrier-side-hull',
    'carrier-docking-crane',
    'carrier-service-balcony',
    'carrier-reactor-coolant-core',
    'carrier-boarding-gate',
  ])
    assert.ok(names.has(name), name);
  assert.equal(root.visible, false);
});

test('mothership entry and interior segment travel are deterministic', () => {
  const root = createMothershipInterior();
  assert.equal(carrierInteriorState(15).visible, false);
  assert.equal(updateMothershipInterior(root, 21).visible, true);
  assert.equal(root.userData.zone, 'hangar');
  updateMothershipInterior(root, 54);
  assert.equal(root.userData.zone, 'industrial');
  updateMothershipInterior(root, 69);
  assert.equal(root.userData.zone, 'reactor');
  const first = root.userData.sections.map((section) => section.position.z);
  updateMothershipInterior(root, 69);
  assert.deepEqual(
    root.userData.sections.map((section) => section.position.z),
    first,
  );
  updateMothershipInterior(root, 0);
  assert.equal(root.visible, false);
});

test('mothership scenic geometry is distinct from approved stages 1, 2 and 3', () => {
  const group = createMothershipInterior();
  assert.equal(group.userData.sector, 3);
  assert.deepEqual(
    SECTORS.slice(0, 3).map((s) => s.theme),
    ['city', 'mars', 'asteroids'],
  );
  assert.equal(SECTORS[3].theme, 'station');
  const scene = new T.Scene();
  scene.add(group);
  assert.equal(scene.children.length, 1);
});
