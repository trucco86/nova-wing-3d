import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { createHostileProjectilePool } from '../src/hostile-projectile-pool.js';

test('QA163: projectile pool copies muzzle origin for every projectile in a volley', () => {
  const scene = new T.Scene();
  const geometry = new T.SphereGeometry(0.35, 8, 6);
  const normal = new T.MeshBasicMaterial({ color: '#ff706a' });
  const pool = createHostileProjectilePool({
    scene,
    geometry,
    materials: { normal, fire: normal, arcane: normal },
    createHalo: () => new T.Group(),
  });
  const sharedMuzzle = new T.Vector3(9, 16, -112);
  const targetA = new T.Vector3(-10, 22, 8);
  const targetB = new T.Vector3(14, 5, 8);
  const first = pool.acquire(sharedMuzzle, targetA);
  const second = pool.acquire(sharedMuzzle, targetB);
  assert.notEqual(first, second);
  assert.deepEqual(first.launchOrigin.toArray(), [9, 16, -112]);
  assert.deepEqual(second.launchOrigin.toArray(), [9, 16, -112]);
  assert.deepEqual(first.o.position.toArray(), [9, 16, -112]);
  assert.deepEqual(second.o.position.toArray(), [9, 16, -112]);
  assert.notDeepEqual(first.v.toArray(), second.v.toArray(), 'aim still varies by target');
  sharedMuzzle.set(100, 200, 300);
  assert.deepEqual(first.launchOrigin.toArray(), [9, 16, -112], 'shot must snapshot origin');
  assert.deepEqual(second.launchOrigin.toArray(), [9, 16, -112]);
  pool.release(first);
  pool.release(second);
  pool.clear();
  geometry.dispose();
  normal.dispose();
});

test('QA163: the gameplay loop transforms enemy emitters just once per firing event', () => {
  const source = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
  const start = source.indexOf('const introductorySubboss =');
  const end = source.indexOf('if (e.attackGlow) e.attackGlow.visible = false;', start);
  assert.ok(start > 0 && end > start, 'must inspect the actual fighter firing block');
  const volley = source.slice(start, end);
  assert.ok(volley.includes('const volleyMuzzles = hostileMuzzles(e);'));
  assert.equal(
    volley.split('hostileMuzzles(e)').length - 1,
    1,
    'one matrix update/muzzle snapshot per enemy attack, including multi-shot bursts',
  );
  assert.ok(volley.includes('for (const eye of volleyMuzzles)'));
  assert.ok(volley.includes('volleyMuzzles[Math.abs(Math.round(offset)) % 2]'));
  const subboss = source.slice(end, source.indexOf('e.cd =', end));
  assert.ok(subboss.includes('volleyMuzzles[0]'), 'pattern uses the same captured muzzle');
  assert.ok(!subboss.includes('hostileMuzzles(e)'), 'pattern must not resample world matrices');
});
