import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createObstacle } from '../src/encounters.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

const meshCount = (root) => {
  let count = 0;
  root.traverse((item) => {
    if (item.isMesh) count++;
  });
  return count;
};

test('orbital cargo ships, satellites and wrecks gain readable details without losing collision solids', () => {
  const expectations = [
    [
      'carrier',
      [
        'carrier-command-windows',
        'carrier-hangar-gate',
        'carrier-engine-nozzle',
        'carrier-defense-cannon',
      ],
    ],
    ['satellite', ['satellite-array-rib', 'satellite-telemetry-ring']],
    ['debris', ['debris-broken-ship-fin', 'debris-hull-marking']],
  ];
  for (const [kind, namedParts] of expectations) {
    const object = createObstacle(kind);
    const second = createObstacle(kind);
    assert.ok(object.userData.solids.length >= (kind === 'carrier' ? 8 : 3));
    assert.ok(meshCount(object) >= (kind === 'carrier' ? 20 : 9));
    for (const name of namedParts) {
      assert.ok(object.getObjectByName(name), kind + ' missing detail ' + name);
      assert.ok(second.getObjectByName(name), kind + ' cloned instance missing ' + name);
    }
    const bounds = new T.Box3().setFromObject(object).getSize(new T.Vector3());
    assert.ok(bounds.length() > 15);
    assert.ok([bounds.x, bounds.y, bounds.z].every(Number.isFinite));
    assert.equal(second.userData.kind, kind);
  }
  const hull = createObstacle('carrier');
  const collidableEngine = hull.userData.solids.some(
    ({ center, half }) =>
      Math.abs(center.x - 13) <= half.x &&
      Math.abs(center.y - 14) <= half.y &&
      Math.abs(center.z - 18) <= half.z,
  );
  assert.equal(collidableEngine, true, 'engine nacelles must not become non-collidable blocks');
});

test('the distant fleet flagship has actual bridge, armor, lit thrusters and distinct silhouette', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  const carrier = scene.getObjectByName('distant-orbital-flagship');
  assert.ok(carrier);
  for (const name of ['flagship-command-bridge', 'flagship-dorsal-armor', 'flagship-engine-ring'])
    assert.ok(carrier.getObjectByName(name), 'missing flagship detail: ' + name);
  assert.ok(meshCount(carrier) > 35, 'large fleet craft needs a readable multi-part silhouette');
  world.reset();
  const box = new T.Box3().setFromObject(carrier);
  assert.ok(box.getSize(new T.Vector3()).length() > 90);
});
