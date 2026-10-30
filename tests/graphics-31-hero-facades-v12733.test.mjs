import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createHeroFacadeArchitecture } from '../src/premium-hero-facades.js';
import { createWorld } from '../src/visuals.js';

test('authored towers add real bevelled silhouette and layered illuminated facades', () => {
  const group = createHeroFacadeArchitecture();
  assert.equal(group.name, 'city-hero-facade-architecture');
  assert.equal(group.visible, false, 'High-only scenery must default to hidden');
  const expected = [
    ['city-hero-octagonal-shell', 20],
    ['city-hero-tiered-crowns', 40],
    ['city-hero-exoskeleton-ribs', 80],
    ['city-hero-illumination-slits', 120],
    ['city-hero-warm-window-bands', 120],
    ['city-hero-hologram-panels', 20],
    ['city-hero-skyport-decks', 20],
  ];
  assert.equal(group.children.length, expected.length);
  const matrix = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), size = new T.Vector3();
  for (const [name, count] of expected) {
    const mesh = group.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.equal(mesh.count, count);
    for (let i = 0; i < count; i++) {
      mesh.getMatrixAt(i, matrix);
      matrix.decompose(p, q, size);
      assert.ok([p.x, p.y, p.z, size.x, size.y, size.z].every(Number.isFinite));
      assert.ok(Math.abs(p.x) >= 105, 'architectural center must be far beyond the flight corridor');
      assert.ok(size.x > 0 && size.y > 0 && size.z > 0);
    }
  }
  const shell = group.getObjectByName('city-hero-octagonal-shell');
  assert.equal(shell.geometry.type, 'CylinderGeometry');
  assert.equal(shell.geometry.parameters.radialSegments, 8, 'towers must have octagonal geometry');
  const crown = group.getObjectByName('city-hero-tiered-crowns');
  const first = new T.Matrix4(), second = new T.Matrix4();
  crown.getMatrixAt(0, first);
  crown.getMatrixAt(1, second);
  assert.notDeepEqual(first.elements, second.elements, 'each megatower needs an actual stepped crown');
});

test('High-only facades switch off in Medium and remain off on the distant city tile', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const nearHero = city.getObjectByName('city-hero-facade-architecture');
  const farHero = far.getObjectByName('city-hero-facade-architecture');
  assert.ok(nearHero && farHero);
  world.setGraphicsQuality('medium');
  assert.equal(nearHero.visible, false);
  world.setGraphicsQuality('high');
  assert.equal(nearHero.visible, true);
  assert.equal(farHero.parent.visible, false, 'distant tile omits near-LOD entirely');
  world.setGraphicsQuality('medium');
  assert.equal(nearHero.visible, false);
  world.setGraphicsQuality('high');
  assert.equal(nearHero.visible, true);
  world.reset();
  world.update(0.1, 0.1, 48, true);
  assert.ok(Number.isFinite(city.position.z));
});
