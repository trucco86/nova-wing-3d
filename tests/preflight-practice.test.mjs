import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { preserveTrainingCraftPose } from '../src/preflight-training.js';
import {
  PREFLIGHT_ACTIONS,
  PREFLIGHT_KEY_CODES,
  createPracticeProgress,
} from '../src/preflight-practice.js';
import { harness } from './harness.mjs';

test('practice teaches exactly six distinct real game controls and never counts duplicates', () => {
  assert.deepEqual(
    PREFLIGHT_ACTIONS.map(({ id }) => id),
    ['move', 'fire', 'boost', 'roll', 'transform', 'camera'],
  );
  const progress = createPracticeProgress();
  assert.deepEqual(progress.snapshot(), {
    completed: [],
    total: 6,
    count: 0,
    done: false,
    next: 'move',
  });
  assert.equal(progress.mark('invalid'), false);
  for (const { id } of PREFLIGHT_ACTIONS) {
    assert.ok(progress.mark(id));
    assert.ok(progress.mark(id));
  }
  assert.equal(progress.snapshot().count, 6);
  assert.equal(progress.snapshot().done, true);
  assert.equal(PREFLIGHT_KEY_CODES.KeyT, 'transform');
  assert.equal(PREFLIGHT_KEY_CODES.KeyC, 'camera');
  progress.reset();
  assert.equal(progress.snapshot().count, 0);
});

test('preflight training lets the selected pilot practice keyboard controls without advancing the campaign', (t) => {
  const h = harness({
    spawnEncounters: false,
    enableSquadIntro: true,
    preflightMap: true,
  });
  t.after(() => h.close());
  h.game.selectPilot('bob');
  h.game.selectShip('specter');
  h.game.selectShipColor('crimson');
  h.game.start();
  assert.equal(h.game.snapshot().state, 'map');
  assert.equal(h.elements.get('mapTrain').hidden, false);
  h.elements.get('mapTrain').onclick();
  let snapshot = h.game.snapshot();
  assert.equal(snapshot.preflightPractice.active, true);
  assert.equal(snapshot.preflightPractice.selected.pilot, 'bob');
  assert.equal(snapshot.preflightPractice.selected.ship, 'specter');
  assert.equal(snapshot.preflightPractice.selected.color, 'crimson');
  for (const code of ['ArrowRight', 'Space', 'ShiftLeft', 'KeyQ', 'KeyT', 'KeyC']) {
    h.key(code);
    h.key(code, false);
  }
  snapshot = h.game.snapshot();
  assert.equal(snapshot.preflightPractice.done, true);
  assert.equal(snapshot.preflightPractice.count, 6);
  assert.equal(snapshot.preflightPractice.robotMode, true);
  assert.equal(snapshot.preflightPractice.cameraIndex, 1);
  assert.equal(snapshot.state, 'map');
  assert.equal(snapshot.seconds, 0);
  assert.equal(snapshot.entities.shots, 0);
  assert.equal(snapshot.loadout.pilot, 'bob');
  assert.equal(snapshot.loadout.ship, 'specter');
  assert.equal(snapshot.loadout.color, 'crimson');
  h.elements.get('trainingLaunch').onclick();
  snapshot = h.game.snapshot();
  assert.equal(snapshot.preflightPractice.active, false);
  assert.equal(snapshot.state, 'playing');
  assert.ok(snapshot.fiveCats.intro > 0);
  assert.equal(snapshot.fiveCats.playerIsLeader, true);
  assert.equal(snapshot.heroShip.model, 'ship-model-specter');
});

test('training can be skipped or returned to the map without losing the chosen fighter', (t) => {
  const h = harness({ spawnEncounters: false, preflightMap: true });
  t.after(() => h.close());
  h.game.start();
  h.elements.get('mapTrain').onclick();
  h.elements.get('trainingRoll').onclick();
  assert.equal(h.game.snapshot().preflightPractice.count, 1);
  h.elements.get('trainingBack').onclick();
  assert.equal(h.game.snapshot().state, 'map');
  assert.equal(h.game.snapshot().preflightPractice.active, false);
  h.elements.get('mapLaunch').onclick();
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().preflightPractice.active, false);
});


test('switching from ship to robot and back preserves the active flight pose', () => {
  const ship = new T.Object3D();
  const robot = new T.Object3D();
  ship.position.set(4.5, -1.25, 2);
  ship.rotation.set(0.1, 0.2, 0.6);
  assert.equal(preserveTrainingCraftPose(ship, robot), true);
  assert.ok(robot.position.equals(ship.position));
  assert.ok(robot.quaternion.equals(ship.quaternion));
  robot.position.set(-2, 3.5, -1);
  robot.rotation.set(0, 0.4, -0.2);
  assert.equal(preserveTrainingCraftPose(robot, ship), true);
  assert.ok(ship.position.equals(robot.position));
  assert.ok(ship.quaternion.equals(robot.quaternion));
  assert.equal(preserveTrainingCraftPose(null, ship), false);
});
