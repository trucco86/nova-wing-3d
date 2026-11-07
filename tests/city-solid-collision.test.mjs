import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  CITY_SHIP_CLEARANCE,
  resolveCitySolidContact,
} from '../src/city-collision.js';
import { createCityCatastrophe } from '../src/city-catastrophe.js';
import { harness } from './harness.mjs';

function solid({
  x = 24,
  y = 14,
  z = 0,
  prevX = x,
  prevY = y,
  prevZ = z,
  hx = 8.5,
  hy = 6.1,
  hz = 21.5,
  kind = 'train',
  active = true,
} = {}) {
  return {
    active,
    solid: true,
    kind,
    center: new T.Vector3(x, y, z),
    half: new T.Vector3(hx, hy, hz),
    previousX: prevX,
    previousY: prevY,
    previousZ: prevZ,
  };
}

test('a moving maglev physically redirects a ship instead of dealing damage while clipping through', () => {
  const train = solid({ prevZ: -32, z: 0 });
  const before = new T.Vector3(24, 6, 9);
  const proposed = before.clone();
  assert.equal(resolveCitySolidContact(before, proposed, train), true);
  assert.ok(proposed.x > 36, 'ship may evade into the open right flank, beyond the old false limit');
  assert.ok(proposed.x <= 72 && proposed.x >= -72);
  assert.ok(
    proposed.x - CITY_SHIP_CLEARANCE.x > train.center.x + train.half.x,
    'final ship is outside the actual train hitbox',
  );
  assert.equal(
    resolveCitySolidContact(proposed, proposed, train),
    false,
    'post-contact position remains outside; no jitter or repeated snap',
  );
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
      assert.ok(
        !(
          Math.abs(player.x - wreck.center.x) < wreck.half.x + CITY_SHIP_CLEARANCE.x &&
          Math.abs(player.y - wreck.center.y) < wreck.half.y + CITY_SHIP_CLEARANCE.y &&
          Math.abs(player.z - wreck.center.z) < wreck.half.z + CITY_SHIP_CLEARANCE.z
        ),
        `ship penetrated solid at ${hz} Hz frame ${i}`,
      );
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
  assert.ok(
    next.x > block.center.x + block.half.x,
    'with the original 72-unit space restored, the ship may bypass the wide obstacle laterally',
  );
  const trulyFullWidth = solid({ x: 0, y: 6, z: 9, hx: 69, hy: 4, hz: 4 });
  const vertical = previous.clone();
  assert.equal(resolveCitySolidContact(previous, vertical, trulyFullWidth), true);
  assert.ok(
    vertical.y > trulyFullWidth.center.y + trulyFullWidth.half.y,
    'only actual geometry spanning the entire lane requires vertical evasion',
  );
});

test('space outside a solid stays free up to the original 72-unit flight boundary', () => {
  const wreck = solid({ x: 11, y: 6, z: -40, hx: 3, hy: 4, hz: 3 });
  for (const x of [-72, -58, -48, -37, 37, 48, 58, 72]) {
    const from = new T.Vector3(x, 6, 9);
    const desired = from.clone();
    assert.equal(resolveCitySolidContact(from, desired, wreck), false);
    assert.equal(desired.x, x, 'empty corridors must have no invisible collision limit');
  }
  const side = new T.Vector3(-65, 6, 9);
  const next = new T.Vector3(65, 6, 9);
  assert.equal(resolveCitySolidContact(side, next, wreck), false,
    'passing an actual object on a different depth plane remains free');
});

test('all four authored fallen props have real colliders, no pre-impact invisible volume', () => {
  const city = createCityCatastrophe();
  assert.equal(city.colliders().length, 0);
  const touchedKinds = new Set();
  for (let i = 0; i < 1250; i++) {
    city.update(1 / 60, i / 60, 48, true);
    for (const c of city.colliders()) {
      touchedKinds.add(c.kind);
      assert.ok(
        c.solid &&
          c.half.x > 0 &&
          c.half.y > 0 &&
          Number.isFinite(c.previousZ) &&
          Number.isFinite(c.previousY),
      );
    }
  }
  assert.deepEqual([...touchedKinds].sort(), ['billboard', 'car', 'facade', 'train'].sort());
});

test('stage 1 can travel freely beyond the old 36-unit invisible corridor on both sides', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  h.key('KeyD', true);
  // Reach beyond the false ±36 wall without timing it to an actual pillar.
  h.advance(2.65, 0.04);
  h.key('KeyD', false);
  let snap = h.game.snapshot();
  assert.equal(snap.sector, 1);
  assert.ok(snap.player.x > 60, 'right side must remain freely explorable');
  assert.ok(snap.player.x <= 72.001, 'original 72-unit flight boundary remains');
  assert.equal(snap.cityImpactCount, 0, 'empty air has no collision/damage');
  h.key('KeyA', true);
  h.advance(6.8, 0.04);
  h.key('KeyA', false);
  snap = h.game.snapshot();
  assert.ok(snap.player.x < -60, 'left side must also remain freely explorable');
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
