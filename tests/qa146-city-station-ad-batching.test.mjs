import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { createCityDistricts } from '../src/city-districts.js';
import { createCityPremiumInfrastructure, animateCityBillboards } from '../src/city-premium.js';
import { SECTORS } from '../src/campaign.js';

const samples = (mesh) => {
  const matrix = new T.Matrix4();
  const pos = new T.Vector3();
  const quaternion = new T.Quaternion();
  const scale = new T.Vector3();
  return Array.from({ length: mesh.count }, (_, i) => {
    mesh.getMatrixAt(i, matrix);
    matrix.decompose(pos, quaternion, scale);
    return { x: pos.x, y: pos.y, z: pos.z, w: scale.x, h: scale.y, d: scale.z };
  });
};
const near = (actual, expected) =>
  ['x', 'y', 'z', 'w', 'h', 'd'].every((key) => Math.abs(actual[key] - expected[key]) < 0.0002);
const meshStats = (node) => {
  let count = 0, instanced = 0, triangles = 0;
  node.traverse((x) => {
    if (!x.isMesh) return;
    count++;
    if (x.isInstancedMesh) instanced++;
    const tri = (x.geometry.index?.count || x.geometry.attributes.position?.count || 0) / 3;
    triangles += tri * (x.isInstancedMesh ? x.count : 1);
  });
  return { count, instanced, triangles };
};
test('QA146 maglev stations preserve all 24 boxes with just 3 draws per tile', () => {
  const root = createCityDistricts();
  const stations = [
    root.getObjectByName('city-maglev-opening-terminal'),
    root.getObjectByName('city-maglev-station-west'),
    root.getObjectByName('city-maglev-station-east'),
  ];
  assert.deepEqual(stations.map((s) => s.userData.stationParts.length), [8, 8, 8]);
  assert.deepEqual(stations.map((s) => s.position.toArray()), [[80, 0, -215], [-80, 0, -585], [80, 0, -1315]]);
  const expected = { frame: [], cap: [], lowLight: [] };
  for (const station of stations)
    for (const part of station.userData.stationParts)
      expected[part.material].push({
        x: station.position.x + part.x, y: part.y, z: station.position.z + part.z,
        w: part.w, h: part.h, d: part.d,
      });
  for (const [kind, count] of [['frame', 9], ['cap', 9], ['lowLight', 6]]) {
    const batched = root.getObjectByName('city-maglev-station-batched-' + kind);
    assert.ok(batched?.isInstancedMesh);
    assert.equal(batched.count, count);
    assert.equal(batched.geometry.index.count, 36);
    assert.ok(batched.boundingSphere.radius > 0);
    assert.equal(batched.userData.visualOnly, true);
    assert.equal(batched.userData.collider, undefined);
    const actual = samples(batched);
    assert.ok(expected[kind].every((target, i) => near(target, actual[i])));
  }
  assert.equal(root.userData.stationBatchCount, 3);
  assert.equal(root.userData.stationOriginalParts, 24);
  assert.equal(stations.reduce((total, s) => total + meshStats(s).count, 0), 0);
});

test('QA146 6 signs keep independent beacons and all 18 original fixed parts', () => {
  const g = createCityPremiumInfrastructure();
  const signs = g.getObjectByName('city-commercial-billboards');
  assert.equal(signs.children.length, 6);
  const frame = g.getObjectByName('city-commercial-billboard-batched-frame');
  const trim = g.getObjectByName('city-commercial-billboard-batched-trim');
  assert.equal(frame.count, 6);
  assert.equal(trim.count, 12);
  assert.deepEqual(g.userData.billboardStructure, {draws: 2, metalParts: 6, neonParts: 12});
  const metal = samples(frame);
  const lights = samples(trim);
  for (let i = 0; i < signs.children.length; i++) {
    const sign = signs.children[i];
    assert.ok(sign.getObjectByName('advertising-panel').material.map?.isTexture);
    const beacon = sign.getObjectByName('city-billboard-beacon');
    assert.ok(beacon?.isMesh, 'each creative keeps its own pulse and material');
    assert.equal(sign.children.filter((x) => x.isMesh).length, 2);
    const x = sign.position.x, y = sign.position.y, z = sign.position.z;
    assert.ok(near(metal[i], { x, y, z: z - 0.8, w: 30, h: 46, d: 1.6 }));
    assert.ok(near(lights[2*i], {x, y:y + 24, z:z - 0.2, w:31, h:0.6, d:1.2}));
    assert.ok(near(lights[2*i+1], {x, y:y - 24, z:z - 0.2, w:31, h:0.6, d:1.2}));
  }
  const before = signs.children.map((sign) =>
    sign.getObjectByName('city-billboard-beacon').material.color.toArray());
  const tile = new T.Group();
  tile.add(g);
  animateCityBillboards(tile, 317);
  const after = signs.children.map((sign) =>
    sign.getObjectByName('city-billboard-beacon').material.color.toArray());
  assert.ok(after.some((entry, i) => entry.some((value, index) => value !== before[i][index])));
  animateCityBillboards(tile, 317);
  assert.deepEqual(signs.children.map((sign) =>
    sign.getObjectByName('city-billboard-beacon').material.color.toArray()), after);
});

test('QA146 high and medium preserve authored static triangles after two tiles clone and looping', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const a = scene.getObjectByName('launch-city');
  const b = scene.getObjectByName('launch-city-far');
  const districts = [a, b].map((x) => x.getObjectByName('city-architectural-districts'));
  const adverts = [a, b].map((x) => x.getObjectByName('city-premium-infrastructure'));
  const uniqueGeometryCount = () => {
    const all = new Set();
    for (const tile of [a, b]) tile.traverse((node) => { if (node.geometry) all.add(node.geometry); });
    return all.size;
  };
  const resources = uniqueGeometryCount();
  assert.equal(districts.reduce((n, x) => n + ['frame','cap','lowLight'].filter((key) =>
    x.getObjectByName('city-maglev-station-batched-'+key)?.isInstancedMesh).length, 0), 6);
  assert.equal(adverts.reduce((n, x) => n + ['frame','trim'].filter((key) =>
    x.getObjectByName('city-commercial-billboard-batched-'+key)?.isInstancedMesh).length, 0), 4);
  assert.notEqual(adverts[0].getObjectByName('city-commercial-billboard-batched-frame').instanceMatrix,
    adverts[1].getObjectByName('city-commercial-billboard-batched-frame').instanceMatrix);
  // Compare the same High geometry before and after all quality changes.
  // A Medium baseline would misinterpret the intentionally hidden High details.
  world.setGraphicsQuality('high');
  const baseTriangles = meshStats(a).triangles + meshStats(b).triangles;
  for (let i=0; i<4; i++) {
    world.setGraphicsQuality(i % 2 ? 'high' : 'medium');
    world.update(0.3, i * 0.3, 48, true);
  }
  world.setGraphicsQuality('high');
  assert.equal(uniqueGeometryCount(), resources, 'quality switches must not create new geometries');
  assert.equal(meshStats(a).triangles + meshStats(b).triangles, baseTriangles,
    'no change in authored geometry across repeated quality changes');
  world.setSector(SECTORS[1]);
  world.setSector(SECTORS[0]);
  assert.equal(uniqueGeometryCount(), resources, 'sector switch keeps static city assets reused');
  assert.ok(districts.every((root) => root.getObjectByName('city-maglev-station-batched-frame').visible));
});
