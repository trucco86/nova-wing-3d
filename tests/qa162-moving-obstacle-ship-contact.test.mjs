import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { createObstacle, openEuropaTunnelBreach } from '../src/encounters.js';
import { createObstacleShipResolver } from '../src/obstacle-ship-contact.js';

const resolve = createObstacleShipResolver();
function barrier() {
  const o = {
    position: new Vector3(0, 0, 0),
    userData: {
      solids: [{ center: new Vector3(0, 18, 0), half: new Vector3(80, 120, 1) }],
    },
  };
  return o;
}
test('QA162: high speed flight cannot tunnel through a full-width barrier from either Z side', () => {
  for (const [beforeZ, afterZ, sign] of [
    [-35, 35, -1],
    [35, -35, 1],
  ]) {
    const wall = barrier();
    const before = new Vector3(0, 6, beforeZ);
    const next = new Vector3(0, 6, afterZ);
    assert.equal(resolve(before, next, wall), true);
    assert.ok(sign * next.z > 1 + 1.3, 'ship remains on the original approach side');
    assert.equal(next.x, 0);
    assert.equal(next.y, 6);
    assert.equal(resolve(next, next, wall), false, 'no sticky repeated collision');
  }
});

test('QA162: a moving wall uses its previous Z to resolve swept impact with the ship', () => {
  const wall = barrier();
  wall.position.z = 18;
  const before = new Vector3(0, 6, -35);
  const next = new Vector3(0, 6, 28);
  assert.equal(resolve(before, next, wall, 30), true);
  assert.ok(next.z < wall.position.z - 2.3);
});

test('QA162: authored tunnel walls block and push the ship toward its original side', () => {
  const tunnel = createObstacle('tunnel');
  const before = new Vector3(27, 12, -45);
  const next = new Vector3(39, 12, -45);
  assert.equal(resolve(before, next, tunnel), true);
  assert.ok(next.x < 32, 'right-wall collision deflects back into playable tunnel');
  assert.equal(next.z, -45);
  assert.equal(resolve(next, next, tunnel), false, 'ship stays outside actual wall solids');
});

test('QA162: tunnel ceiling keeps the pilot inside its corridor rather than teleporting sideways', () => {
  const tunnel = createObstacle('tunnel');
  const before = new Vector3(0, 33, -45);
  const next = new Vector3(0, 43, -45);
  assert.equal(resolve(before, next, tunnel), true);
  assert.equal(next.x, 0, 'deck collision must not eject the ship through side walls');
  assert.ok(next.y < 36 && next.y >= -1, 'ship remains below the visible roof');
});

test('QA162: tunnel corridor and hidden Europa breach remain physically traversable', () => {
  const tunnel = createObstacle('tunnel', 'europa');
  const before = new Vector3(0, 12, -55);
  const next = new Vector3(0, 12, -65);
  assert.equal(resolve(before, next, tunnel), false, 'central corridor is open');
  const blockedFrom = new Vector3(34, 15, -230);
  const blockedTo = new Vector3(34, 15, -215);
  assert.equal(resolve(blockedFrom, blockedTo.clone(), tunnel), true, 'panel blocks before breach');
  assert.equal(openEuropaTunnelBreach(tunnel), true);
  assert.equal(resolve(blockedFrom, blockedTo.clone(), tunnel), false, 'breach panel removed');
});

test('QA162: decorative obstacles and leaving a collider do not create ghost hitboxes', () => {
  const empty = { position: new Vector3(), userData: { solids: [] } };
  const before = new Vector3(0, 6, -35);
  const next = new Vector3(0, 6, 35);
  assert.equal(resolve(before, next, empty), false);
  assert.equal(next.z, 35);
  const wall = barrier();
  const exiting = new Vector3(0, 6, 0);
  const outside = new Vector3(0, 6, 32);
  assert.equal(resolve(exiting, outside, wall), false);
  assert.equal(outside.z, 32);
});

test('QA162: the running loop uses physical resolution only in 3D mode', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
  assert.ok(source.includes('const resolveObstacleShipContact = createObstacleShipResolver();'));
  const flightContact = source.slice(source.indexOf('let collidedWithObstacle;'));
  assert.ok(flightContact.includes('if (dynamicFlight) {'));
  assert.ok(flightContact.includes('resolveObstacleShipContact('));
  const collisionDamage = "if (collidedWithObstacle) hit(30, 'obstacle-collision');";
  assert.ok(flightContact.includes(collisionDamage));
});
