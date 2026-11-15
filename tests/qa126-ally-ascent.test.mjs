import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLY_SORTIE_FLIGHT,
  allySortieFlightAt,
  allySortieFlightPose,
  overdriveWingPose,
} from '../src/five-cats-squad.js';
import { stageOneEncounterWindows, stageOneCombatDensity } from '../src/stage-one-pacing.js';
import { fighterMotion } from '../src/enemy-roles.js';
import { harness } from './harness.mjs';

test('each allied sortie has visible arrival, escort and tangent departure', () => {
  const player = { x: 0, y: 16, z: 0 };
  const starts = [19, 42, 66, 91];
  for (const start of starts) {
    const enter = allySortieFlightAt(start, 'bia');
    const escort = allySortieFlightAt(start + 2.6, 'bia');
    const depart = allySortieFlightAt(start + 6.5, 'bia');
    const last = allySortieFlightAt(start + ALLY_SORTIE_FLIGHT.duration - 0.01, 'bia');
    assert.equal(enter.phase, 'arrival');
    assert.equal(escort.phase, 'escort');
    assert.equal(depart.phase, 'departure');
    const firstPose = allySortieFlightPose(enter, player);
    const middlePose = allySortieFlightPose(escort, player);
    const outPose = allySortieFlightPose(last, player);
    assert.ok(Math.abs(firstPose.x) > 100 && firstPose.z < -230, 'ship enters from far away');
    assert.ok(Math.abs(middlePose.x) < 25 && middlePose.z > -35, 'ship visibly escorts');
    assert.ok(Math.abs(outPose.x) > 145 && outPose.z < -275, 'ship leaves far on a banked tangent');
    assert.equal(allySortieFlightAt(start + ALLY_SORTIE_FLIGHT.duration, 'bia'), null);
  }
  assert.equal(allySortieFlightAt(-1, 'bia'), null);
});

test('allied paths are continuous at phase boundaries, without teleporting', () => {
  const pos = { x: 12, y: 34, z: 0 };
  const offset = 19;
  for (const boundary of [ALLY_SORTIE_FLIGHT.entry, ALLY_SORTIE_FLIGHT.escortEnd]) {
    const before = allySortieFlightPose(allySortieFlightAt(offset + boundary - 0.001, 'bia'), pos);
    const after = allySortieFlightPose(allySortieFlightAt(offset + boundary + 0.001, 'bia'), pos);
    assert.ok(Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z) < 0.4);
  }
  const out = overdriveWingPose(-1, 12.59, pos);
  const approach = overdriveWingPose(-1, 0, pos);
  assert.ok(Math.abs(approach.x - pos.x) > 100);
  assert.ok(Math.abs(out.x - pos.x) > 150 && out.z - pos.z < -260);
});

test('ascent fighter waves do not interfere with the train or mandatory boost', () => {
  const get = (phase, atmosphericAge = 0) =>
    stageOneEncounterWindows(45, phase, null, true, atmosphericAge);
  assert.equal(get('city').ascentCombat, false);
  assert.equal(get('boost').ascentCombat, false);
  assert.equal(get('atmosphere', 7.9).ascentCombat, false);
  assert.equal(get('atmosphere', 8).ascentCombat, true);
  assert.equal(get('atmosphere', 20).exclusiveTransit, true);
  assert.equal(get('atmosphere', 34.9).ascentCombat, true);
  assert.equal(get('atmosphere', 35).ascentCombat, false);
  assert.equal(stageOneEncounterWindows(45, 'atmosphere', null, false, 18).ascentCombat, false);
});

test('ascent waves scale with difficulty, but cap simultaneous fighters', () => {
  const normal = stageOneCombatDensity('normal', false, 0, true);
  assert.equal(normal.count, 2);
  assert.ok(normal.interval > 3.5 && normal.interval < 5.5);
  assert.equal(stageOneCombatDensity('normal', false, 4, true).count, 0);
  assert.ok(stageOneCombatDensity('hard', false, 0, true).count > normal.count);
  assert.ok(stageOneCombatDensity('easy', false, 0, true).count < normal.count);
  assert.equal(stageOneCombatDensity('normal', false, 0).count, 2);
});

test('space fighters move vertically to meet the player without abrupt jumps', () => {
  for (const role of ['pursuer', 'interceptor', 'bomber']) {
    const spawn = fighterMotion(role, 0, 0, 15, 0, 0, 170);
    const encounter = fighterMotion(role, 3.2, 0, 15, 0, 0, 170);
    assert.ok(spawn.y < 20, 'fighters enter from their own lane');
    assert.ok(encounter.y > 70, 'fighters climb toward player lane');
    assert.ok(Number.isFinite(encounter.y));
  }
});

test('actual runtime keeps ally visible through escort and exit phase', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  h.advance(19.4, 0.1);
  let visible = h.game.snapshot().fiveCats.visible;
  assert.equal(visible.length, 1);
  const arrival = visible[0];
  h.advance(4.0, 0.1);
  visible = h.game.snapshot().fiveCats.visible;
  assert.equal(visible.length, 1);
  assert.ok(Math.abs(visible[0].x - arrival.x) > 20);
  h.advance(3.5, 0.1);
  visible = h.game.snapshot().fiveCats.visible;
  assert.equal(visible.length, 1);
  assert.ok(Math.abs(visible[0].x) > 80, 'wing must fly away rather than disappear');
  h.advance(1.5, 0.1);
  assert.equal(h.game.snapshot().fiveCats.visible.length, 0, 'offscreen wing may be recycled');
});
