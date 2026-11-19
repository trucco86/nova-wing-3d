import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  FIRST_STAGE_LAUNCH_SECONDS,
  firstStageLaunchAt,
  firstStageLaunchWingPose,
  createFirstStageLaunchIntro,
} from '../src/stage-one-launch-intro.js';

test('launch doors, ignition, departure and seamless playable camera handoff', () => {
  assert.equal(FIRST_STAGE_LAUNCH_SECONDS, 5);
  const frames = [0, 1.2, 2.5, 4.5, 5].map((t) => firstStageLaunchAt(t));
  assert.deepEqual(frames.map((f) => f.beat), [
    'doors', 'ignition', 'departure', 'handoff', 'handoff',
  ]);
  assert.equal(frames[0].doors, 0);
  assert.equal(frames.at(-1).doors, 1);
  assert.ok(frames[2].corridorShift > frames[1].corridorShift);
  assert.equal(frames.at(-1).camera.x, 0);
  assert.equal(frames.at(-1).camera.z, 43);
  assert.deepEqual(firstStageLaunchAt(-50), frames[0]);
  assert.equal(firstStageLaunchAt(Infinity).t, 0);
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
  assert.equal(end.z, 7);
  const tall = firstStageLaunchWingPose(2, 2, 390 / 844);
  assert.ok(Math.abs(tall.x) < Math.abs(firstStageLaunchWingPose(2, 2, 16 / 9).x));
});

test('visual-only hangar opens its doors, scrolls back, hides and disposes', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  const intro = createFirstStageLaunchIntro(scene, camera);
  assert.equal(intro.root.visible, false);
  intro.reset(true);
  assert.ok(intro.active);
  const left = intro.root.getObjectByName('launch-door-left');
  const before = left.position.x;
  intro.update(1.5);
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
  assert.ok(count < 40, 'intro must stay cheap on mobile GPUs');
  intro.finish();
  assert.equal(intro.root.visible, false);
  intro.reset(false);
  assert.equal(intro.active, false);
  intro.destroy();
  assert.equal(scene.getObjectByName('first-stage-launch-bay'), undefined);
});
