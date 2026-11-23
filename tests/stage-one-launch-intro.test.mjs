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

test('stage-one opening has exactly three clear moments and no reverse shot', () => {
  assert.equal(FIRST_STAGE_LAUNCH_SECONDS, 6.5);
  assert.deepEqual(FIRST_STAGE_SHOTS, [
    { at: 0, name: 'hangar' },
    { at: 1.6, name: 'exit' },
    { at: 4.4, name: 'approach' },
  ]);
  const frames = [0, 1.7, 3, 5, 6.5].map((t) => firstStageLaunchAt(t));
  assert.deepEqual(
    frames.map((f) => f.beat),
    ['hangar', 'exit', 'exit', 'approach', 'approach'],
  );
  assert.equal(frames[0].doors, 0);
  assert.equal(frames.at(-1).doors, 1);
  assert.ok(frames[2].corridorShift > 0);
  assert.equal(frames.at(-1).corridorShift, 190);
  assert.equal(frames.at(-1).camera.x, 0);
  assert.equal(frames.at(-1).camera.z, 43);
  assert.equal(frames.at(-1).camera.aimZ, -90);
  assert.equal(frames.at(-1).camera.fov, 60);
  assert.deepEqual(firstStageLaunchAt(-10), frames[0]);
  assert.equal(firstStageLaunchAt(Infinity).t, 0);
});

test('camera continuously looks forward at the gate through launch and handoff on mobile', () => {
  for (const aspect of [390 / 844, 16 / 9]) {
    const moments = Array.from({ length: 66 }, (_, i) => firstStageLaunchAt(i * 0.1, aspect));
    assert.equal(moments[4].shot, 'hangar');
    assert.equal(moments[26].shot, 'exit');
    assert.equal(moments[53].shot, 'approach');
    for (let i = 1; i < moments.length; i++) {
      const a = moments[i - 1];
      const b = moments[i];
      assert.ok(b.doors >= a.doors && b.departure >= a.departure);
      assert.ok(b.camera.aimZ < b.camera.z, 'camera must ALWAYS face the front exit');
      assert.ok(Math.abs(a.camera.z - b.camera.z) < 2, 'no abrupt camera-position cut');
      assert.ok(Math.abs(a.camera.aimZ - b.camera.aimZ) < 3, 'no abrupt focus cut');
      assert.ok(Object.values(b.camera).every(Number.isFinite));
    }
    assert.equal(moments.at(-1).handoff, 1);
  }
});

test('optical camera pushes into the launch then restores original chase FOV on skip', () => {
  const wide = firstStageLaunchAt(0.2, 390 / 844);
  const push = firstStageLaunchAt(3.3, 390 / 844);
  const finish = firstStageLaunchAt(6.5, 390 / 844);
  assert.ok(wide.camera.fov >= 72, 'the player first sees a large deep bay');
  assert.ok(push.camera.fov < 58, 'the camera zooms toward the front gate');
  assert.ok(finish.camera.fov === 60, 'the handoff must match gameplay FOV');
  assert.ok(Math.abs(push.camera.roll) < 0.015, 'engine camera movement is subtle');
  assert.equal(finish.camera.roll, 0);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(60);
  const intro = createFirstStageLaunchIntro(scene, camera);
  intro.reset(true, 'bia');
  intro.update(3.3);
  assert.ok(camera.fov < 58);
  intro.finish();
  assert.equal(camera.fov, 60, 'skipping must restore the gameplay view');
  assert.equal(camera.rotation.z, 0);
  intro.destroy();
});

test('depth architecture and engine beacons use batches, not 60 extra draw calls', () => {
  const scene = new T.Scene();
  const intro = createFirstStageLaunchIntro(scene, new T.PerspectiveCamera());
  for (const name of [
    'launch-ceiling-crossbeams',
    'launch-side-deck-glass',
    'launch-side-observation-columns',
    'launch-floor-depth-seams',
    'launch-ignition-beacons',
    'launch-roof-volumetric-light-shafts',
  ]) {
    const mesh = intro.root.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name + ' is one GPU draw family');
    assert.ok(mesh.count >= 2);
    assert.equal(mesh.userData.visualOnly, true);
  }
  intro.destroy();
});

test('every selected pilot remains real center fighter; four distinct escorts remain', () => {
  for (const lead of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    const slots = firstStageWingSlots(lead);
    assert.deepEqual(
      slots.map(({ slot }) => slot),
      [-2, -1, 1, 2],
    );
    assert.ok(slots.every(({ id }) => id !== lead));
    assert.equal(new Set([lead, ...slots.map(({ id }) => id)]).size, 5);
  }
});

test('five launch ships form a V then peel away before playable handoff', () => {
  for (const t of [0, 2, 3.8, 5.7, 6.5]) {
    const leader = firstStageLaunchWingPose(0, t);
    const left = firstStageLaunchWingPose(-1, t);
    const right = firstStageLaunchWingPose(1, t);
    assert.equal(left.x, -right.x);
    assert.equal(left.z, right.z);
    if (t <= 3.8) assert.ok(left.z > leader.z, 'escorts begin behind the real leader');
    else assert.ok(Math.abs(left.x) > 12, 'escorts exit toward the outer lanes before gameplay');
    assert.equal(leader.x, 0);
  }
  assert.equal(firstStageLaunchWingPose(0, 6.5).z, 9);
  assert.ok(
    Math.abs(firstStageLaunchWingPose(2, 2, 390 / 844).x) <
      Math.abs(firstStageLaunchWingPose(2, 2, 16 / 9).x),
  );
});

test('enclosed rear wall and complete roof are present; camera never points through rear opening', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera();
  const intro = createFirstStageLaunchIntro(scene, camera);
  assert.equal(intro.root.visible, false);
  intro.reset(true, 'bob');
  assert.equal(intro.root.userData.pilotId, 'bob');
  assert.equal(
    intro.root.getObjectByName('launch-selected-pilot'),
    undefined,
    'no pilot close-ups or extra 3D character models in the takeoff',
  );
  const bulkhead = intro.root.getObjectByName('launch-rear-bulkhead');
  const roof = intro.root.getObjectByName('launch-roof-center');
  assert.ok(bulkhead?.isMesh);
  assert.ok(roof?.isMesh);
  assert.equal(bulkhead.geometry.parameters.width, 42);
  assert.equal(bulkhead.position.z, 43);
  assert.ok(roof.geometry.parameters.width >= 13);
  const rear = intro.root.getObjectByName('launch-rear-bulkhead');
  assert.ok(rear.geometry.parameters.height >= 29);
  assert.ok(roof.position.y >= 20, 'roof must leave camera headroom');
  const leftDoor = intro.root.getObjectByName('launch-door-left');
  assert.equal(leftDoor.geometry.parameters.width, 18, 'gate must close the full-width launch lane');
  assert.equal(leftDoor.position.x, -9);
  const before = leftDoor.position.x;
  intro.update(0.4);
  assert.equal(intro.root.userData.shot, 'hangar');
  intro.update(1.6);
  assert.ok(leftDoor.position.x <= -29, 'full-width door must have opened before thrust');
  intro.update(2.6);
  assert.equal(intro.root.userData.shot, 'exit');
  assert.ok(leftDoor.position.x < before);
  assert.ok(intro.root.position.z > 0);
  intro.update(5.3);
  assert.equal(intro.root.userData.shot, 'approach');
  intro.update(6.5);
  assert.equal(camera.position.z, 43);
  let count = 0;
  intro.root.traverse((node) => {
    if (node.isMesh) {
      count++;
      assert.equal(node.userData.visualOnly, true);
    }
  });
  assert.ok(count < 160, 'intro still fits mobile GPU mesh budget');
  intro.finish();
  assert.equal(intro.root.visible, false);
  intro.reset(false);
  assert.equal(intro.active, false);
  intro.destroy();
  assert.equal(scene.getObjectByName('first-stage-launch-bay'), undefined);
});

test('exterior runway parallax continues after the gate and fades before live gameplay', () => {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(60);
  const intro = createFirstStageLaunchIntro(scene, camera);
  intro.reset(true, 'bob');
  const lights = intro.root.getObjectByName('launch-exterior-flight-lights');
  const beacons = intro.root.getObjectByName('launch-exterior-approach-beacons');
  assert.ok(lights?.isInstancedMesh && lights.count >= 16);
  assert.ok(beacons?.isInstancedMesh && beacons.count >= 10);
  assert.equal(lights.userData.visualOnly, true);
  intro.update(3);
  const inFlight = intro.root.position.z;
  const initialOpacity = lights.material.opacity;
  assert.ok(inFlight > 50, 'the outside markers must travel past the real fighter');
  intro.update(5.8);
  assert.ok(intro.root.position.z > inFlight);
  assert.ok(lights.material.opacity < initialOpacity, 'exterior guides fade before the handoff');
  intro.update(6.5);
  assert.ok(lights.material.opacity < 0.001);
  intro.finish();
  intro.destroy();
});
