import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { postFxTargetPlan, postProcessor } from '../src/visuals.js';
import {
  createCity122StreetInfill,
  setCity122Quality,
  animateCity122StreetLife,
} from '../src/city-122-street-infill.js';

const buildings = Array.from({ length: 85 }, (_, i) => ({
  x: (i % 2 === 0 ? 1 : -1) * (130 + (i % 4) * 28),
  z: -30 - i * 20,
  w: 19,
  depth: 19,
  h: 43 + (i % 6) * 11,
}));

test('QA144: large High viewports keep premium MSAA with bounded blur targets', () => {
  const full = postFxTargetPlan(1920, 1080, 1.33);
  assert.equal(full.samples, 2);
  assert.equal(full.width, Math.round(1920 * 1.33));
  assert.equal(full.height, Math.round(1080 * 1.33));
  assert.ok(full.bloomPixels <= 300_000);
  assert.ok(full.bloomPixels >= 275_000);
  const small = postFxTargetPlan(960, 540, 1.7);
  assert.equal(small.samples, 4);
  assert.ok(small.bloomPixels <= 300_000);
  const mobile = postFxTargetPlan(932, 430, 1.35, { coarsePointer: true });
  assert.equal(mobile.samples, 2);
  assert.ok(mobile.bloomPixels <= 300_000);
  const ratio = full.bloomWidth / full.bloomHeight;
  assert.ok(Math.abs(ratio - 1920 / 1080) < 0.02);
});

test('QA144: compositing retains original three effects and releases its resources', () => {
  let ratio = 1.33;
  const renderer = {
    extensions: { has: () => false },
    getPixelRatio: () => ratio,
    info: { render: { calls: 87, triangles: 19000 } },
    setRenderTarget() {},
    render() {},
  };
  const post = postProcessor(renderer, new T.Scene(), new T.PerspectiveCamera());
  post.setGraphicsQuality('high');
  post.resize(1920, 1080);
  const big = post.getTargetBudget();
  assert.equal(big.samples, 2);
  assert.equal(big.direct, false);
  assert.ok(big.bloomPixels <= 300_000);
  assert.equal(post.render().postPasses, 3);
  ratio = 1.7;
  post.resize(960, 540);
  const compact = post.getTargetBudget();
  assert.equal(compact.samples, 4);
  assert.equal(compact.bloomWidth > 0, true);
  assert.equal(post.destroy(), 6);
  assert.equal(post.destroy(), 0);
});

test('QA144: static city batches have conservative, initialized frustum bounds', () => {
  const root = createCity122StreetInfill(buildings);
  const staticNames = [
    'city122-grounded-pedestrian-pavements',
    'city122-real-ground-floor-storefront-glazing',
    'city122-grounded-street-tree-canopies',
    'city122-subtle-amber-street-wayfinding',
    'city122-service-bench-and-planter-furniture',
    'city122-loading-bay-small-furniture',
  ];
  for (const name of staticNames) {
    const mesh = root.getObjectByName(name);
    assert.equal(mesh.frustumCulled, true, name);
    assert.ok(
      mesh.boundingSphere &&
        Number.isFinite(mesh.boundingSphere.radius) &&
        mesh.boundingSphere.radius > 0,
    );
    assert.equal(mesh.userData.hitbox, undefined);
  }
  for (const name of [
    'city122-service-entries-and-transit-shelters',
    'city122-grounded-vent-vapor-high',
  ])
    assert.equal(root.getObjectByName(name).frustumCulled, false, name);
  const clone = root.clone(true);
  assert.ok(clone.getObjectByName(staticNames[0]).boundingSphere);
});

test('QA144: invisible vapor remains idle and returns at correct travel in High', () => {
  const root = createCity122StreetInfill(buildings);
  const vapor = root.getObjectByName('city122-grounded-vent-vapor-high');
  const a = vapor.instanceMatrix.version;
  animateCity122StreetLife(root, 145);
  assert.equal(vapor.instanceMatrix.version, a, 'Medium cannot upload High steam');
  animateCity122StreetLife(root, 200);
  assert.equal(vapor.instanceMatrix.version, a);
  setCity122Quality(root, 'high');
  animateCity122StreetLife(root, 200);
  assert.ok(vapor.instanceMatrix.version > a);
  const snapshot = new T.Matrix4();
  vapor.getMatrixAt(0, snapshot);
  animateCity122StreetLife(root, 200);
  const still = new T.Matrix4();
  vapor.getMatrixAt(0, still);
  assert.deepEqual(still.elements, snapshot.elements);
  setCity122Quality(root, 'medium');
  const before = vapor.instanceMatrix.version;
  animateCity122StreetLife(root, 275);
  assert.equal(vapor.instanceMatrix.version, before);
  const clone = createCity122StreetInfill(buildings).clone(true);
  animateCity122StreetLife(clone, 200);
  const people = clone.getObjectByName('city122-service-entries-and-transit-shelters');
  const saved = people.instanceMatrix.version;
  clone.getObjectByName = () => {
    throw new Error('per-frame scene search');
  };
  animateCity122StreetLife(clone, 260);
  assert.ok(people.instanceMatrix.version > saved);
});
