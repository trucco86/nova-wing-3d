import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  FIRST_STAGE_LAUNCH_SECONDS,
  FIRST_STAGE_SHOTS,
  firstStageWingSlots,
  firstStageLaunchAt,
  firstStageLaunchWingPose,
  createFirstStageLaunchIntro,
} from '../src/stage-one-launch-intro.js';

test('launch doors, ignition, departure and seamless playable camera handoff', () => {
  assert.equal(FIRST_STAGE_LAUNCH_SECONDS, 5);
  const frames = [0, 1.2, 3.1, 4.5, 5].map((t) => firstStageLaunchAt(t));
  assert.deepEqual(
    frames.map((f) => f.beat),
    ['doors', 'ignition', 'departure', 'handoff', 'handoff'],
  );
  assert.equal(frames[0].doors, 0);
  assert.equal(frames.at(-1).doors, 1);
  assert.ok(frames[2].corridorShift > frames[1].corridorShift);
  assert.equal(frames.at(-1).camera.x, 0);
  assert.equal(frames.at(-1).camera.z, 43);
  assert.equal(frames.at(-1).camera.aimZ, -90);
  assert.equal(frames.at(-1).camera.fov, 60);
  assert.deepEqual(
    FIRST_STAGE_SHOTS.map(({ name }) => name),
    ['hangar-wide', 'pilot-close', 'exit-front', 'handoff'],
  );
  assert.equal(new Set(FIRST_STAGE_SHOTS.map(({ at }) => at)).size, 4);
  assert.deepEqual(firstStageLaunchAt(-50), frames[0]);
  assert.equal(firstStageLaunchAt(Infinity).t, 0);
});

test('every selected pilot replaces the central placeholder; four distinct escorts remain', () => {
  for (const lead of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    const slots = firstStageWingSlots(lead);
    assert.equal(slots.length, 4);
    assert.deepEqual(
      slots.map(({ slot }) => slot),
      [-2, -1, 1, 2],
    );
    assert.ok(slots.every(({ id }) => id !== lead));
    assert.equal(new Set([lead, ...slots.map(({ id }) => id)]).size, 5);
  }
});

test('five launch ships form a V, leader holds final player position, portrait stays readable', () => {
  for (const t of [0, 1.3, 2.6, 4, 5]) {
    const leader = firstStageLaunchWingPose(0, t);
    const left = firstStageLaunchWingPose(-1, t);
    const right = firstStageLaunchWingPose(1, t);
    assert.equal(left.x, -right.x);
    assert.equal(left.z, right.z);
    assert.ok(left.z > leader.z || t === 5);
    assert.equal(leader.x, 0);
  }
  const end = firstStageLaunchWingPose(0, 5);
  assert.equal(end.x, 0);
  assert.equal(end.y, 6);
  assert.equal(end.z, 9);
  const tall = firstStageLaunchWingPose(2, 2, 390 / 844);
  assert.ok(Math.abs(tall.x) < Math.abs(firstStageLaunchWingPose(2, 2, 16 / 9).x));
});

test('visual-only hangar opens its doors, scrolls back, hides and disposes', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  const intro = createFirstStageLaunchIntro(scene, camera);
  assert.equal(intro.root.visible, false);
  intro.reset(true, 'bob');
  assert.ok(intro.active);
  assert.equal(intro.root.userData.pilotId, 'bob');
  const face = intro.root.getObjectByName('launch-selected-pilot');
  assert.ok(face);
  assert.equal(face.userData.uniformGrade, 0);
  const left = intro.root.getObjectByName('launch-door-left');
  const before = left.position.x;
  intro.update(1.5);
  assert.equal(intro.root.userData.shot, 'pilot-close');
  assert.equal(face.visible, true);
  assert.ok(left.position.x < before);
  intro.update(3);
  assert.ok(intro.root.position.z > 0);
  intro.update(5);
  assert.equal(camera.position.z, 43);
  let count = 0;
  intro.root.traverse((node) => {
    if (node.isMesh) {
      count++;
      assert.equal(node.userData.visualOnly, true);
    }
  });
  assert.ok(count < 160, 'visual-only intro must stay bounded on mobile GPUs');
  intro.finish();
  assert.equal(intro.root.visible, false);
  assert.equal(intro.root.getObjectByName('launch-selected-pilot'), undefined);
  intro.reset(false);
  assert.equal(intro.active, false);
  intro.destroy();
  assert.equal(scene.getObjectByName('first-stage-launch-bay'), undefined);
});
