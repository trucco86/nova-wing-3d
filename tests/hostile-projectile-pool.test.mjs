import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createHostileProjectilePool } from '../src/hostile-projectile-pool.js';

function setup(maxRetained = 2) {
  const scene = new T.Scene();
  const geometry = new T.SphereGeometry(0.35, 8, 6);
  const materials = {
    normal: new T.MeshBasicMaterial({ color: 'red' }),
    fire: new T.MeshBasicMaterial({ color: 'orange' }),
    arcane: new T.MeshBasicMaterial({ color: 'purple' }),
  };
  const haloMat = new T.SpriteMaterial({ color: 'red' });
  const pool = createHostileProjectilePool({
    scene,
    geometry,
    materials,
    createHalo: () => new T.Sprite(haloMat),
    maxRetained,
  });
  const dispose = () => {
    pool.clear();
    geometry.dispose();
    haloMat.dispose();
    for (const material of Object.values(materials)) material.dispose();
  };
  return { scene, geometry, materials, pool, dispose };
}

test('enemy bolts reuse identical meshes, light, speed and reset every spell-specific state', () => {
  const { scene, materials, pool, dispose } = setup();
  try {
    const from = new T.Vector3(2, 3, 4);
    const toward = new T.Vector3(2, 3, -100);
    const normal = pool.acquire(from, toward);
    const originalMesh = normal.o;
    const originalHalo = originalMesh.children[0];
    assert.equal(scene.children.includes(originalMesh), true);
    assert.equal(normal.o.material, materials.normal);
    assert.equal(normal.o.scale.x, 1);
    assert.equal(normal.v.length(), 58);
    assert.equal(normal.life, 6);
    normal.age = 5;
    normal.life = 0;
    normal.previousPosition.set(900, 900, 900);
    assert.equal(pool.release(normal), true);
    assert.equal(pool.release(normal), false, 'double release never duplicates a projectile');
    assert.equal(scene.children.includes(originalMesh), false);
    const fire = pool.acquire(new T.Vector3(-5, 0, -5), new T.Vector3(5, 0, -5), 'fire');
    assert.equal(fire, normal);
    assert.equal(fire.o, originalMesh);
    assert.equal(fire.o.children[0], originalHalo);
    assert.equal(fire.o.material, materials.fire);
    assert.equal(fire.o.scale.x, 1.8);
    assert.equal(fire.age, 0);
    assert.equal(fire.spell, 'fire');
    assert.equal(fire.life, 6);
    assert.deepEqual(fire.previousPosition.toArray(), [-5, 0, -5]);
    assert.equal(fire.v.length(), 58);
    pool.release(fire);
    const arcane = pool.acquire(from, toward, 'arcane');
    assert.equal(arcane.o, originalMesh);
    assert.equal(arcane.o.material, materials.arcane);
    assert.equal(arcane.v.length(), 38);
    pool.release(arcane);
    const returned = pool.acquire(from, toward);
    assert.equal(returned.o.scale.x, 1, 'normal bolt does not inherit spell scaling');
    assert.equal(returned.o.material, materials.normal);
    pool.release(returned);
    assert.deepEqual(pool.stats(), {
      created: 1,
      reused: 3,
      active: 0,
      retained: 1,
      maxRetained: 2,
    });
  } finally {
    dispose();
  }
});

test('retained pool is bounded and cleared between game instances', () => {
  const { scene, pool, dispose } = setup(2);
  try {
    const p = new T.Vector3(1, 2, 3);
    const t = new T.Vector3(0, 0, -10);
    const all = Array.from({ length: 4 }, () => pool.acquire(p, t));
    assert.equal(new Set(all.map((shot) => shot.o)).size, 4);
    assert.equal(scene.children.length, 4);
    for (const shot of all) pool.release(shot);
    assert.equal(scene.children.length, 0);
    assert.equal(pool.stats().retained, 2);
    const reused = pool.acquire(p, t);
    assert.equal(all.includes(reused), true);
    pool.clear();
    assert.equal(scene.children.length, 0);
    assert.equal(pool.stats().retained, 0);
    assert.equal(pool.stats().active, 0);
    assert.equal(pool.release(reused), false);
    assert.throws(() => createHostileProjectilePool({ maxRetained: -1 }), RangeError);
    assert.throws(() => createHostileProjectilePool({ maxRetained: 181 }), RangeError);
  } finally {
    dispose();
  }
});

test('themed boss bolt uses pooled streak and keeps original speed, spell and hit semantics', () => {
  const scene = new T.Scene();
  const geometry = new T.SphereGeometry(0.35, 8, 6);
  const materials = {
    normal: new T.MeshBasicMaterial({ color: '#ff0000' }),
    fire: new T.MeshBasicMaterial({ color: '#ff9900' }),
    arcane: new T.MeshBasicMaterial({ color: '#ff00ff' }),
  };
  const bossMaterials = [new T.MeshBasicMaterial({ color: '#33ffff' })];
  const haloMat = new T.SpriteMaterial({ color: '#ff3333' });
  const pool = createHostileProjectilePool({
    scene,
    geometry,
    materials,
    bossMaterials,
    createHalo: () => new T.Sprite(haloMat),
    maxRetained: 1,
  });
  try {
    const start = new T.Vector3(3, 5, 10);
    const target = new T.Vector3(30, 5, -100);
    const shot = pool.acquire(start, target, 'arcane', 0);
    assert.equal(shot.o.position.equals(start), true);
    assert.equal(shot.o.material, bossMaterials[0]);
    assert.equal(shot.spell, 'arcane', 'visual palette does not alter attack damage or tracking');
    assert.ok(Math.abs(shot.v.length() - 38) < 0.00001);
    assert.ok(shot.o.scale.x >= 2, 'boss projectile is larger and legible');
    assert.equal(shot.o.children[0].isSprite, true, 'original halo remains');
    const streak = shot.o.getObjectByName('hostile-projectile-streak');
    assert.ok(streak.visible && streak.material === bossMaterials[0]);
    assert.ok(shot.o.quaternion.angleTo(new T.Quaternion()) > 0);
    pool.release(shot);
    const reused = pool.acquire(start, target, 'fire');
    assert.equal(reused, shot);
    assert.equal(streak.visible, false, 'normal shots never inherit boss streaks');
    assert.equal(reused.o.scale.x, 1.8);
    assert.ok(reused.o.quaternion.angleTo(new T.Quaternion()) < 1e-6);
    assert.ok(Math.abs(reused.v.length() - 58) < 0.00001);
    pool.release(reused);
  } finally {
    pool.clear();
    geometry.dispose();
    haloMat.dispose();
    for (const m of [...Object.values(materials), ...bossMaterials]) m.dispose();
  }
});

test('physical boss muzzle tether follows the actual projectile only during launch, then vanishes', () => {
  const scene = new T.Scene();
  const geometry = new T.SphereGeometry(0.35, 8, 6);
  const materials = {
    normal: new T.MeshBasicMaterial({ color: '#ffffff' }),
    fire: new T.MeshBasicMaterial({ color: '#ff6633' }),
    arcane: new T.MeshBasicMaterial({ color: '#bb66ff' }),
  };
  const bossMaterials = [new T.MeshBasicMaterial({ color: '#66bbff' })];
  const haloMat = new T.SpriteMaterial({ color: '#ffffff' });
  const pool = createHostileProjectilePool({
    scene, geometry, materials, bossMaterials,
    createHalo: () => new T.Sprite(haloMat), maxRetained: 1,
  });
  try {
    const origin = new T.Vector3(-31, 12, -180);
    const target = new T.Vector3(20, 10, 10);
    const shot = pool.acquire(origin, target, 'arcane', 0);
    assert.ok(shot.tether && scene.children.includes(shot.tether));
    assert.equal(shot.tether.visible, false, 'no beam before the bullet leaves muzzle');
    shot.o.position.addScaledVector(shot.v, 0.1);
    shot.age = 0.1;
    pool.advanceVisual(shot);
    assert.equal(shot.tether.visible, true, 'first beat explicitly connects bullet to barrel');
    const midpoint = origin.clone().add(shot.o.position).multiplyScalar(0.5);
    assert.ok(shot.tether.position.distanceTo(midpoint) < 1e-6);
    assert.ok(Math.abs(shot.tether.scale.y - shot.o.position.distanceTo(origin)) < 1e-6);
    assert.equal(shot.tether.material, bossMaterials[0]);
    shot.age = 0.45;
    pool.advanceVisual(shot);
    assert.equal(shot.tether.visible, false, 'no permanent beams or mobile overdraw');
    pool.release(shot);
    assert.equal(scene.children.length, 0, 'pool cleanup removes burst and bullet');
    const reused = pool.acquire(origin, target, 'fire');
    assert.equal(reused, shot);
    assert.equal(reused.tether.visible, false);
    assert.equal(scene.children.length, 1, 'normal enemy shots never inherit the boss beam');
    pool.release(reused);
  } finally {
    pool.clear();
    geometry.dispose();
    haloMat.dispose();
    for (const mat of [...Object.values(materials), ...bossMaterials]) mat.dispose();
  }
});
