import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createPilotPatternReader, adaptiveBossAttack } from '../src/pilot-pattern.js';
import { chooseBossIntent, bossMeleePose } from '../src/boss-combat-ai.js';
import { hostileShotHitsShip } from '../src/hostile-hit.js';
import {
  fighterAllowedDuringArrival,
  shouldKeepArrivalCooldown,
} from '../src/encounter-arrival-flow.js';
import { createMarsApproach } from '../src/mars-descent.js';
import { createMarsSandstorm, updateMarsSandstorm } from '../src/mars-sandstorm.js';

test('a hostile bullet cannot tunnel through the fighter between frames', () => {
  const player = new T.Vector3(0, 11, 0);
  const before = new T.Vector3(0, 11, -9);
  const after = new T.Vector3(0, 11, 8);
  assert.ok(before.distanceTo(player) > 2.1);
  assert.ok(after.distanceTo(player) > 2.1);
  assert.equal(hostileShotHitsShip(before, after, player), true);
  assert.equal(
    hostileShotHitsShip(new T.Vector3(8, 11, -9), new T.Vector3(8, 11, 8), player, 2.15),
    false,
    'misses must remain misses even for large glowing boss shots',
  );
  assert.equal(
    hostileShotHitsShip(new T.Vector3(2.65, 11, -9), new T.Vector3(2.65, 11, 8), player),
    true,
    'shot grazing the visible fighter hull should connect',
  );
  assert.equal(
    hostileShotHitsShip(new T.Vector3(3.6, 11, -9), new T.Vector3(3.6, 11, 8), player),
    false,
  );
  assert.equal(
    hostileShotHitsShip(new T.Vector3(2.85, 11, -9), new T.Vector3(2.85, 11, 8), player, 1, true),
    true,
    'the actual robot is slightly broader than the fighter',
  );
});

test('boss reads recent pilot movement and counters repetition without homing during attack', () => {
  const model = createPilotPatternReader();
  for (let i = 0; i < 60; i++) model.sample({ x: i * 0.7, y: 12 }, 0.05, i % 5 < 3);
  const pattern = model.snapshot();
  assert.equal(pattern.observed, true);
  assert.equal(pattern.axis, 'horizontal');
  const repeated = chooseBossIntent({
    sector: 0, cycle: 2, phase: 2, playerX: 8, playerY: 12,
    pilotPattern: pattern, previousKind: 'rok-pincer',
  });
  assert.equal(repeated.kind, 'rok-ram');
  assert.deepEqual([repeated.targetX, repeated.targetY], [8, 12]);
  assert.ok(Object.isFrozen(repeated));
  assert.equal(bossMeleePose(repeated, 'windup', 1).track, 0);
  assert.ok(bossMeleePose(repeated, 'attack', 0.7).track > 0);
  const controlled = adaptiveBossAttack({
    sector: 3, kind: 'barrage', phase: 3, cycle: 3,
    previousKind: 'barrage', pilotPattern: pattern,
  });
  assert.equal(controlled, 'barrage', 'destroyed reactor batteries still suppress unsafe attacks');
  model.reset();
  assert.equal(model.snapshot().observed, false);
  assert.equal(model.snapshot().axis, 'mixed');
});

test('Mars has space intercept action but re-entry itself remains clear', () => {
  assert.equal(fighterAllowedDuringArrival(1, 2.9, true), false);
  assert.equal(fighterAllowedDuringArrival(1, 5.5, true), true);
  assert.equal(fighterAllowedDuringArrival(1, 11.7, true), true);
  assert.equal(fighterAllowedDuringArrival(1, 13, true), false);
  assert.equal(fighterAllowedDuringArrival(1, 26, true), false);
  assert.equal(fighterAllowedDuringArrival(1, 27, false), true);
  assert.equal(shouldKeepArrivalCooldown(1, 9, true), false);
  assert.equal(shouldKeepArrivalCooldown(1, 19, true), true);
  assert.equal(fighterAllowedDuringArrival(0, 9, true), false);
});

test('premium Mars and sandstorm stay in bounded render objects and deterministic layers', () => {
  const root = createMarsApproach();
  const planet = root.getObjectByName('mars-orbit-visible-planet');
  assert.equal(planet.geometry.attributes.position.count, (64 + 1) * (48 + 1));
  assert.ok(planet.material.fragmentShader.includes('distanceToCrater'));
  assert.ok(planet.material.fragmentShader.includes('canyon'));
  assert.equal(planet.children.length, 1, 'no additional planet draw calls');
  const sand = createMarsSandstorm();
  assert.equal(sand.children.length, 4, 'one particle draw and three haze layers');
  const bank = sand.getObjectByName('mars-rolling-sand-haze-bank-1');
  assert.ok(bank.material.fragmentShader.includes('eddies'));
  const first = updateMarsSandstorm(sand, 70);
  const position = bank.position.clone();
  const alpha = bank.material.uniforms.alpha.value;
  const wind = bank.material.uniforms.wind.value;
  const next = updateMarsSandstorm(sand, 70);
  assert.deepEqual(first, next);
  assert.ok(bank.position.equals(position));
  assert.equal(bank.material.uniforms.alpha.value, alpha);
  assert.equal(bank.material.uniforms.wind.value, wind);
  updateMarsSandstorm(sand, 90);
  assert.equal(sand.visible, false);
});
