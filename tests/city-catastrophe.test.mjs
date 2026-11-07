import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  CITY_DESTRUCTION_BEATS, CITY_GROUND_Y, cityDebrisPose,
  cityDebrisSupportY, createCityCatastrophe,
} from '../src/city-catastrophe.js';
import { createCity34Concept, setCity34ConceptQuality } from '../src/city-34-concept.js';
import { crossesSolid } from '../src/flight.js';
import { harness } from './harness.mjs';

test('authored urban crashes include signage, falling car, facade and hanging maglev', () => {
  assert.deepEqual(CITY_DESTRUCTION_BEATS.map((beat) => beat.kind),
    ['billboard', 'car', 'facade', 'train']);
  const city = createCityCatastrophe();
  assert.equal(city.root.name, 'city-destruction-premium');
  const names = [];
  city.root.traverse((mesh) => { if (mesh.name) names.push(mesh.name); });
  for (const name of [
    'city-fallen-advertising-frame', 'city-falling-hovercar-hull',
    'city-collapsed-building-facade', 'city-broken-maglev-carriage',
    'city-maglev-torn-suspension-cable', 'city-explosion-flash',
    'city-impact-shockwave', 'city-impact-sparks',
  ]) assert.ok(names.includes(name), name);
  assert.equal(city.colliders().length, 0, 'future scripted objects do not trigger invisible hits');
});

test('fallen props do not clip through ground at 30, 60 or 120 Hz, including rotated corners', () => {
  const simulate = (hz) => {
    const city = createCityCatastrophe();
    for (let i = 0; i <= 24 * hz; i++) {
      city.update(1 / hz, i / hz, 48, true);
      for (const debris of city.snapshot()) {
        if (debris.kind === 'train' || !debris.active) continue;
        assert.ok(debris.groundClearance >= -1e-7,
          `${debris.kind}: geometry entered road at ${i / hz}s, clearance ${debris.groundClearance}`);
        assert.ok(Number.isFinite(debris.y) && Number.isFinite(debris.tilt));
      }
    }
    return city.snapshot();
  };
  const slow = simulate(30), normal = simulate(60), fast = simulate(120);
  for (const kind of ['billboard', 'car', 'facade']) {
    const a = slow.find((item) => item.kind === kind);
    const b = normal.find((item) => item.kind === kind);
    const c = fast.find((item) => item.kind === kind);
    assert.equal(a.impact, true);
    assert.ok(Math.abs(a.y - b.y) < 0.01);
    assert.ok(Math.abs(b.y - c.y) < 0.01);
  }
});

test('impact flash and shockwave are pooled and reset cleanly with the phase', () => {
  const city = createCityCatastrophe();
  const before = city.root.children.length;
  city.update(0.05, 5.5, 48, true);
  const atImpact = city.snapshot();
  assert.equal(atImpact[0].impact, true);
  assert.equal(atImpact[0].fx, true);
  city.update(0.85, 6.4, 48, true);
  assert.equal(city.snapshot()[0].fx, false);
  assert.equal(city.root.children.length, before, 'impact does not instantiate new meshes per frame');
  city.reset();
  assert.ok(city.snapshot().every((item) => !item.impact));
  assert.equal(city.colliders().length, 0);
});

test('hanging maglev has visible tether, remains above road and is an actual collision volume', () => {
  const city = createCityCatastrophe();
  let state;
  for (let i = 0; i < 370; i++) {
    city.update(0.05, i * 0.05, 48, true);
    state = city.snapshot().find((part) => part.kind === 'train');
  }
  assert.ok(state.active);
  assert.ok(state.y > CITY_GROUND_Y + 5);
  assert.equal(state.cable, true);
  const train = city.colliders().find((part) => part.kind === 'train');
  assert.ok(train, 'the visible train is not just decoration');
  assert.ok(crossesSolid(
    new T.Vector3(train.center.x, train.center.y, train.center.z - 28),
    new T.Vector3(train.center.x, train.center.y, train.center.z + 28),
    train.center, train.half, 1.3,
  ), 'player crossing the actual train bounds triggers collision');
  assert.ok(!crossesSolid(
    new T.Vector3(-25, 6, train.center.z - 28),
    new T.Vector3(-25, 6, train.center.z + 28),
    train.center, train.half, 1.3,
  ), 'left side remains available as an escape lane');
});

test('no pair of fully settled debris share overlapping ground footprint', () => {
  const city = createCityCatastrophe();
  for (let i = 0; i < 430; i++) city.update(0.05, i * 0.05, 48, true);
  const s = city.snapshot().filter((e) => e.kind !== 'train' && e.impact);
  for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) {
    const first = CITY_DESTRUCTION_BEATS.find((b) => b.kind === s[i].kind);
    const second = CITY_DESTRUCTION_BEATS.find((b) => b.kind === s[j].kind);
    const dz = Math.abs(s[i].z - s[j].z);
    assert.ok(dz > (first.d + second.d) / 2 + 5,
      `fallen ${s[i].kind} and ${s[j].kind} should not intersect`);
  }
});

test('concept skyline includes premium layers but central flight lane remains open', () => {
  const city = createCity34Concept();
  const architecture = city.userData.architecture;
  assert.ok(architecture.length >= 36);
  assert.ok(architecture.every((tower) => Math.abs(tower.x) > 65));
  assert.ok(city.getObjectByName('city34-multilevel-skybridges').count >= 6);
  assert.ok(city.getObjectByName('city34-facade-cyan-rooms').count >= 100);
  assert.ok(city.getObjectByName('city34-concept-ad-nova-wing'));
  assert.ok(city.getObjectByName('city34-concept-ad-aerorail'));
  assert.ok(!city.getObjectByName('city34-concept-high-detail').visible);
  setCity34ConceptQuality(city, 'high');
  assert.ok(city.getObjectByName('city34-concept-high-detail').visible);
  setCity34ConceptQuality(city, 'medium');
  assert.ok(!city.getObjectByName('city34-concept-high-detail').visible);
});

test('phase 1 integrates falling scenery and isolates it from Mars and other sectors', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.game.snapshot().cityDestruction.length, 4);
  h.advance(13.9, 0.1);
  const frame = h.game.snapshot();
  assert.equal(frame.sector, 1);
  assert.equal(frame.cityDestruction.length, 4);
  assert.ok(frame.cityDestruction.filter((e) => e.impact).length >= 2);
  assert.ok(frame.cityDestruction.every((e) => e.kind === 'train' || e.groundClearance >= -0.001));
  h.game.pause();
  const paused = h.game.snapshot();
  h.advance(1.2, 0.1);
  assert.deepEqual(h.game.snapshot(), paused, 'physics pauses with gameplay');
  h.game.pause();
  h.game.start();
  assert.ok(h.game.snapshot().cityDestruction.every((e) => !e.impact));
});
