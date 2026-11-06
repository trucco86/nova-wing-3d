import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createFlyingRobot, animateMechPower, resetMechPower } from '../src/visuals.js';
import { updateMechaPose, resetMechaPose } from '../src/mecha-motion.js';

const approx = (a, b, tolerance = 0.001) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≈ ${b}`);

function rig() {
  const robot = createFlyingRobot();
  robot.updateMatrixWorld(true);
  return { robot, articulated: robot.userData.mecha, legacy: robot.userData.mechRig };
}

test('actual cannon and lower armor follow animated elbow and knee joints', () => {
  const { robot, articulated } = rig();
  const right = articulated.arms.right;
  const left = articulated.arms.left;
  assert.equal(right.muzzle.parent, right.elbow, 'weapon barrel must be inside the elbow joint');
  assert.equal(left.muzzle.parent, left.elbow, 'precision barrel must have an articulated elbow');
  assert.ok(right.elbow.children.length >= 4, 'right wrist carries actual armor and muzzle');
  for (const knee of articulated.knees) {
    assert.ok(knee.children.length >= 3, 'lower leg and lights follow real knee pivot');
  }
  const before = right.muzzle.getWorldPosition(new T.Vector3());
  const lowerBefore = articulated.knees[0].children[0].getWorldPosition(new T.Vector3());
  updateMechaPose(robot, { dt: 0.05, time: 1, strafe: 1, vertical: -1, firing: true, recoil: 0.8 });
  const after = right.muzzle.getWorldPosition(new T.Vector3());
  const lowerAfter = articulated.knees[0].children[0].getWorldPosition(new T.Vector3());
  assert.ok(before.distanceTo(after) > 0.05, 'firing moves the physical muzzle visibly');
  assert.ok(lowerBefore.distanceTo(lowerAfter) > 0.02, 'flight moves the shin mesh');
  assert.ok(articulated.torso.rotation.z < 0, 'torso counters strafe');
  assert.ok(articulated.head.rotation.y < 0, 'head counter-tracks the horizon');
  assert.ok(articulated.legs.some((leg) => Math.abs(leg.rotation.x) > 0.02));
});

test('charged precision recoil only drives the left-arm barrel', () => {
  const { robot, articulated } = rig();
  const { left, right } = articulated.arms;
  updateMechaPose(robot, { dt: 0.05, time: 2, recoil: 0, precisionRecoil: 0.9 });
  assert.ok(Math.abs(left.muzzle.position.z - left.muzzle.userData.restBarrelZ) > 0.08);
  approx(right.muzzle.position.z, right.muzzle.userData.restBarrelZ);
  assert.ok(Math.abs(left.elbow.rotation.x) > 0.06);
});

test('premium turbine retains dual vectoring, rotor, glow and warm BOOST plasma', () => {
  const { robot, articulated, legacy } = rig();
  assert.equal(articulated.thrusters.length, 2);
  assert.equal(articulated.hipJets.length, 2);
  for (const drive of articulated.thrusters) {
    assert.ok(drive.innerPlume);
    assert.ok(drive.outerRim);
    assert.ok(drive.rotor.children.length >= 4);
  }
  for (let frame = 0; frame < 20; frame++) {
    const t = frame / 60;
    animateMechPower(robot, t, true, 8, { x: 1, y: 0.5 }, 1 / 60);
    updateMechaPose(robot, { dt: 1 / 60, time: t, boosting: true, strafe: 1, vertical: 0.5 });
  }
  assert.ok(legacy.turbineRotor.rotation.z > 0);
  assert.ok(legacy.turbineFlame.scale.y > 1.2);
  assert.ok(legacy.turbineInnerFlame.scale.y > 1.3);
  assert.equal(legacy.turbineFlame.material.color.getHexString(), 'ff9750');
  assert.ok(articulated.thrusters[0].plume.scale.y > 1.1);
  assert.ok(articulated.thrusters[0].innerPlume.scale.y > 1.1);
  assert.ok(articulated.thrusters[0].nozzle.rotation.y < -0.1);
  assert.ok(articulated.thrusters[0].rotor.rotation.z !== 0);
  assert.ok(articulated.hipJets.some((jet) => jet.visible));
  assert.ok(articulated.wingPivots.some((wing) => Math.abs(wing.rotation.z) > 0.03));
});

test('pause freezes all bones and turbine rotor; reset removes residual recoil and glow', () => {
  const { robot, articulated, legacy } = rig();
  updateMechaPose(robot, { dt: 0.016, time: 2, strafe: 1, boosting: true, recoil: 0.75 });
  animateMechPower(robot, 2, true, 8, { x: 1 }, 0.016);
  const state = {
    torso: articulated.torso.rotation.z,
    knee: articulated.knees[0].rotation.x,
    rotor: legacy.turbineRotor.rotation.z,
    nozzle: articulated.thrusters[0].nozzle.rotation.y,
  };
  updateMechaPose(robot, { dt: 0, time: 8, strafe: -1, boosting: false, recoil: 0 });
  animateMechPower(robot, 8, false, 8, { x: -1 }, 0);
  approx(state.torso, articulated.torso.rotation.z);
  approx(state.knee, articulated.knees[0].rotation.x);
  approx(state.rotor, legacy.turbineRotor.rotation.z);
  approx(state.nozzle, articulated.thrusters[0].nozzle.rotation.y);
  resetMechPower(robot);
  resetMechaPose(robot);
  approx(articulated.torso.rotation.z, 0);
  approx(articulated.knees[0].rotation.x, 0);
  approx(articulated.thrusters[0].rotor.rotation.z, 0);
  approx(legacy.turbineRotor.rotation.z, 0);
  assert.ok(articulated.hipJets.every((jet) => !jet.visible));
  approx(
    articulated.arms.right.muzzle.position.z,
    articulated.arms.right.muzzle.userData.restBarrelZ,
  );
});

test('premium animation is frame-rate stable and does not deform the robot collider envelope', () => {
  const simulate = (hz) => {
    const { robot, articulated } = rig();
    for (let frame = 0; frame < hz * 2; frame++) {
      const t = (frame + 1) / hz;
      updateMechaPose(robot, {
        dt: 1 / hz,
        time: t,
        strafe: 0.65,
        vertical: 0.2,
        boosting: t > 0.5,
        firing: true,
        recoil: Math.sin(t * 11) * 0.16 + 0.16,
      });
    }
    const box = new T.Box3().setFromObject(robot);
    const size = box.getSize(new T.Vector3());
    assert.ok(size.x > 4 && size.x < 40, 'wings stay within expected visual scale');
    assert.ok(size.y > 5 && size.y < 40, 'legs stay within expected visual scale');
    return { torso: articulated.torso.rotation.z, knee: articulated.knees[0].rotation.x };
  };
  const fast = simulate(60);
  const slow = simulate(30);
  approx(fast.torso, slow.torso, 0.012);
  approx(fast.knee, slow.knee, 0.03);
});
