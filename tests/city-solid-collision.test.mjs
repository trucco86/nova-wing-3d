import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  CITY_ROAD_LIMIT, CITY_SHIP_CLEARANCE,
  keepInsideCityRoad, resolveCitySolidContact,
} from '../src/city-collision.js';
import { createCityCatastrophe } from '../src/city-catastrophe.js';
import { harness } from './harness.mjs';

function solid({
  x = 24, y = 14, z = 0,
  prevX = x, prevY = y, prevZ = z,
  hx = 8.5, hy = 6.1, hz = 21.5,
  kind = 'train', active = true,
} = {}) {
  return {
    active, solid: true, kind,
    center: new T.Vector3(x, y, z),
    half: new T.Vector3(hx, hy, hz),
    previousX: prevX, previousY: prevY, previousZ: prevZ,
  };
}

test('a moving maglev physically redirects a ship instead of dealing damage while clipping through', () => {
  const train = solid({ prevZ: -32, z: 0 });
  const before = new T.Vector3(24, 6, 9);
  const proposed = before.clone();
  assert.equal(resolveCitySolidContact(before, proposed, train), true);
  assert.ok(proposed.x < 15, 'right edge cannot be used, so escape via open center-left lane');
  assert.ok(proposed.x <= CITY_ROAD_LIMIT && proposed.x >= -CITY_ROAD_LIMIT);
  assert.ok(proposed.x + CITY_SHIP_CLEARANCE.x < train.center.x - train.half.x,
    'final ship is outside the actual train hitbox');
  assert.equal(resolveCitySolidContact(proposed, proposed, train), false,
    'post-contact position remains outside; no jitter or repeated snap');
});

test('60/30/120 Hz sweeps keep the ship out of an approaching wide city obstacle', () => {
  for (const hz of [30, 60, 120]) {
    const wreck = solid({ x: 0, y: 6, z: -30, prevZ: -30, hx: 11, hy: 5, hz: 4 });
    let player = new T.Vector3(-4, 6, 9);
    let deflections = 0;
    for (let i = 0; i < hz * 2; i++) {
      wreck.previousZ = wreck.center.z;
      wreck.center.z += 48 / hz;
      const next = player.clone();
      if (resolveCitySolidContact(player, next, wreck)) deflections++;
      player = next;
      assert.ok(!(
        Math.abs(player.x - wreck.center.x) < wreck.half.x + CITY_SHIP_CLEARANCE.x &&
        Math.abs(player.y - wreck.center.y) < wreck.half.y + CITY_SHIP_CLEARANCE.y &&
        Math.abs(player.z - wreck.center.z) < wreck.half.z + CITY_SHIP_CLEARANCE.z
      ), `ship penetrated solid at ${hz} Hz frame ${i}`);
    }
    assert.ok(deflections >= 1, `solid collision resolved at ${hz} Hz`);
  }
});

test('high-speed dash cannot tunnel across a thin billboard', () => {
  const billboard = solid({ x: 0, y: 6, z: 9, hx: 0.5, hy: 6, hz: 3, kind: 'billboard' });
  const previous = new T.Vector3(-19, 6, 9);
  const afterDash = new T.Vector3(19, 6, 9);
  assert.equal(resolveCitySolidContact(previous, afterDash, billboard), true);
  assert.ok(afterDash.x < -CITY_SHIP_CLEARANCE.x, 'the ship stays on its entry flank');
});

test('a ship can freely exit overlap and evade vertically without sticky damage', () => {
  const block = solid({ x: 0, y: 6, z: 9, hx: 32, hy: 4, hz: 4 });
  const previous = new T.Vector3(0, 6, 9);
  const escaping = new T.Vector3(0, 25, 9);
  assert.equal(resolveCitySolidContact(previous, escaping, block), false);
  const next = new T.Vector3(0, 6, 9);
  assert.equal(resolveCitySolidContact(previous, next, block), true);
  assert.ok(next.y > block.center.y + block.half.y,
    'when neither flank fits, the ship must evade above the solid');
});

test('a visible road rail stops the wing before it clips into the side wall', () => {
  const pos = new T.Vector3(59, 6, 9);
  assert.equal(keepInsideCityRoad(pos), true);
  assert.equal(pos.x, CITY_ROAD_LIMIT);
  assert.equal(keepInsideCityRoad(pos), false);
  pos.x = -77;
  assert.equal(keepInsideCityRoad(pos), true);
  assert.equal(pos.x, -CITY_ROAD_LIMIT);
});

test('all four authored fallen props have real colliders, no pre-impact invisible volume', () => {
  const city = createCityCatastrophe();
  assert.equal(city.colliders().length, 0);
  const touchedKinds = new Set();
  for (let i = 0; i < 1250; i++) {
    city.update(1 / 60, i / 60, 48, true);
    for (const c of city.colliders()) {
      touchedKinds.add(c.kind);
      assert.ok(c.solid && c.half.x > 0 && c.half.y > 0 &&
        Number.isFinite(c.previousZ) && Number.isFinite(c.previousY));
    }
  }
  assert.deepEqual([...touchedKinds].sort(), ['billboard', 'car', 'facade', 'train'].sort());
});

test('stage 1 physically prevents ship from flying through roadside rail with damage feedback', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  h.key('KeyD', true);
  h.advance(2.8, 0.04);
  h.key('KeyD', false);
  const snap = h.game.snapshot();
  assert.equal(snap.sector, 1);
  assert.ok(snap.player.x <= CITY_ROAD_LIMIT + 0.01);
  assert.ok(snap.cityImpactCount > 0, 'rail physically blocked and registered impact');
});

test('Mars flight retains the 72-unit arena; only stage 1 has solid city guardrails', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false, hostname: 'localhost' });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(1, 'stage'), true);
  h.key('KeyD');
  h.key('KeyW');
  h.advance(4, 0.04);
  h.key('KeyD', false);
  h.key('KeyW', false);
  const snap = h.game.snapshot();
  assert.equal(snap.sector, 2);
  assert.equal(snap.player.x, 72, 'do not narrow piloting outside the city');
});
