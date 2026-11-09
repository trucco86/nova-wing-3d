import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { readFileSync } from 'node:fs';
import { createCityLocalSolids } from '../src/city-local-solids.js';
import { resolveCitySolidContact, CITY_SHIP_CLEARANCE } from '../src/city-collision.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';
import { harness } from './harness.mjs';

function cityTile() {
  const tile = new T.Group();
  tile.name = 'launch-city';
  const high = new T.Group();
  high.name = 'city-high-details';
  high.visible = false;
  const viaduct = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial(), 1);
  viaduct.name = 'city-elevated-crossings';
  high.add(viaduct);
  tile.add(high);
  const life = new T.Group();
  life.name = 'city-urban-life';
  const bridge = new T.Group();
  const crossing = new T.Mesh(new T.BoxGeometry(266, 3.1, 12), new T.MeshBasicMaterial());
  crossing.name = 'city32-maglev-crossing-guideway';
  crossing.position.set(0, 59, -345);
  bridge.add(crossing);
  life.add(bridge);
  tile.add(life);
  return { tile, high, life, bridge, crossing };
}

test('high-only viaduct deck is a localized real obstruction, not a full-height wall', () => {
  const { tile, high } = cityTile();
  // First authored overpass from z=-160 must cross real player depth z=9.
  tile.position.z = 169;
  const physics = createCityLocalSolids([tile]);
  physics.update();
  assert.equal(
    physics.colliders().filter((c) => c.kind === 'overpass-deck').length,
    0,
    'hidden premium bridges must not generate invisible collision',
  );
  high.visible = true;
  physics.update();
  const deck = physics.colliders().find((c) => c.kind === 'overpass-deck');
  assert.ok(deck, 'visible overpass must block');
  assert.equal(deck.center.y, 59);
  assert.equal(deck.center.z, 9);
  assert.equal(deck.half.x, 71);
  assert.equal(deck.half.y, 3);
  assert.equal(deck.half.z, 6.5);

  const below = new T.Vector3(0, 47, 9);
  const passThrough = new T.Vector3(0, 69, 9);
  assert.equal(
    resolveCitySolidContact(below, passThrough, deck, { maxY: 184 }),
    true,
    'ascending through the actual deck must collide',
  );
  assert.ok(
    passThrough.y + CITY_SHIP_CLEARANCE.y < deck.center.y - deck.half.y,
    'pilot stays below deck rather than teleporting through',
  );
  const clearAbove = new T.Vector3(0, 90, 9);
  const clearAfter = clearAbove.clone();
  assert.equal(resolveCitySolidContact(clearAbove, clearAfter, deck, { maxY: 184 }), false);
  assert.equal(clearAfter.y, 90);
  const clearBelow = new T.Vector3(0, 20, 9);
  assert.equal(
    resolveCitySolidContact(clearBelow, clearBelow, deck, { maxY: 184 }),
    false,
    'flying under the viaduct is allowed',
  );
  const farSide = new T.Vector3(70, 10, 9);
  assert.equal(resolveCitySolidContact(farSide, farSide, deck, { maxY: 184 }), false);
});

test('transverse maglev guideway physically blocks its real Medium-quality deck', () => {
  const { tile, life } = cityTile();
  tile.position.z = 354;
  const physics = createCityLocalSolids([tile]);
  physics.update();
  const crossing = physics.colliders().find((c) => c.kind === 'cross-city-guideway');
  assert.ok(crossing, 'the visible Medium-quality transversal guideway needs a collider');
  assert.equal(crossing.center.z, 9);
  assert.equal(crossing.half.x, 133);
  assert.equal(crossing.half.y, 1.55);
  const previous = new T.Vector3(0, 48, 9);
  const next = new T.Vector3(0, 70, 9);
  assert.equal(resolveCitySolidContact(previous, next, crossing, { maxY: 184 }), true);
  assert.ok(next.y < 58, 'the deck cannot be crossed vertically');
  const high = new T.Vector3(0, 88, 9);
  assert.equal(resolveCitySolidContact(high, high, crossing, { maxY: 184 }), false);
  life.visible = false;
  physics.update();
  assert.equal(
    physics.colliders().filter((c) => c.kind === 'cross-city-guideway').length,
    0,
    'hidden bridge parent cannot leave a ghost collider',
  );
});

test('moving/cycling city tile moves only corresponding visible bridge colliders', () => {
  const { tile, high } = cityTile();
  tile.position.z = 169;
  high.visible = true;
  const physics = createCityLocalSolids([tile]);
  physics.update();
  const deck = physics.colliders().find((c) => c.kind === 'overpass-deck');
  assert.ok(deck);
  const initialZ = deck.center.z;
  tile.position.z += 12;
  physics.update();
  assert.equal(deck.previousZ, initialZ);
  assert.equal(deck.center.z, initialZ + 12);
  tile.scale.setScalar(0.72);
  physics.update();
  assert.ok(
    Math.abs(deck.half.x - 71 * 0.72) < 0.01,
    'collider shrinks with visible city on ascent',
  );
  assert.ok(Math.abs(deck.center.y - 59 * 0.72) < 0.01);
  tile.position.z += 1900;
  physics.update();
  assert.ok(
    physics.colliders().every((c) => c.kind !== 'overpass-deck' || c.previousZ === c.center.z),
    'wrapped invisible city geometry cannot sweep across the player',
  );
});

test('old city demolition remains physically active until visible city actually disappears', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.43, true);
  world.setSector(SECTORS[0], 0);
  world.setLaunchAscent(0.36, true);
  assert.equal(scene.getObjectByName('launch-city').visible, true);
  assert.equal(
    world.cityRoadActive(),
    true,
    'visual city still on screen despite receding beyond previous y=-35 threshold',
  );
  world.setLaunchAscent(0.81, true);
  assert.equal(scene.getObjectByName('launch-city').visible, false);
  assert.equal(world.cityRoadActive(), false);
});

test('the directional control climbs the full stage-one skyline with tracking camera', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  h.key('KeyW', true);
  h.advance(7.5, 0.05);
  h.key('KeyW', false);
  const before = h.game.snapshot();
  assert.equal(before.flightBounds.maxY, 184);
  assert.ok(before.player.y > 90, 'pilot may fly well above the former y=46 ceiling');
  assert.ok(before.player.y <= 184);
  assert.ok(
    before.camera.y > 64,
    'camera moves upward with pilot rather than leaving ship offscreen',
  );
  h.advance(0.5, 0.05);
  assert.ok(
    Math.abs(h.game.snapshot().player.y - before.player.y) < 0.15,
    'letting go holds altitude',
  );
  h.key('KeyW', true);
  h.advance(12, 0.05);
  h.key('KeyW', false);
  assert.equal(h.game.snapshot().player.y, 184, 'only the expanded stage safety bound remains');
});

test('other 3D stages expand vertical piloting too, without changing lateral space', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false, hostname: 'localhost' });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(1, 'stage'), true);
  h.key('KeyW', true);
  h.advance(6, 0.05);
  h.key('KeyW', false);
  const state = h.game.snapshot();
  assert.equal(state.flightBounds.maxY, 96);
  assert.ok(state.player.y > 50);
  assert.ok(state.player.y <= 96);
  assert.equal(state.flightBounds.horizontal, 72);
  assert.ok(state.camera.y > 30);
});

test('BLINDADO marker is less intrusive without reducing actual vulnerable cue contrast', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const armored = css.match(/\.weak-point-tag\[data-state='armored'\]\s*\{([^}]+)\}/)?.[1];
  assert.ok(armored);
  assert.match(armored, /padding:\s*2px 4px;/);
  assert.match(armored, /font:\s*700 9px/);
  assert.match(armored, /background:\s*rgb\(17 27 37 \/ 46%\)/);
  assert.match(armored, /opacity:\s*0\.8/);
  assert.match(css, /\.weak-point-tag\s*\{[^}]*font:\s*800 11px/s);
});
