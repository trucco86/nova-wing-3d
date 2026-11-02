import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createParticlePool } from '../src/particle-pool.js';

function fixture(maxRetained = { spark: 2, flash: 2, wave: 1 }) {
  const scene = new T.Scene();
  const sparkGeometry = new T.IcosahedronGeometry(0.3, 0);
  const haloMaterial = new T.SpriteMaterial({ color: 0xffffff });
  const pool = createParticlePool({
    scene,
    sparkGeometry,
    createHalo: () => new T.Sprite(haloMaterial),
    maxRetained,
  });
  const dispose = () => {
    pool.clear();
    sparkGeometry.dispose();
    haloMaterial.dispose();
  };
  return { scene, sparkGeometry, haloMaterial, pool, dispose };
}

test('spark reuse preserves velocity, color, scale and independent fade', () => {
  const { scene, pool, sparkGeometry, dispose } = fixture();
  try {
    const at = new T.Vector3(2, 6, -11);
    const first = pool.spark(at, 0xffa04a, 4, -3, 9, 0.7);
    assert.equal(first.kind, 'spark');
    assert.equal(first.o.geometry, sparkGeometry);
    assert.deepEqual(first.v.toArray(), [4, -3, 9]);
    first.o.material.opacity = 0.06;
    first.o.scale.setScalar(4);
    assert.equal(pool.release(first), true);
    assert.equal(pool.release(first), false);
    const second = pool.spark(new T.Vector3(-2, 1, 0), 0xbaffee, -1, 2, 3, 0.3);
    assert.equal(second, first);
    assert.equal(second.o.material.opacity, 1);
    assert.equal(second.o.scale.x, 1);
    assert.deepEqual(second.o.position.toArray(), [-2, 1, 0]);
    assert.deepEqual(second.v.toArray(), [-1, 2, 3]);
    assert.equal(
      second.o.material.color.getHex(),
      new T.Color(0xbaffee).multiplyScalar(2.2).getHex(),
    );
    assert.equal(pool.stats().created.spark, 1);
    assert.equal(pool.stats().reused.spark, 1);
    assert.equal(scene.children.length, 1);
  } finally {
    dispose();
  }
});

test('flash and shockwave reuse preserve separate materials and impact depth priority', () => {
  const { pool, scene, dispose } = fixture();
  try {
    const at = new T.Vector3();
    const impact = pool.flash(at, '#ffaa55', 13, 0.95, 0.22, false);
    const explosion = pool.flash(at, 0xffa04a, 9, 0.85, 0.45);
    assert.notEqual(impact.o.material, explosion.o.material, 'fade must stay isolated');
    assert.equal(impact.o.material.depthTest, false);
    assert.equal(impact.o.renderOrder, 100);
    assert.equal(explosion.o.material.depthTest, true);
    pool.release(impact);
    pool.release(explosion);
    const normal = pool.flash(at, '#70cfff', 3.8, 0.7, 0.14);
    assert.equal(normal.o.renderOrder, 0);
    assert.equal(normal.o.material.depthTest, true, 'no stale impact-through-wall flash');
    assert.equal(normal.o.scale.x, 3.8);
    const wave = pool.wave(at, 0xffa04a);
    const geometry = wave.o.geometry;
    wave.o.scale.setScalar(8);
    wave.o.material.opacity = 0;
    pool.release(wave);
    const reused = pool.wave(new T.Vector3(5, 0, 0), 0x59ffc8);
    assert.equal(reused, wave);
    assert.equal(reused.o.geometry, geometry);
    assert.equal(reused.o.scale.x, 1);
    assert.equal(reused.o.material.opacity, 0.9);
    assert.equal(reused.o.material.color.getHex(), 0x59ffc8);
    assert.equal(scene.children.length, 2);
  } finally {
    dispose();
  }
});

test('bounded retained particles never drop active effects and clean all scene nodes', () => {
  const { scene, pool, dispose } = fixture({ spark: 1, flash: 0, wave: 0 });
  try {
    const position = new T.Vector3();
    const spawned = Array.from({ length: 5 }, () => pool.spark(position, 0xffffff, 1, 2, 3, 0.4));
    assert.equal(pool.stats().active, 5);
    assert.equal(scene.children.length, 5);
    for (const particle of spawned) pool.release(particle);
    assert.equal(scene.children.length, 0);
    assert.equal(pool.stats().retained.spark, 1);
    const reused = pool.spark(position, 0xffffff, 0, 0, 0, 0.3);
    assert.equal(spawned.includes(reused), true);
    assert.throws(
      () => createParticlePool({ maxRetained: { spark: -1, flash: 1, wave: 1 } }),
      RangeError,
    );
    pool.clear();
    assert.equal(scene.children.length, 0);
    assert.equal(pool.stats().active, 0);
    assert.equal(pool.stats().retained.spark, 0);
    assert.equal(pool.release(reused), false);
  } finally {
    dispose();
  }
});
