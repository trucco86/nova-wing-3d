import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  graphicsBudgetTransition,
  createAdaptiveGraphics,
  HIGH_RENDER_PIXEL_BUDGET,
} from '../src/graphics-quality.js';
import { createWorld } from '../src/visuals.js';
import { animateCityBillboards } from '../src/city-premium.js';
import { createCity35LivedIn, updateCity35LivedIn } from '../src/city-35-lived-in.js';
import { SECTORS } from '../src/campaign.js';

test('QA143: HIGH caps wasteful supersampling, not premium mesh or shader quality', () => {
  const high = graphicsBudgetTransition(null, { quality: 'high', resolutionScale: 1 }, {
    viewportWidth: 1920,
    viewportHeight: 1080,
    devicePixelRatio: 3,
    coarsePointer: false,
  });
  const pixels = 1920 * 1080 * high.pixelRatio ** 2;
  assert.ok(pixels <= HIGH_RENDER_PIXEL_BUDGET.desktop + 3);
  assert.ok(pixels > 3_600_000, 'retain supersampling past 1080p');
  assert.equal(high.next.quality, 'high');
  assert.ok(high.pixelRatio < 1.7, 'avoid 6m pixel high preset on Full HD');

  const smaller = graphicsBudgetTransition(null, { quality: 'high', resolutionScale: 1 }, {
    viewportWidth: 1280, viewportHeight: 720, devicePixelRatio: 3,
  });
  assert.equal(smaller.pixelRatio, 1.7, 'small viewports retain original High sharpness');

  const adapted = graphicsBudgetTransition(high.next, { quality: 'high', resolutionScale: 0.87 }, {
    viewportWidth: 1920, viewportHeight: 1080, devicePixelRatio: 3,
  });
  assert.equal(adapted.qualityChanged, false);
  assert.equal(adapted.pixelRatioChanged, true);
  assert.ok(adapted.pixelRatio < high.pixelRatio);
});

test('QA143: portrait, landscape and DPR stay in physical pixel budget', () => {
  const base = { quality: 'high', resolutionScale: 1 };
  const landscape = graphicsBudgetTransition(null, base, {
    coarsePointer: true, viewportWidth: 932, viewportHeight: 430, devicePixelRatio: 3,
  });
  const portrait = graphicsBudgetTransition(landscape.next, base, {
    coarsePointer: true, viewportWidth: 430, viewportHeight: 932, devicePixelRatio: 3,
  });
  assert.equal(landscape.pixelRatio, portrait.pixelRatio, 'rotation does not sacrifice sharpness');
  assert.equal(portrait.pixelRatioChanged, false, 'no redundant allocation at equivalent area');
  assert.ok(932 * 430 * landscape.pixelRatio ** 2 <= HIGH_RENDER_PIXEL_BUDGET.coarse);
  const large = graphicsBudgetTransition(null, base, {
    coarsePointer: true, viewportWidth: 1290, viewportHeight: 2796, devicePixelRatio: 3,
  });
  assert.ok(1290 * 2796 * large.pixelRatio ** 2 <= HIGH_RENDER_PIXEL_BUDGET.coarse + 3);
  const invalid = graphicsBudgetTransition(null, base, {
    viewportWidth: 0, viewportHeight: 0, devicePixelRatio: 2,
  });
  assert.equal(invalid.pixelRatio, 1.7);
});

test('QA143: Manual High never discards geometry after sustained slow frames', () => {
  const high = createAdaptiveGraphics({
    mode: 'high', deviceMemory: 8, hardwareConcurrency: 8,
  });
  let timestamp = 0;
  let reductions = 0;
  for (let i = 0; i < 3200; i++) {
    timestamp += 52;
    const output = high.sample(timestamp, true);
    if (output) {
      reductions++;
      assert.equal(output.quality, 'high');
    }
  }
  assert.ok(reductions >= 2, 'Adaptive DPR still reacts to sustained jank');
  assert.equal(high.current().quality, 'high');
  const auto = createAdaptiveGraphics({
    mode: 'auto', coarsePointer: false, deviceMemory: 8, hardwareConcurrency: 8,
  });
  timestamp = 0;
  for (let i = 0; i < 3200; i++) {
    timestamp += 52;
    auto.sample(timestamp, true);
  }
  assert.equal(auto.current().quality, 'medium', 'Auto retains the safe fallback');
});

test('QA143: commercial beacons reuse scene roots and match deterministic signal', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.48, true);
  world.setSector(SECTORS[0], 0);
  const tiles = [
    scene.getObjectByName('launch-city'),
    scene.getObjectByName('launch-city-far'),
  ];
  const beacons = tiles.map((tile) =>
    tile.getObjectByName('city-commercial-billboards')
      .children.map((ad) => ad.getObjectByName('city-billboard-beacon')),
  );
  tiles.forEach((tile) => animateCityBillboards(tile, 150));
  const before = beacons.map((list) => list.map((b) => b.material.color.toArray()));
  tiles.forEach((tile) => { tile.getObjectByName = () => { throw new Error('scene traversal'); }; });
  tiles.forEach((tile) => animateCityBillboards(tile, 151));
  tiles.forEach((tile) => animateCityBillboards(tile, 150));
  assert.deepEqual(beacons.map((list) => list.map((b) => b.material.color.toArray())), before);
  assert.notEqual(beacons[0][0], beacons[1][0], 'cloned city owns independent beacons');
});

test('QA143: High-only turbine updates use cached objects without scene searching', () => {
  const buildings = Array.from({ length: 100 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * 140,
    h: 65 + i % 10,
    w: 19,
    depth: 22,
    z: -40 - i * 18,
  }));
  const root = createCity35LivedIn(buildings);
  const high = root.getObjectByName('city35-industrial-high');
  const fans = root.getObjectByName('city35-moving-turbine-rotors');
  assert.ok(high?.isGroup);
  assert.ok(fans?.isInstancedMesh);
  const highQuality = () => {
    high.visible = true;
    root.userData.quality = 'high';
    return root;
  };
  highQuality();
  updateCity35LivedIn(root, 99);
  const previousVersion = fans.instanceMatrix.version;
  root.getObjectByName = () => { throw new Error('per-frame traversal'); };
  updateCity35LivedIn(root, 101);
  assert.equal(high.visible, true);
  assert.ok(fans.instanceMatrix.version > previousVersion, 'active fans update GPU buffer');
});
