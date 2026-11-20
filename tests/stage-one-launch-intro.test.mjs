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
  assert.equal(FIRST_STAGE_LAUNCH_SECONDS, 7.5);
  const frames = [0, 2.2, 4.4, 7.1, 7.5].map((t) => firstStageLaunchAt(t));
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
    ['hangar-wide', 'pilot-close', 'deck-side', 'exit-front', 'rear-flight', 'handoff'],
  );
  assert.equal(new Set(FIRST_STAGE_SHOTS.map(({ at }) => at)).size, 6);
  assert.deepEqual(firstStageLaunchAt(-50), frames[0]);
  assert.equal(firstStageLaunchAt(Infinity).t, 0);
});

test('launch has six legible angles with a visible side departure and a true final chase handoff', () => {
  assert.equal(FIRST_STAGE_SHOTS.length, 6);
  assert.ok(FIRST_STAGE_SHOTS.every((shot, i) =>
    i === 0 || shot.at - FIRST_STAGE_SHOTS[i - 1].at >= 0.85));
  for (const aspect of [390 / 844, 16 / 9]) {
    const side = firstStageLaunchAt(3.1, aspect);
    const front = firstStageLaunchAt(4.25, aspect);
    const rear = firstStageLaunchAt(5.8, aspect);
    assert.equal(side.shot, 'deck-side');
    assert.equal(front.shot, 'exit-front');
    assert.equal(rear.shot, 'rear-flight');
    assert.ok(side.camera.x > 0);
    assert.ok(front.camera.z < 0, 'front camera must sit outside the hangar');
    assert.ok(rear.camera.z > 0, 'rear camera follows the ship away from the door');
    assert.ok([side, front, rear].every(({ camera }) =>
      Object.values(camera).every(Number.isFinite)));
  }
  const moments = [0, 1.55, 3.25, 4, 5.5, 6.3, 7.5].map((t) => firstStageLaunchAt(t));
  assert.ok(moments.every((frame, i) =>
    i === 0 || (frame.doors >= moments[i - 1].doors &&
                frame.departure >= moments[i - 1].departure)));
  assert.equal(moments.at(-1).handoff, 1);
  assert.equal(moments.at(-1).corridorShift, 245);
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
  for (const t of [0, 2, 3.8, 5.7, 7.5]) {
    const leader = firstStageLaunchWingPose(0, t);
    const left = firstStageLaunchWingPose(-1, t);
    const right = firstStageLaunchWingPose(1, t);
    assert.equal(left.x, -right.x);
    assert.equal(left.z, right.z);
    assert.ok(left.z > leader.z || t === 7.5);
    assert.equal(leader.x, 0);
  }
  const end = firstStageLaunchWingPose(0, 7.5);
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
  intro.update(2);
  assert.equal(intro.root.userData.shot, 'pilot-close');
  assert.equal(face.visible, true);
  assert.ok(left.position.x < before);
  intro.update(4.5);
  assert.ok(intro.root.position.z > 0);
  assert.ok(intro.root.getObjectByName('launch-exterior-gate-header'));
  assert.equal(intro.root.getObjectByName('launch-exterior-gate-beacon').userData.visualOnly, true);
  intro.update(7.5);
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
