import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { createObstacle } from '../src/encounters.js';
import { createObstacleShipResolver } from '../src/obstacle-ship-contact.js';

test('QA175: compound tunnel baffle cannot deflect ship into a previously checked wall', () => {
  const tunnel = createObstacle('tunnel');
  const previous = new Vector3(-25, 12, -104);
  const next = new Vector3(-25, 12, -108);
  const resolve = createObstacleShipResolver();
  assert.equal(resolve(previous, next, tunnel), true);
  for (const volume of tunnel.userData.solids) {
    const x = tunnel.position.x + volume.center.x;
    const y = tunnel.position.y + volume.center.y;
    const z = tunnel.position.z + volume.center.z;
    const embedded =
      Math.abs(next.x - x) < volume.half.x + 1.3 &&
      Math.abs(next.y - y) < volume.half.y + 1.3 &&
      Math.abs(next.z - z) < volume.half.z + 1.3;
    assert.equal(embedded, false, 'resolved position must be outside every tunnel solid');
  }
});
