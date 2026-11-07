import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCityLocalSolids } from '../src/city-local-solids.js';
import { resolveCitySolidContact } from '../src/city-collision.js';

function tile(name = 'launch-city') {
  const root = new T.Group();
  root.name = name;
  root.visible = true;
  const high = new T.Group();
  high.name = 'city-high-details';
  high.visible = false;
  root.add(high);
  const life = new T.Group();
  life.name = 'city-urban-life';
  const east = new T.Group();
  east.userData.role = 'maglev';
  east.userData.side = 1;
  east.position.set(80, 36, -140);
  const west = new T.Group();
  west.userData.role = 'maglev';
  west.userData.highOnly = true;
  west.userData.side = -1;
  west.position.set(-80, 36, -320);
  west.visible = false;
  life.add(east, west);
  root.add(life);
  return { root, high, east, west };
}

test('the whole pilot volume beyond ±36 is free when there is no object at flight height', () => {
  const { root } = tile();
  const city = createCityLocalSolids([root]);
  city.update(true);
  for (const lane of [-72, -58, -47, -36, 36, 47, 58, 72]) {
    const from = new T.Vector3(lane, 6, 9);
    const desired = from.clone();
    for (const hazard of city.colliders()) {
      assert.equal(resolveCitySolidContact(from, desired, hazard), false,
        `false invisible wall at x=${lane} from ${hazard.kind}`);
    }
    assert.equal(desired.x, lane);
  }
});

test('street-level collision follows the narrow visible guardrail only, not an infinite-height wall', () => {
  const { root } = tile();
  root.position.z = 950; // the real looping rail spans the pilot's z depth
  const city = createCityLocalSolids([root]);
  city.update(true);
  const rail = city.colliders().find((s) => s.kind === 'avenue-rail' && s.center.x > 0);
  assert.ok(rail);
  assert.ok(rail.center.y < -2, 'visible curb is low in the scene');
  const start = new T.Vector3(39, -1, 9);
  const low = new T.Vector3(60, -1, 9);
  assert.equal(resolveCitySolidContact(start, low, rail), true);
  assert.ok(low.x < 46, 'low flight gets stopped by physical rail only');
  const above = new T.Vector3(60, 6, 9);
  assert.equal(resolveCitySolidContact(new T.Vector3(39, 6, 9), above, rail), false);
  assert.equal(above.x, 60, 'flying over the physical rail is permitted');
});

test('overpass pillars are local objects active only when their real geometry is visible in High', () => {
  const { root, high } = tile();
  root.position.z = 169; // first pillar directly crosses the player depth z=9
  const city = createCityLocalSolids([root]);
  city.update(true);
  assert.equal(city.colliders().filter((c) => c.kind === 'overpass-pillar').length, 0);
  high.visible = true;
  city.update(true);
  const pillar = city.colliders().find((c) => c.kind === 'overpass-pillar' && c.center.x > 0);
  assert.ok(pillar);
  assert.ok(Math.abs(pillar.center.z - 9) < 16);
  const before = new T.Vector3(59, 6, 9);
  const proposed = new T.Vector3(72, 6, 9);
  assert.equal(resolveCitySolidContact(before, proposed, pillar), true);
  assert.ok(proposed.x < 68, 'ship avoids the real column, not the entire lane');
  const far = new T.Vector3(72, 6, 100);
  assert.equal(resolveCitySolidContact(new T.Vector3(59, 6, 100), far, pillar), false);
  assert.equal(far.x, 72);
});

test('moving maglev collision follows the rendered carriage and ignores hidden trains', () => {
  const { root, east, west } = tile();
  root.position.z = 150;
  const city = createCityLocalSolids([root]);
  city.update(true);
  assert.equal(city.colliders().filter((c) => c.kind === 'maglev-train').length, 1);
  let maglev = city.colliders().find((c) => c.kind === 'maglev-train');
  assert.equal(maglev.center.z, 10);
  let before = new T.Vector3(72, 36, 9);
  let proposed = before.clone();
  assert.equal(resolveCitySolidContact(before, proposed, maglev), true);
  assert.ok(proposed.x < 72);
  east.position.z += 32;
  city.update(true);
  maglev = city.colliders().find((c) => c.kind === 'maglev-train');
  assert.equal(maglev.center.z, 42);
  assert.equal(maglev.previousZ, 10);
  before = new T.Vector3(60, 6, 9);
  proposed = new T.Vector3(72, 6, 9);
  assert.equal(resolveCitySolidContact(before, proposed, maglev), false,
    'piloting below the elevated train is permitted');
  west.visible = true;
  west.position.z = -142;
  city.update(true);
  assert.equal(city.colliders().filter((c) => c.kind === 'maglev-train').length, 2);
});

test('tile and train wrap do not create phantom swept collisions through the stage', () => {
  const { root, east } = tile();
  const city = createCityLocalSolids([root]);
  root.position.z = 1800;
  city.update(true);
  root.position.z = 0;
  east.position.z = -250;
  city.update(true);
  const snapshot = city.snapshot();
  for (const solid of city.colliders()) {
    if (solid.kind !== 'maglev-train') continue;
    assert.equal(solid.previousZ, solid.center.z);
  }
  assert.ok(snapshot.every((solid) => Number.isFinite(solid.z)));
  city.update(false);
  assert.equal(city.colliders().length, 0);
  city.reset();
  assert.equal(city.colliders().length, 0);
});
