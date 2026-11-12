import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { cityVolumesOverlap } from '../src/city-ad-slots.js';
import { CITY40_HERO_RANGE, planCity40HeroBuildings } from '../src/city-40-hero-section.js';

const volume = (b) => ({
  x: b.x, y: b.h / 2 - 7, z: b.z, w: b.w, h: b.h, depth: b.depth,
});

test('QA112: 285m hero section uses real sites and never intersects other building envelopes', () => {
  assert.equal(CITY40_HERO_RANGE.frontZ - CITY40_HERO_RANGE.backZ, 285);
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  let total = 0;
  for (const [tileName, variant] of [['launch-city','civic'], ['launch-city-far','industrial']]) {
    const tile = scene.getObjectByName(tileName);
    const hero = tile.getObjectByName('city40-hero-architecture');
    assert.equal(hero.userData.variant, variant);
    const selected = hero.userData.buildings;
    assert.ok(selected.length >= 4 && selected.length <= 12, 'prototype must be visible, but remain small');
    total += selected.length;
    const base = tile.userData.buildingFootprints;
    const adHosts = new Set(tile.getObjectByName('city-premium-ad-inventory').userData.slots.map(s => s.hostIndex));
    const towers = tile.getObjectByName('city-architectural-districts').userData.towerFootprints;
    const pads = tile.getObjectByName('city-architectural-districts').userData.platformFootprints;
    for (const host of selected) {
      assert.deepEqual({x:host.x,z:host.z,w:host.w,h:host.h,depth:host.depth},base[host.index]);
      assert.ok(!adHosts.has(host.index), 'prototype cannot cover future ads');
      assert.ok(host.z <= -115 && host.z >= -400, 'all hero facades belong to limited 285m section');
      assert.ok(Math.abs(host.x) - host.envelope.w / 2 >= 118, 'playable lane remains clear');
      const structures = [...base.filter((_, i) => i !== host.index), ...towers, ...pads];
      assert.ok(
        structures.every(other => !cityVolumesOverlap(host.envelope, volume(other), 0.29)),
        'a facade skin must not enter another skyscraper or transit podium',
      );
      assert.ok(selected.every(other => other === host ||
        !cityVolumesOverlap(host.envelope, other.envelope, 0.5)));
    }
    assert.deepEqual(
      planCity40HeroBuildings(tile, variant).map(b => b.index),
      selected.map(b => b.index),
      'hero buildings are deterministic across resets and replays',
    );
    assert.ok(hero.userData.metrics.drawUnits <= 4);
    assert.ok(hero.userData.metrics.triangles > 400);
    assert.ok(hero.userData.metrics.triangles < 45000, 'model count must be bounded');
  }
  assert.ok(total >= 10, 'near and far districts must contain a meaningful test scene');
});

test('QA112: architectural 3D buffers have finite positions, valid indexes and physical materials', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.47, true);
  world.setSector(SECTORS[0]);
  for (const tileName of ['launch-city', 'launch-city-far']) {
    const tile = scene.getObjectByName(tileName);
    const hero = tile.getObjectByName('city40-hero-architecture');
    const low = hero.getObjectByName('city40-architectural-medium');
    const high = hero.getObjectByName('city40-precision-high');
    assert.ok(low?.isGroup && high?.isGroup);
    assert.ok(low.children.length >= 3);
    for (const child of [...low.children, ...high.children]) {
      assert.ok(child.isMesh && !child.isInstancedMesh, 'one merged geometry per material group');
      assert.equal(child.userData.visualOnly, true);
      assert.equal(child.material.vertexColors, true);
      const g = child.geometry;
      const pos = g.getAttribute('position');
      const normal = g.getAttribute('normal');
      const uv = g.getAttribute('uv');
      assert.equal(normal.count, pos.count);
      assert.equal(uv.count, pos.count);
      assert.ok([...pos.array, ...normal.array, ...uv.array].every(Number.isFinite));
      for (const ix of g.index.array) assert.ok(ix >= 0 && ix < pos.count);
      assert.ok(g.boundingSphere?.radius > 0);
    }
    const masonry = hero.getObjectByName('city40-sculpted-masonry');
    const glass = hero.getObjectByName('city40-deep-bay-glazing');
    assert.ok(masonry.material.isMeshPhysicalMaterial);
    assert.ok(masonry.material.normalMap?.isTexture);
    assert.ok(masonry.material.roughnessMap?.isTexture);
    assert.ok(glass.material.isMeshPhysicalMaterial);
    assert.ok(glass.material.clearcoat >= 0.8);
    world.setGraphicsQuality('medium');
    assert.equal(high.visible, false);
    world.setGraphicsQuality('high');
    assert.equal(high.visible, true);
    world.setGraphicsQuality('medium');
    assert.equal(high.visible, false);
  }
});

test('QA112: Graphics 4.0 changes facade render only, not stage-1 spatial collider inventory', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.41, true);
  world.setSector(SECTORS[0]);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const nearAnchors = near.userData.buildingFootprints.map(x => ({...x}));
  const farAnchors = far.userData.buildingFootprints.map(x => ({...x}));
  for (const tile of [near, far]) {
    const hero = tile.getObjectByName('city40-hero-architecture');
    hero.traverse(obj => {
      assert.equal(obj.userData.solid, undefined);
      assert.equal(obj.userData.hitbox, undefined);
      assert.notEqual(obj.userData.gameplayCollider, true);
    });
  }
  world.update(1, 1, 1895, true);
  world.update(1, 2, 10, true);
  assert.deepEqual(near.userData.buildingFootprints, nearAnchors);
  assert.deepEqual(far.userData.buildingFootprints, farAnchors);
  world.reset();
  assert.deepEqual(near.userData.buildingFootprints, nearAnchors);
  assert.deepEqual(far.userData.buildingFootprints, farAnchors);
});
