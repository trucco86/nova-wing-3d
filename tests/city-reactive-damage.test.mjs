import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCityReactiveDamage, CITY_DAMAGE_SITES } from '../src/city-reactive-damage.js';
import { resolveCitySolidContact } from '../src/city-collision.js';

test('two authored facades visibly receive projectiles only at their local hitboxes', () => {
  const city = createCityReactiveDamage();
  city.update(0.05, 0.05, 48, true);
  assert.equal(city.snapshot().length, 2);
  const first = city.snapshot()[0];
  assert.ok(first.active);
  assert.equal(first.hp, CITY_DAMAGE_SITES[0].hp);
  assert.equal(city.strike(
    new T.Vector3(0, first.y, first.z + 18),
    new T.Vector3(0, first.y, first.z - 18), 2, 0.1,
  ), null, 'empty roadway and remote facade must remain untouched');
  assert.equal(city.snapshot()[0].hp, CITY_DAMAGE_SITES[0].hp);
  const hit = city.strike(
    new T.Vector3(first.x, first.y, first.z + 18),
    new T.Vector3(first.x, first.y, first.z - 18), 2, 0.1,
  );
  assert.equal(hit.kind, 'bay-0');
  assert.equal(hit.destroyed, false);
  assert.equal(hit.hp, CITY_DAMAGE_SITES[0].hp - 2);
  assert.equal(city.snapshot()[0].hits, 1);
});

test('repeated rounds cause staged fractured glass, exposed systems, then grounded collapse', () => {
  const city = createCityReactiveDamage();
  city.update(0.016, 0.016, 48, true);
  const point = city.snapshot()[0];
  const from = new T.Vector3(point.x, point.y, point.z + 20);
  const to = new T.Vector3(point.x, point.y, point.z - 20);
  for (let i = 0; i < 3; i++) {
    const hit = city.strike(from, to, 2, i * 0.1 + 0.1);
    assert.equal(hit.destroyed, false);
  }
  const beforeCollapse = city.snapshot()[0];
  assert.equal(beforeCollapse.hp, 2);
  assert.equal(beforeCollapse.cracks, true);
  assert.equal(beforeCollapse.exposed, true);
  const destroyed = city.strike(from, to, 2, 0.55);
  assert.equal(destroyed.destroyed, true);
  assert.equal(destroyed.hp, 0);
  assert.equal(city.snapshot()[0].destroyed, true);
  assert.equal(city.strike(from, to, 10, 0.57), null, 'destroyed facade cannot farm more hits');
  let minClearance = Infinity;
  let last;
  for (let i = 0; i < 130; i++) {
    const elapsed = 0.55 + i / 60;
    city.update(1 / 60, elapsed, 48, true);
    last = city.snapshot()[0];
    minClearance = Math.min(minClearance, last.groundClearance);
    assert.ok(last.groundClearance >= -0.001, 'falling rotated facade cannot enter the pavement');
  }
  assert.ok(minClearance >= -0.001);
  assert.ok(last.y < point.y);
  assert.equal(last.destroyed, true);
});

test('each standing or collapsed bay has a local collision volume, never the full avenue', () => {
  const city = createCityReactiveDamage();
  city.update(0.016, 0.016, 0, true);
  assert.equal(city.colliders().length, 2);
  const bay = city.colliders()[0];
  assert.ok(bay.active && bay.solid);
  const open = new T.Vector3(60, 6, 9);
  assert.equal(resolveCitySolidContact(open, open.clone(), bay), false,
    'no invisible boundary around the urban stage');
  const front = new T.Vector3(bay.center.x, bay.center.y, bay.center.z + 22);
  const inStructure = new T.Vector3(bay.center.x, bay.center.y, bay.center.z);
  assert.equal(resolveCitySolidContact(front, inStructure, bay), true);
  assert.ok(
    Math.abs(inStructure.x - bay.center.x) >= bay.half.x + 5.4 ||
      Math.abs(inStructure.y - bay.center.y) >= bay.half.y + 2.3,
    'ship is actually displaced outside rendered structure',
  );
  city.update(0.016, 0.032, 2000, false);
  assert.equal(city.colliders().length, 0);
  city.reset();
  assert.equal(city.colliders().length, 0);
  assert.equal(city.snapshot()[0].hits, 0);
});

test('consecutive strikes and visual damage never allocate a new child mesh per frame', () => {
  const city = createCityReactiveDamage();
  const total = [];
  city.root.traverse(() => { total.push(true); });
  for (let i = 0; i < 90; i++) city.update(1 / 60, i / 60, 48, true);
  const second = [];
  city.root.traverse(() => { second.push(true); });
  assert.equal(second.length, total.length);
});
