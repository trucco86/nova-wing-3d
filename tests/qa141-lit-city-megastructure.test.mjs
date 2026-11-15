import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCityHorizonMegastructure } from '../src/city-commerce.js';
import { createCity34Concept, setCity34ConceptQuality } from '../src/city-34-concept.js';
import { createCity40SkylineLandmark } from '../src/city-40-hero-section.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('QA141: the architectural citadel renders in four base batches plus its original torus', () => {
  const root = createCityHorizonMegastructure();
  const high = root.getObjectByName('city-megastructure-high-detail');
  const main = root.children.filter((x) => x.isMesh || x.isInstancedMesh);
  const extra = high.children.filter((x) => x.isMesh || x.isInstancedMesh);
  const budget = root.userData.detailBudget;
  assert.equal(root.userData.visualOnly, true);
  assert.equal(budget.mediumDraws, 5);
  assert.equal(budget.highDraws, 7);
  assert.equal(main.length, 5);
  assert.equal(extra.length, 2);
  assert.ok(budget.mediumIlluminatedWindows >= 95);
  assert.ok(budget.highIlluminatedWindows >= 40);
  assert.equal(root.getObjectByName('citadel-orbital-ring').geometry.type, 'TorusGeometry');
  for (const batch of [...main, ...extra]) {
    assert.equal(batch.userData.visualOnly, true);
    assert.notEqual(batch.userData.collider, true);
    assert.notEqual(batch.userData.hitbox, true);
    if (batch.isInstancedMesh) {
      assert.ok(batch.count > 0);
      assert.ok(batch.instanceColor?.count >= batch.count);
      assert.equal(batch.geometry.type, 'BoxGeometry');
    }
  }
  assert.doesNotThrow(() => root.clone(true), 'no runtime THREE object in userData');
});

test('QA141: all 42 skyline buildings have baseline lights in Medium', () => {
  const root = createCity34Concept();
  const warm = root.getObjectByName('city34-facade-baseline-amber');
  const cool = root.getObjectByName('city34-facade-baseline-cool');
  assert.equal(root.userData.architecture.length, 42);
  assert.equal(root.userData.baselineLitBuildings, 42);
  assert.equal(warm.count, 42);
  assert.equal(cool.count, 42);
  assert.equal(warm.parent, root);
  assert.equal(cool.parent, root);
  assert.equal(warm.material.toneMapped, false);
  assert.equal(cool.material.toneMapped, false);
  assert.ok(root.getObjectByName('city34-tower-glazing').material.clearcoat > 0.8);
  setCity34ConceptQuality(root, 'medium');
  assert.equal(warm.visible, true);
  assert.equal(cool.visible, true);
  assert.equal(root.getObjectByName('city34-concept-high-detail').visible, false);
  setCity34ConceptQuality(root, 'high');
  assert.equal(root.getObjectByName('city34-concept-high-detail').visible, true);
  root.traverse((node) => assert.notEqual(node.userData.hitbox, true));
});

test('QA141: central skyline signature has more window geometry but the same three draws', () => {
  const landmark = createCity40SkylineLandmark();
  assert.equal(landmark.userData.metrics.drawUnits, 3);
  assert.ok(landmark.userData.metrics.triangles < 5000);
  assert.ok(landmark.userData.metrics.bytes < 256 * 1024);
  const glass = landmark.getObjectByName('city40-landmark-glazing');
  assert.ok(glass.geometry.index.count > 400);
  assert.equal(landmark.getObjectByName('city40-landmark-faceted-spires').isMesh, true);
});

test('QA141: integrated world preserves non-colliding city horizon and High/Medium separation', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0], 0);
  const horizon = scene.getObjectByName('city-distant-horizon');
  const megastructure = horizon.getObjectByName('city-horizon-megastructure');
  const bright = scene.getObjectByName('city-horizon-window-bands');
  assert.equal(megastructure.userData.detailBudget.mediumDraws, 5);
  assert.equal(bright.parent, horizon, 'existing horizon lights remain visible in Medium');
  world.setGraphicsQuality('medium');
  assert.equal(bright.visible, true);
  assert.equal(megastructure.getObjectByName('city-megastructure-high-detail').visible, false);
  world.setGraphicsQuality('high');
  assert.equal(megastructure.getObjectByName('city-megastructure-high-detail').visible, true);
  world.setGraphicsQuality('medium');
  const before = megastructure.position.clone();
  world.update(0.2, 0.2, 450, true);
  assert.ok(megastructure.position.equals(before));
  megastructure.traverse((node) => {
    assert.equal(node.userData.hitbox, undefined);
    assert.equal(node.userData.solid, undefined);
  });
  world.destroy?.();
});
