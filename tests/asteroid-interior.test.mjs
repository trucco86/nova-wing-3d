import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  constrainCavernPosition,
  crossesCavernWall,
  createAsteroidInterior,
} from '../src/asteroid-interior.js';

test('cavern walls clamp the player to the open tunnel and leave safe flying untouched', () => {
  assert.deepEqual(constrainCavernPosition({ x: 0, y: 10 }), {
    collided: false,
    x: 0,
    y: 10,
  });
  const wall = constrainCavernPosition({ x: 90, y: 10 });
  assert.equal(wall.collided, true);
  assert.equal(wall.x, 27);
  assert.equal(wall.y, 10);
  const vertical = constrainCavernPosition({ x: 0, y: 100 });
  assert.equal(vertical.collided, true);
  assert.equal(vertical.y, 37);
});

test('projectiles remain playable in the cavern opening but cannot pass through rock walls', () => {
  assert.equal(crossesCavernWall({ x: 0, y: 10, z: 0 }, { x: 0, y: 10, z: -200 }), false);
  assert.equal(crossesCavernWall({ x: 0, y: 10, z: 0 }, { x: 43, y: 10, z: -200 }), true);
  assert.equal(crossesCavernWall({ x: 43, y: 10, z: 80 }, { x: 43, y: 10, z: 70 }), false);
});

test('instanced asteroid scenery transitions approach, tunnel, boss arena and escape', () => {
  const scene = new T.Scene();
  const asteroid = createAsteroidInterior(scene);
  asteroid.reset(true);
  assert.equal(asteroid.snapshot().entranceVisible, true);
  asteroid.setPhase('transition');
  assert.equal(asteroid.snapshot().cavernVisible, true);
  assert.equal(asteroid.constrain({ x: 60, y: 10 }).collided, true);
  asteroid.update(0.05, 50);
  asteroid.setPhase('boss');
  assert.equal(asteroid.snapshot().arenaVisible, true);
  assert.equal(asteroid.snapshot().cavernVisible, false);
  assert.equal(asteroid.constrain({ x: 60, y: 10 }).collided, false);
  asteroid.setPhase('escape');
  assert.equal(asteroid.snapshot().cavernVisible, true);
  asteroid.setPhase('complete');
  assert.equal(asteroid.snapshot().cavernVisible, false);
  asteroid.destroy();
  assert.equal(scene.children.length, 0);
});
