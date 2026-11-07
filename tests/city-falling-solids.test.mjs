import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCityDestructionScene, updateCityDestructionScene } from '../src/city-destruction.js';
import { createCityFallingSolids } from '../src/city-falling-solids.js';
import { createWorld } from '../src/visuals.js';
import { CITY_SHIP_CLEARANCE, resolveCitySolidContact } from '../src/city-collision.js';
import { SECTORS } from '../src/campaign.js';

test('falling scripted sign, hovercar and seven real facade shards have individually visible collision hulls', () => {
  const scene = createCityDestructionScene();
  const solids = createCityFallingSolids(scene);
  updateCityDestructionScene(scene, 0);
  assert.deepEqual(solids.update(), [], 'no invisible collider before a debris animation');

  updateCityDestructionScene(scene, 6.5);
  let active = solids.update();
  assert.deepEqual(
    active.map((c) => c.kind),
    ['falling-billboard'],
  );
  assert.ok(active.every((c) => c.solid && c.half.lengthSq() > 0));
  // No invisible facade volume when parent facade is hidden.
  assert.equal(
    active.some((c) => c.kind.startsWith('falling-facade')),
    false,
  );

  updateCityDestructionScene(scene, 9.65);
  active = solids.update();
  const sign = active.find((c) => c.kind === 'falling-billboard');
  assert.ok(sign, 'visible falling sign has a physical hull');
  const pilot = new T.Vector3(0, 6, 9);
  const resolved = pilot.clone();
  assert.equal(
    resolveCitySolidContact(pilot, resolved, sign, { laneLimit: 72 }),
    true,
    'a real central-lane crossing MUST collide and force a dodge',
  );
  assert.ok(
    Math.abs(resolved.x - sign.center.x) >= sign.half.x + CITY_SHIP_CLEARANCE.x,
    'ship finishes outside visible falling sign instead of phasing through it',
  );
  const open = new T.Vector3(60, 6, 9);
  const openFinal = open.clone();
  assert.equal(resolveCitySolidContact(open, openFinal, sign), false);
  assert.equal(openFinal.x, 60, 'no new invisible world boundary');

  updateCityDestructionScene(scene, 10.8);
  active = solids.update();
  assert.ok(active.some((c) => c.kind === 'falling-hovercar'));
  assert.ok(active.every((c) => Number.isFinite(c.previousX + c.previousY + c.previousZ)));

  updateCityDestructionScene(scene, 12.25);
  active = solids.update();
  assert.equal(
    active.filter((c) => c.kind.startsWith('falling-facade')).length,
    7,
    'each genuinely falling slab, not the entire static building, gets a hull',
  );
  updateCityDestructionScene(scene, 24);
  assert.deepEqual(solids.update(), [], 'no ghost hull after the city fades into orbit');
  solids.reset();
  assert.deepEqual(solids.colliders(), []);
});

test('falling collider dimensions and swept previous XYZ match actual mesh motion', () => {
  const scene = createCityDestructionScene();
  const solids = createCityFallingSolids(scene);
  updateCityDestructionScene(scene, 8.9);
  solids.update();
  const initial = solids.colliders().find((c) => c.kind === 'falling-billboard');
  assert.ok(initial);
  const before = initial.center.clone();
  updateCityDestructionScene(scene, 9.05);
  solids.update();
  const after = solids.colliders().find((c) => c.kind === 'falling-billboard');
  assert.equal(after.previousX, before.x);
  assert.equal(after.previousY, before.y);
  assert.equal(after.previousZ, before.z);
  assert.ok(after.center.z > after.previousZ, 'moving geometry has correct previous world Z');
  assert.ok(after.half.x > 3 && after.half.y > 3);
  assert.ok(Number.isFinite(after.center.x + after.center.y + after.center.z));
});

test('world hazard list includes cinematic falling objects in the same frame, without a global clamp', () => {
  const world = createWorld(new T.Scene(), () => 0.41, true);
  world.setSector(SECTORS[0], 0);
  world.setCityDestruction(9.5);
  assert.ok(world.cityRoadActive());
  const falling = world.cityHazards().filter((c) => c.kind.startsWith('falling-'));
  assert.ok(falling.some((c) => c.kind === 'falling-billboard'));
  const snapshots = world.cityScriptedFallingSnapshot();
  assert.equal(snapshots.length, 9);
  assert.ok(
    snapshots.every(
      ({ center, half }) => center.every(Number.isFinite) && half.every(Number.isFinite),
    ),
  );
  world.setCityDestruction(24);
  assert.equal(world.cityHazards().filter((c) => c.kind.startsWith('falling-')).length, 0);
  world.setSector(SECTORS[1], 1);
  assert.equal(world.cityHazards().filter((c) => c.kind.startsWith('falling-')).length, 0);
});

test('falling hovercar stays visible and solid at the actual pilot flight depth before leaving', () => {
  const visual = createCityDestructionScene();
  const physics = createCityFallingSolids(visual);
  const reachable = [];
  for (const time of [11.2, 11.4, 11.55, 11.7, 11.9]) {
    updateCityDestructionScene(visual, time);
    const car = physics.update().find((c) => c.kind === 'falling-hovercar');
    assert.ok(car, 'crashing car remains solid at t=' + time);
    const from = new T.Vector3(7, 6, 9);
    const after = from.clone();
    if (resolveCitySolidContact(from, after, car, { maxY: 116 })) {
      reachable.push(time);
      assert.ok(
        Math.abs(after.x - car.center.x) >= car.half.x + CITY_SHIP_CLEARANCE.x ||
        Math.abs(after.y - car.center.y) >= car.half.y + CITY_SHIP_CLEARANCE.y,
        'actual crash physically ejects the ship outside the visible vehicle',
      );
    }
  }
  assert.ok(reachable.length >= 2, 'hovercar must offer more than a one-frame collision chance');
  updateCityDestructionScene(visual, 13);
  assert.equal(physics.update().some((c) => c.kind === 'falling-hovercar'), false);
});
