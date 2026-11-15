import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createReusableObstaclePool } from '../src/reusable-obstacle-pool.js';
import { createObstacle } from '../src/encounters.js';

test('recycles the same standard space mesh with its original visible children and collision parts', () => {
  const pool = createReusableObstaclePool({ create: createObstacle });
  const scene = new T.Scene();
  const debris = pool.acquire('debris');
  const geometry = debris.children[0].geometry;
  const mat = debris.children[0].material;
  const authoredPosition = debris.children[0].position.clone();
  scene.add(debris);
  assert.equal(pool.release(debris), false, 'live obstacles cannot return to the pool');
  scene.remove(debris);
  debris.position.set(99, -22, 333);
  debris.rotation.set(1.3, 0.9, 2.1);
  debris.scale.set(5, 5, 5);
  debris.children[0].visible = false;
  debris.children[0].position.x = 812;
  const solids = debris.userData.solids;
  assert.equal(pool.release(debris), true);
  assert.equal(pool.release(debris), false, 'double release is rejected');
  const second = pool.acquire('debris');
  assert.equal(second, debris, 'no extra clone was created');
  assert.equal(second.children[0].geometry, geometry);
  assert.equal(second.children[0].material, mat);
  assert.equal(second.children[0].visible, true);
  assert.ok(second.children[0].position.distanceTo(authoredPosition) < 0.00001);
  assert.equal(second.position.length(), 0);
  assert.ok(Math.abs(second.rotation.x) < 0.00001, 'reset rotation is zero, including -0');
  assert.equal(second.scale.x, 1);
  assert.equal(second.userData.solids, solids, 'physical collision solids are preserved');
  assert.equal(pool.stats().reused, 1);
  pool.clear();
});

test('retention is bounded across repeated waves, even at high enemy density', () => {
  const pool = createReusableObstaclePool({
    create: createObstacle, maxRetainedPerKind: 2, maxTotal: 3,
  });
  const debris = Array.from({ length: 9 }, () => pool.acquire('debris'));
  for (const mesh of debris) pool.release(mesh);
  assert.equal(pool.stats().retained, 2);
  assert.equal(pool.stats().rejected, 7);
  const fighters = Array.from({ length: 4 }, () => pool.acquire('satellite'));
  for (const mesh of fighters) pool.release(mesh);
  assert.equal(pool.stats().retained, 3, 'total retained does not exceed three');
  assert.equal(pool.stats().kinds['debris:standard'], 2);
  assert.equal(pool.stats().kinds['satellite:standard'], 1);
  pool.clear();
  assert.equal(pool.stats().retained, 0);
  assert.throws(() => pool.acquire('debris'), /already cleared/);
});

test('excludes scripted tunnels, reactors, boss-like fixtures and altered variants', () => {
  const pool = createReusableObstaclePool({ create: createObstacle });
  for (const [kind, variant] of [
    ['tunnel', 'europa'],
    ['tunnel', 'standard'],
    ['reactor', 'standard'],
    ['carrier', 'special'],
  ]) {
    const o = pool.acquire(kind, variant);
    assert.equal(pool.release(o), false, 'special state must never be reused');
  }
  assert.equal(pool.stats().retained, 0);
  pool.clear();
});

test('never disposes shared prototype geometry or materials', () => {
  const geo = new T.BoxGeometry(2, 2, 2);
  const material = new T.MeshStandardMaterial();
  let disposed = 0;
  geo.addEventListener('dispose', () => disposed++);
  material.addEventListener('dispose', () => disposed++);
  const create = () => {
    const group = new T.Group();
    group.add(new T.Mesh(geo, material));
    return group;
  };
  const pool = createReusableObstaclePool({ create });
  const a = pool.acquire('satellite');
  const b = pool.acquire('satellite');
  pool.release(a);
  pool.release(b);
  pool.clear();
  assert.equal(disposed, 0, 'a pool may release references, not prototype-owned WebGL resources');
  geo.dispose();
  material.dispose();
  assert.equal(disposed, 2);
});

test('config validation and stats reject bad budgets and anonymous releases', () => {
  assert.throws(() => createReusableObstaclePool({}), TypeError);
  assert.throws(
    () => createReusableObstaclePool({ create: () => new T.Group(), maxRetainedPerKind: -1 }),
    RangeError,
  );
  assert.throws(
    () => createReusableObstaclePool({ create: () => new T.Group(), maxTotal: 129 }),
    RangeError,
  );
  const pool = createReusableObstaclePool({ create: () => new T.Group(), maxTotal: 0 });
  assert.equal(pool.release(new T.Group()), false);
  const mesh = pool.acquire('debris');
  assert.equal(pool.release(mesh), false);
  assert.equal(pool.stats().retained, 0);
});
