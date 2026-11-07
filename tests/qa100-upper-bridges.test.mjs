import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCityUpperBridges } from '../src/city-upper-bridges.js';
import { createCityLocalSolids } from '../src/city-local-solids.js';
import { resolveCitySolidContact, CITY_SHIP_CLEARANCE } from '../src/city-collision.js';

function fixture(offset = 294) {
  const tile = new T.Group();
  tile.name = 'launch-city';
  tile.position.z = offset;
  const architecture = createCityUpperBridges();
  tile.add(architecture);
  const physical = createCityLocalSolids([tile]);
  physical.update();
  return { tile, architecture, physical };
}

test('three distinct premium skyline decks have 12 visible preallocated solid structures', () => {
  const { architecture, physical } = fixture();
  const steel = architecture.getObjectByName('city-upper-skybridge-solids');
  assert.equal(steel.count, 12);
  assert.equal(steel.userData.solidInstances.length, 12);
  assert.equal(architecture.children.length, 3, 'one structural and two decorative instanced draw calls');
  const decks = physical.snapshot().filter((s) => s.kind === 'upper-bridge-deck');
  assert.deepEqual(decks.map((s) => s.y), [92, 123, 151]);
  assert.deepEqual(decks.map((s) => s.z), [9, -311, -711]);
  const first = physical.colliders().find((s) => s.kind === 'upper-bridge-deck');
  assert.ok(first && first.solid);
  assert.equal(first.center.z, 9);
  assert.equal(first.half.x, 63);
  assert.equal(first.half.y, 2.1);
  assert.equal(first.half.z, 6);
});

test('climbing into a skybridge stops at the actual lower face without sideways teleport', () => {
  const { physical } = fixture();
  const deck = physical.colliders().find((s) => s.kind === 'upper-bridge-deck');
  const from = new T.Vector3(0, 78, 9);
  const next = new T.Vector3(0, 106, 9);
  assert.equal(
    resolveCitySolidContact(from, next, deck, { maxY: 184 }),
    true,
    'swept climb must hit the real displayed deck',
  );
  assert.equal(next.x, 0, 'wide bridge impacts must not teleport the pilot to the opposite flank');
  assert.ok(
    next.y + CITY_SHIP_CLEARANCE.y < deck.center.y - deck.half.y,
    'pilot is outside the physical underside of the deck',
  );

  const above = new T.Vector3(0, 113, 9);
  const high = above.clone();
  assert.equal(resolveCitySolidContact(above, high, deck, { maxY: 184 }), false);
  const outsideFlank = new T.Vector3(72, 78, 9);
  const clear = new T.Vector3(72, 106, 9);
  assert.equal(resolveCitySolidContact(outsideFlank, clear, deck, { maxY: 184 }), false);
  assert.equal(clear.y, 106, 'pilot can fly vertically around the real narrow edge');
});

test('second and third reachable skyline bridges block only at their actual depth', () => {
  for (const [z, y] of [[614, 123], [1014, 151]]) {
    const { physical } = fixture(z);
    const deck = physical.colliders().find((s) =>
      s.kind === 'upper-bridge-deck' && s.center.z === 9);
    assert.ok(deck && deck.center.y === y);
    const from = new T.Vector3(0, y - 18, 9);
    const desired = new T.Vector3(0, y + 17, 9);
    assert.equal(resolveCitySolidContact(from, desired, deck, { maxY: 184 }), true);
    assert.ok(desired.y < y);
    const far = new T.Vector3(0, y, 45);
    assert.equal(resolveCitySolidContact(far, far, deck, { maxY: 184 }), false);
  }
});

test('hidden or wrapped bridges never leave phantom colliders or teleporting collision sweeps', () => {
  const { tile, architecture, physical } = fixture();
  let deck = physical.colliders().find((s) => s.kind === 'upper-bridge-deck');
  assert.ok(deck);
  const initialZ = deck.center.z;
  tile.position.z += 14;
  physical.update();
  deck = physical.colliders().find((s) => s.kind === 'upper-bridge-deck');
  assert.equal(deck.previousZ, initialZ);
  assert.equal(deck.center.z, initialZ + 14);
  architecture.visible = false;
  physical.update();
  assert.equal(physical.colliders().filter((s) => s.kind.startsWith('upper-bridge-')).length, 0);
  architecture.visible = true;
  tile.scale.setScalar(0.6);
  physical.update();
  deck = physical.colliders().find((s) => s.kind === 'upper-bridge-deck');
  assert.ok(deck && Math.abs(deck.half.x - 37.8) < 0.001);
  tile.position.z += 2500;
  physical.update();
  assert.equal(physical.colliders().filter((s) => s.kind.startsWith('upper-bridge-')).length, 0);
  physical.reset();
  assert.equal(physical.colliders().length, 0);
});
