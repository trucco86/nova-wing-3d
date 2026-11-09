import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { destinationArrivalAt } from '../src/destination-arrival.js';
import { createWorld } from '../src/visuals.js';
import {
  createEuropaSurface,
  europaSurfaceAt,
  updateEuropaSurface,
} from '../src/europa-surface.js';

test('Europa orbit disappears before the actual surface opens and cannot remain above it', () => {
  const early = europaSurfaceAt(9);
  assert.equal(early.orbitalVisible, true);
  assert.equal(early.groundVisible, false);
  const surface = europaSurfaceAt(26);
  assert.equal(surface.orbitalVisible, false);
  assert.equal(europaSurfaceAt(18).orbitalVisible, false, 'moon gone before frozen ground');
  assert.equal(destinationArrivalAt(5, 18).globeOpacity, 0);
  assert.equal(surface.groundVisible, true);
  assert.ok(surface.frostDensity > early.frostDensity);
  assert.equal(europaSurfaceAt(26, true).groundVisible, false);
  assert.equal(destinationArrivalAt(5, 20).globeOpacity, 0);
  assert.equal(destinationArrivalAt(5, 26).globeOpacity, 0);
  assert.ok(destinationArrivalAt(4, 20).globeOpacity > 0, 'Venus arrival unchanged');
  assert.throws(() => europaSurfaceAt(Number.NaN), RangeError);
});

test('Europa tunnel owns its floor: no two coplanar surfaces, glacial vista returns outside', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  const ground = scene.getObjectByName('launch-ground');
  const globe = scene.getObjectByName('world-orbital-globe');
  const destination = scene.getObjectByName('destination-celestial-body');
  const surface = scene.getObjectByName('europa-frozen-surface');
  assert.ok(ground && globe && destination && surface);
  world.setDestinationArrival(10);
  assert.equal(globe.visible, true);
  assert.equal(surface.visible, false);
  world.setDestinationArrival(26);
  assert.equal(globe.visible, false, 'moon from orbital sky must be gone on surface');
  assert.equal(destination.visible, false, 'distant second globe must also be gone');
  assert.equal(surface.visible, true);
  assert.equal(ground.visible, true);
  assert.ok(scene.fog.density >= 0.002, 'frost haze instead of clear generic horizon');

  assert.equal(world.setEuropaTunnel(true), true);
  assert.equal(ground.visible, false, 'avoid z-fighting with physical -7 tunnel floor');
  assert.equal(surface.visible, false, 'avoid foreground intersecting tunnel walls');
  world.setDestinationArrival(31);
  assert.equal(ground.visible, false, 'arrival update must not restore coplanar ground');
  assert.equal(world.setEuropaTunnel(false), false);
  assert.equal(ground.visible, true);
  assert.equal(surface.visible, true);

  world.setEuropaBossArena(true, -83);
  world.setDestinationArrival(92);
  assert.equal(surface.visible, false, 'boss arena keeps clean 360-degree sightline');
  assert.equal(world.setEuropaTunnel(true), false);
  assert.equal(world.europaBossArenaState().floorY, -83);
  world.setSector(SECTORS[4], 4);
  assert.equal(world.setEuropaTunnel(true), false, 'tunnel rule is exclusive to Europa');
  assert.equal(scene.getObjectByName('europa-frozen-surface'), undefined);
});

test('frozen surface detail stays outside flight corridor with bounded mobile draw calls', () => {
  const root = createEuropaSurface();
  assert.equal(root.name, 'europa-frozen-surface');
  assert.equal(root.userData.visualOnly, true);
  assert.equal(root.children.length, 3, 'two instanced shelves and a single snow draw');
  for (const mesh of root.children.filter((o) => o.isInstancedMesh)) {
    assert.ok(mesh.count <= 32);
    assert.equal(mesh.userData.visualOnly, true);
    const m = new T.Matrix4();
    const p = new T.Vector3();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m);
      p.setFromMatrixPosition(m);
      assert.ok(Math.abs(p.x) >= 100, 'no ice wall intersects the flight corridor');
    }
  }
  updateEuropaSurface(root, 28, true, true);
  assert.equal(root.visible, true);
  assert.equal(root.getObjectByName('europa-windborne-ice-snow').visible, true);
  updateEuropaSurface(root, 29, true, false);
  assert.equal(root.getObjectByName('europa-windborne-ice-snow').visible, false);
  updateEuropaSurface(root, 29, false, false);
  assert.equal(root.visible, false);
  root.traverse((node) => {
    node.geometry?.dispose();
    node.material?.dispose();
  });
});
