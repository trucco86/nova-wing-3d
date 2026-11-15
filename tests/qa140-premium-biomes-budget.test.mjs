import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createAsteroidInterior, createAsteroidRockGeometry } from '../src/asteroid-interior.js';
import { createAsteroidCourse } from '../src/asteroid-course.js';
import {
  createEuropaSurface,
  createEuropaGlacialRidgeGeometry,
  updateEuropaSurface,
} from '../src/europa-surface.js';
import { createPremiumAtmosphericGeometry } from '../src/premium-atmospheric-geology.js';
import { createDestinationLandmarks } from '../src/destination-landmarks.js';

test('QA140: rock geology is baked once and instanced without extra tunnel draws', () => {
  const geo = createAsteroidRockGeometry();
  const p = geo.getAttribute('position');
  const colors = geo.getAttribute('color');
  assert.equal(colors.count, p.count);
  assert.ok(p.count > 50 && p.count < 500);
  const unique = new Set();
  for (let i = 0; i < colors.count; i++)
    unique.add([colors.getX(i), colors.getY(i), colors.getZ(i)].map((x) => x.toFixed(3)).join(':'));
  assert.ok(unique.size > 12, 'stone facets must contain distinct mineral strata');
  geo.dispose();

  const scene = new T.Scene();
  const cavern = createAsteroidInterior(scene);
  const tunnel = scene.getObjectByName('asteroid-cavern');
  assert.equal(tunnel.children.length, 8);
  assert.ok(tunnel.children.every((section) => section.children.length === 4));
  assert.equal(
    tunnel.children.reduce((n, section) => n + section.children.length, 0),
    32,
  );
  assert.ok(tunnel.children.every((section) => section.children[0].material.vertexColors));
  assert.equal(
    scene.getObjectByName('asteroid-entrance-jagged-rock-face').material.vertexColors,
    true,
  );
  assert.equal(scene.getObjectByName('asteroid-entrance-throat').material.vertexColors, true);
  cavern.reset(true);
  cavern.setPhase('transition');
  const p0 = cavern.snapshot();
  cavern.update(0, 55);
  assert.deepEqual(cavern.snapshot(), p0, 'pause does not move the shaft');
  cavern.destroy();
  assert.equal(scene.children.length, 0);
});

test('QA140: asteroid sweep scratch cannot mutate pilot input or break repeatability', () => {
  const scene = new T.Scene();
  const course = createAsteroidCourse(scene, true);
  course.setPhase('interior');
  const pilot = Object.freeze({ x: 0, y: 10, z: 0 });
  const half = Object.freeze({ x: 1.4, y: 1.4, z: 2.8 });
  for (let i = 0; i < 20; i++) course.advance(20, pilot, half);
  assert.deepEqual(pilot, { x: 0, y: 10, z: 0 });
  assert.ok(course.snapshot().offset >= 0);
  course.reset();
  assert.equal(course.snapshot().offset, 0);
  course.destroy();
  assert.equal(scene.children.length, 0);
});

test('QA140: Europa glacial geometry retains vertex and draw budget', () => {
  const geo = createEuropaGlacialRidgeGeometry();
  assert.equal(geo.getAttribute('position').count, 35);
  assert.equal(geo.getAttribute('color').count, 35);
  assert.ok(geo.index.count >= 150);
  geo.dispose();
  const root = createEuropaSurface();
  assert.equal(root.children.length, 3);
  const snow = root.getObjectByName('europa-windborne-ice-snow');
  assert.equal(snow.geometry.getAttribute('position').count, 84);
  root.getObjectByName = () => {
    throw new Error('no per-frame scene searches');
  };
  updateEuropaSurface(root, 20, true, true);
  const previous = snow.position.x;
  updateEuropaSurface(root, 40, false, false);
  assert.equal(root.visible, false);
  assert.equal(snow.visible, false);
  assert.equal(snow.position.x, previous, 'inactive snow must not animate');
  updateEuropaSurface(root, 20, true, true);
  assert.equal(snow.position.x, previous, 'pause/replay is deterministic');
  const clone = createEuropaSurface().clone(true);
  assert.doesNotThrow(() => updateEuropaSurface(clone, 24, true, true));
});

test('QA140: Neptune atmosphere gains vertex gradients but no geometry/instance growth', () => {
  const bank = createPremiumAtmosphericGeometry('neptune-storm-bank');
  assert.ok(bank.index && bank.getAttribute('normal'));
  assert.equal(bank.getAttribute('color').count, bank.getAttribute('position').count);
  assert.ok(bank.getAttribute('position').count < 550);
  const color = bank.getAttribute('color');
  assert.notEqual(color.getY(0), color.getY(Math.floor(color.count / 2)), 'strata variation');
  bank.dispose();
  const neptune = createDestinationLandmarks(6);
  const clouds = neptune.getObjectByName('neptune-turbulent-cloud-columns');
  const towers = neptune.getObjectByName('neptune-organic-hive-towers');
  assert.equal(clouds.count, 34);
  assert.equal(towers.count, 28);
  assert.ok(clouds.material.vertexColors);
  assert.ok(clouds.material.emissiveIntensity > 0 && clouds.material.emissiveIntensity < 0.2);
  assert.equal(towers.material.vertexColors, false);
  assert.equal(neptune.children.filter((x) => x.isInstancedMesh).length, 3);
  const venus = createDestinationLandmarks(4);
  assert.equal(venus.getObjectByName('venus-sulfur-cloud-columns').material.vertexColors, false);
});
