import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createCity35LivedIn,
  setCity35LivedInQuality,
  updateCity35LivedIn,
  city35LivedInSnapshot,
} from '../src/city-35-lived-in.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const buildings = Array.from({ length: 200 }, (_, i) => ({
  x: (i % 2 ? 1 : -1) * (105 + (i % 5) * 24),
  h: 38 + ((i * 13) % 67),
  z: -30 - Math.floor(i / 2) * 19,
  w: 8 + (i % 10),
  depth: 8 + (i % 9),
}));
function pose(mesh, index = 0) {
  const transform = new T.Matrix4();
  mesh.getMatrixAt(index, transform);
  return { x: transform.elements[12], y: transform.elements[13], z: transform.elements[14] };
}

test('rooftop taxiports and HVAC are grounded in real tower caps and kept beyond flight corridor', () => {
  const root = createCity35LivedIn(buildings);
  const rooftops = root.getObjectByName('city35-rooftop-landing-pads');
  const lights = root.getObjectByName('city35-landing-safety-lights');
  assert.ok(rooftops.count >= 8, 'multiple recognizable rooftop landing pads');
  assert.equal(lights.count, rooftops.count * 4, 'four safety lights per landing pad');
  const chosen = buildings.filter((b, i) => i % 10 === 3 && b.h >= 47);
  assert.equal(chosen.length, rooftops.count);
  for (let i = 0; i < rooftops.count; i++) {
    const p = pose(rooftops, i);
    assert.equal(p.x, chosen[i].x);
    assert.equal(p.z, chosen[i].z);
    assert.ok(Math.abs(p.y - (chosen[i].h - 2.82)) < 0.00001);
    assert.ok(Math.abs(p.x) > 90, 'no fake flight-path obstacle');
  }
  assert.ok(root.getObjectByName('city35-industrial-service-machinery').count > 10);
  assert.ok(root.getObjectByName('city35-facade-electrical-conduits').count > 10);
  assert.ok(root.userData.lifts.every((p) => Math.abs(p.x) > 86));
  root.traverse((child) => {
    if (child.isMesh) {
      assert.equal(child.userData.visualOnly, true);
      assert.equal(child.userData.solid, undefined, 'none of these details are physical obstacles');
    }
  });
});

test('animated exterior lift has synchronized hull/glazing/beacons and different motion phases', () => {
  const root = createCity35LivedIn(buildings);
  setCity35LivedInQuality(root, 'high');
  const hull = root.getObjectByName('city35-facade-service-cabins');
  const glass = root.getObjectByName('city35-facade-service-glazing');
  const lights = root.getObjectByName('city35-moving-lift-beacons');
  assert.ok(hull.count >= 8);
  const atStart = city35LivedInSnapshot(root).heights;
  updateCity35LivedIn(root, 37.7);
  const after = city35LivedInSnapshot(root).heights;
  assert.ok(
    after.some((y, i) => Math.abs(y - atStart[i]) > 1.5),
    'real vertical animation',
  );
  assert.ok(new Set(after.map((y) => Math.round(y))).size >= 4, 'independent lift phases');
  for (let i = 0; i < hull.count; i++) {
    const body = pose(hull, i);
    const window = pose(glass, i);
    assert.ok(Math.abs(body.y - window.y + 0.1) < 0.00001);
    assert.equal(body.x, window.x);
    assert.ok(
      Math.abs(body.z + 1.48 - window.z) < 0.00005,
      'lift glazing follows body within Float32 GPU precision',
    );
    for (let k = 0; k < 2; k++) {
      const signal = pose(lights, i * 2 + k);
      assert.ok(Math.abs(signal.y - body.y - 1.52) < 0.00001);
    }
  }
  updateCity35LivedIn(root, 0);
  assert.deepEqual(city35LivedInSnapshot(root).heights, atStart, 'reset is deterministic');
});

test('quality Medium retains key details while High adds subtle vents and more lift animation', () => {
  const root = createCity35LivedIn(buildings);
  const medium = city35LivedInSnapshot(root);
  assert.equal(medium.quality, 'medium');
  assert.equal(medium.lifts, Math.min(6, root.userData.lifts.length));
  assert.equal(medium.vents, 0);
  assert.equal(root.getObjectByName('city35-industrial-high').visible, false);
  setCity35LivedInQuality(root, 'high');
  updateCity35LivedIn(root, 20);
  const high = city35LivedInSnapshot(root);
  assert.equal(high.quality, 'high');
  assert.ok(high.lifts > medium.lifts);
  assert.ok(high.vents > 0);
  assert.equal(high.beacons, high.lifts * 2);
  const children = [];
  root.traverse((child) => {
    if (child.isMesh) children.push(child);
  });
  const count = children.length;
  for (let t = 0; t < 600; t++) updateCity35LivedIn(root, t * 0.05);
  const same = [];
  root.traverse((child) => {
    if (child.isMesh) same.push(child);
  });
  assert.deepEqual(same, children, '600 frame updates must reuse all previously-created meshes');
  assert.equal(same.length, count);
  setCity35LivedInQuality(root, 'medium');
  assert.equal(city35LivedInSnapshot(root).vents, 0);
});

test('city clones animate independently and obey their own rendering quality', () => {
  const near = createCity35LivedIn(buildings);
  const far = near.clone();
  far.userData.phase = 2.8;
  updateCity35LivedIn(near, 91);
  updateCity35LivedIn(far, 91);
  assert.notDeepEqual(city35LivedInSnapshot(near).heights, city35LivedInSnapshot(far).heights);
  const nearMesh = near.getObjectByName('city35-facade-service-cabins');
  const farMesh = far.getObjectByName('city35-facade-service-cabins');
  assert.notEqual(nearMesh, farMesh);
  assert.notEqual(nearMesh.instanceMatrix, farMesh.instanceMatrix);
  setCity35LivedInQuality(far, 'high');
  assert.equal(city35LivedInSnapshot(near).quality, 'medium');
  assert.equal(city35LivedInSnapshot(far).quality, 'high');
});

test('existing world and sector changes enable new details only on the city stage', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.49, true);
  world.setSector(SECTORS[0], 0);
  world.setGraphicsQuality('high');
  let snapshots = world.city35DetailSnapshot();
  assert.equal(snapshots.length, 2);
  assert.ok(snapshots.every((x) => x.pads >= 1 && x.lifts >= 1 && x.vents >= 1));
  world.update(0.05, 2, 480, true, 2);
  const after = world.city35DetailSnapshot();
  assert.notDeepEqual(after[0].heights, snapshots[0].heights);
  world.setSector(SECTORS[1], 1);
  assert.equal(scene.getObjectByName('city35-lived-in-metropolis').visible, false);
  world.reset();
  world.setSector(SECTORS[0], 0);
  snapshots = world.city35DetailSnapshot();
  assert.ok(snapshots.every((x) => x.pads >= 1));
});
