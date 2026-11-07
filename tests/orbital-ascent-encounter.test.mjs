import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createOrbitalAscentEncounter } from '../src/orbital-ascent-encounter.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

function generator(seed = 27) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test('ascent debris uses bounded independently randomized trajectories and preallocated meshes', () => {
  const scene = new T.Scene();
  const effect = createOrbitalAscentEncounter(scene, generator());
  const count = effect.root.children.length;
  assert.equal(count, 24);
  const positions = new Set();
  const types = new Set();
  let seen = 0;
  let near = 0;
  for (let index = 0; index <= 800; index++) {
    const p = index / 1000;
    const state = effect.update(p, 40 + index * 0.045);
    seen += state.active;
    near += state.near;
    assert.equal(effect.root.children.length, count, 'no allocation of new scene meshes on a frame');
    for (const part of effect.snapshot().fragments) {
      positions.add(Math.round(part.x) + ':' + Math.round(part.y) + ':' + Math.round(part.z));
      types.add(part.kind);
      assert.ok(Number.isFinite(part.scale) && part.scale > 0);
    }
  }
  assert.ok(seen > 50, 'scattered pieces cross the scene at distinct times');
  assert.ok(near > 0, 'at least some debris passes visibly in the near foreground');
  assert.ok(positions.size > 100, 'independent trajectories, not a static triangular pattern');
  assert.equal(types.size, 3, 'sheet metal, jagged pieces and ceramic fragments');
  effect.setQuality('medium');
  assert.ok(effect.update(0.5, 50).active <= 14);
  effect.reset();
  assert.equal(effect.root.children.length, count);
  assert.ok(effect.root.children.every((mesh) => !mesh.visible));
});

test('ISS briefly crosses the Earth limb after reveal, then exits without gameplay collision', () => {
  const scene = new T.Scene();
  const effect = createOrbitalAscentEncounter(scene, generator(7));
  assert.equal(effect.station.name, 'launch-iss-orbiting-earth');
  assert.ok(effect.station.children.length > 55, 'central modules, truss and solar-panel wings');
  assert.equal(effect.update(0.89, 100).iss, false);
  const entering = effect.update(0.92, 101);
  assert.equal(entering.iss, true);
  assert.ok(effect.station.position.y < 0, "ISS flies close to Earth's visible upper limb");
  const initialX = effect.station.position.x;
  const next = effect.update(0.98, 104);
  assert.equal(next.iss, true);
  assert.ok(effect.station.position.x > initialX, 'orbital trajectory crosses the planet');
  assert.equal(effect.update(1, 108).iss, false, 'one-time appearance ends in seconds');
  assert.equal(effect.update(1, 118).iss, false, 'no continuously looping station');
  effect.reset();
  assert.equal(effect.update(0.92, 140).iss, true, 'restart permits one fresh passage');
});

test('world switches ISS and ascent debris off on Mars, preserves original orbital reveal', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, generator(99), true);
  world.setSector(SECTORS[0], 0);
  world.update(0.05, 0, 48, true, 54);
  world.setLaunchAscent(0.93, true);
  assert.equal(world.orbitalAscentSnapshot().iss, true);
  assert.equal(scene.getObjectByName('launch-earth-horizon').visible, true);
  assert.equal(scene.getObjectByName('launch-city').visible, false);
  world.update(0.05, 1, 48, true, 62);
  world.setLaunchAscent(1, true);
  assert.equal(world.orbitalAscentSnapshot().iss, false);
  world.setSector(SECTORS[1], 1);
  assert.equal(scene.getObjectByName('launch-iss-orbiting-earth').visible, false);
  assert.equal(world.orbitalAscentSnapshot().active, 0);
});
