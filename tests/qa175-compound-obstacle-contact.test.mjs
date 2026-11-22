import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { createObstacle, openEuropaTunnelBreach } from '../src/encounters.js';
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

function outsideSolids(ship, obstacle, radius = 1.3) {
  return obstacle.userData.solids.every((volume) => {
    const center = obstacle.position.clone().add(volume.center);
    return (
      Math.abs(ship.x - center.x) >= volume.half.x + radius ||
      Math.abs(ship.y - center.y) >= volume.half.y + radius ||
      Math.abs(ship.z - center.z) >= volume.half.z + radius
    );
  });
}

test('QA175: Europa breach panel blocks the ship until it is physically destroyed', () => {
  const tunnel = createObstacle('tunnel', 'europa');
  const resolve = createObstacleShipResolver();
  const start = new Vector3(27, 15, -220);
  const blocked = new Vector3(39, 15, -220);
  assert.equal(
    tunnel.userData.solids.some((volume) => volume.breachPanel),
    true,
  );
  assert.equal(resolve(start, blocked, tunnel), true, 'intact panel blocks crossing');
  assert.equal(outsideSolids(blocked, tunnel), true);

  assert.equal(openEuropaTunnelBreach(tunnel), true, 'breach removes the actual collider');
  assert.equal(
    tunnel.userData.solids.some((volume) => volume.breachPanel),
    false,
  );
  const through = new Vector3(39, 15, -220);
  assert.equal(resolve(start, through, tunnel), false, 'destroyed panel has no ghost collision');
  assert.deepEqual(through.toArray(), [39, 15, -220], 'free opening does not teleport the pilot');
});

test('QA175: boosted approach to compound baffles cannot leave the ship embedded', () => {
  for (const variant of ['standard', 'europa']) {
    const tunnel = createObstacle('tunnel', variant);
    const resolve = createObstacleShipResolver();
    const previous = new Vector3(-25, 12, -95);
    const next = new Vector3(-25, 12, -119);
    assert.equal(resolve(previous, next, tunnel, 15), true, variant + ' moving baffle');
    assert.equal(outsideSolids(next, tunnel), true, variant + ' final ship position is safe');
    assert.ok(next.distanceTo(previous) < 50, variant + ' correction cannot teleport');
  }
});
