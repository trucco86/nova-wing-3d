import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import {
  animateMechPower,
  createFlyingRobot,
  createShipModule,
  mechArmPitch,
  setFighterEvolution,
} from '../src/visuals.js';

test('flight mech uses wide dorsal wings and a turbine at shoulder height', () => {
  const robot = createFlyingRobot();
  const leftWing = robot.getObjectByName('mech-wing-left');
  const rightWing = robot.getObjectByName('mech-wing-right');
  const turbine = robot.getObjectByName('mech-back-turbine');
  assert.ok(leftWing, 'the left wing must exist');
  assert.ok(rightWing, 'the right wing must exist');
  assert.ok(turbine, 'main back turbine must exist');
  assert.ok(turbine.position.y > 2.8, 'turbine must not be at waist height');
  assert.ok(turbine.position.z > 1.5, 'main turbine must be on the back');
  const span = new T.Box3().setFromObject(robot);
  assert.ok(span.max.x - span.min.x > 8, 'mecha wings must retain fighter-scale span');
  assert.ok(leftWing.geometry.type === 'ExtrudeGeometry');
  assert.ok(rightWing.geometry.type === 'ExtrudeGeometry');
  assert.equal(robot.userData.mechRig.arms.length, 2);
  assert.equal(robot.userData.mechRig.armMuzzles.length, 2);
});

test('arm pitch raises weapons in firing pose without overrotation', () => {
  const idle = mechArmPitch(0, 0, 1, 0);
  const firing = mechArmPitch(0, 0, 1, 0.45);
  assert.ok(idle > 0.35, 'idle cannon aims forward, not downward');
  assert.ok(firing > idle, 'firing raises the cannon further');
  assert.ok(mechArmPitch(0, 0, 1, 2) <= 1.45, 'recoil is bounded');
});

test('all starfighter variants share mechanical silhouette while preserving variants', () => {
  const modules = ['nova7', 'specter', 'aegis'].map(createShipModule);
  for (const module of modules) {
    assert.ok(module.getObjectByName('ship-mechanical-keel'));
    const span = new T.Box3().setFromObject(module);
    assert.ok(span.max.x - span.min.x > 8, 'starfighter wings must remain wide');
  }
  const silhouettes = modules.map((module) =>
    module.children
      .map((part) => [part.geometry?.type, ...part.position.toArray()].join(':'))
      .join('|'),
  );
  assert.equal(new Set(silhouettes).size, 3, 'each starfighter retains a distinct chassis');
});

test('mecha wings reuse the exact fighter wing geometry rather than a larger rounded copy', () => {
  const robot = createFlyingRobot();
  const fighter = createShipModule('nova7');
  const mechaWing = robot.getObjectByName('mech-wing-right');
  const fighterWing = fighter.children
    .filter((part) => part.userData.sharedWingProfile === 'fighter-v1')
    .at(-1);
  assert.ok(fighterWing);
  assert.equal(mechaWing.userData.sharedWingProfile, fighterWing.userData.sharedWingProfile);
  const mechaPoints = mechaWing.geometry.attributes.position.array;
  const fighterPoints = fighterWing.geometry.attributes.position.array;
  assert.deepEqual(Array.from(mechaPoints), Array.from(fighterPoints));
  assert.ok(robot.scale.x >= 1 && robot.scale.x <= 1.05, 'mecha may grow only subtly without toy-like bulk');
});

test('turbine has visible moving rotor and boost lengthens propulsion plume', () => {
  const robot = createFlyingRobot();
  const rotor = robot.getObjectByName('mech-turbine-rotor');
  assert.ok(rotor, 'visible rotating fan must exist');
  assert.equal(rotor.children.length, 5, 'fan blades must make spin visible');
  animateMechPower(robot, 0.2, false, 0);
  const idleRotation = rotor.rotation.z;
  const idleFlame = robot.userData.mechRig.turbineFlame.scale.y;
  animateMechPower(robot, 0.4, true, 9);
  assert.notEqual(rotor.rotation.z, idleRotation);
  assert.ok(robot.userData.mechRig.turbineFlame.scale.y > idleFlame);
});

test('mech and fighter progressively reveal larger neon panels as XP stage rises', () => {
  const robot = createFlyingRobot();
  const ship = createShipModule('nova7');
  animateMechPower(robot, 0, false, 0);
  setFighterEvolution(ship, 0);
  assert.equal(
    robot.userData.mechRig.progressionNeons.filter((part) => part.mesh.visible).length,
    2,
  );
  assert.equal(ship.userData.progressionNeons.filter((part) => part.mesh.visible).length, 2);
  animateMechPower(robot, 1, false, 6);
  setFighterEvolution(ship, 6);
  assert.equal(
    robot.userData.mechRig.progressionNeons.filter((part) => part.mesh.visible).length,
    6,
  );
  assert.equal(ship.userData.progressionNeons.filter((part) => part.mesh.visible).length, 6);
});

test('rear-facing armor uses faceted plates, a visible thruster halo and distinct helmet crest', () => {
  const robot = createFlyingRobot();
  const rearArmor = robot.getObjectByName('mech-rear-armor-facets');
  const crest = robot.getObjectByName('mech-cranial-crest');
  const turbineHalo = robot.getObjectByName('mech-turbine-halo');
  assert.ok(rearArmor, 'rear armor must have a discernible hero silhouette');
  assert.equal(rearArmor.geometry.type, 'ExtrudeGeometry', 'main armor must not be a plain box');
  assert.ok(crest, 'pilot helmet must have a recognizable angular crest');
  assert.ok(turbineHalo, 'rear-facing turbine must glow in chase camera');
  assert.equal(robot.userData.mechRig.arms.length, 2);
  assert.equal(robot.userData.mechRig.legs.length, 2);
});

test('back nozzle gimbal reacts to steering and boost without moving the fixed housing', () => {
  const robot = createFlyingRobot();
  const housing = robot.getObjectByName('mech-back-turbine');
  const gimbal = robot.getObjectByName('mech-turbine-gimbal');
  const rotor = robot.getObjectByName('mech-turbine-rotor');
  assert.ok(gimbal, 'articulated nozzle assembly must exist');
  assert.equal(rotor.parent, gimbal, 'rotor should move with the turbine nozzle');
  const fixedHousing = housing.position.clone();
  animateMechPower(robot, 1, false, 0, { x: -1, y: -1 });
  const yawLeft = gimbal.rotation.y;
  const pitchClimb = gimbal.rotation.x;
  animateMechPower(robot, 1, true, 0, { x: 1, y: 1 });
  assert.ok(gimbal.rotation.y > yawLeft, 'turn input must rotate the nozzle');
  assert.ok(gimbal.rotation.x < pitchClimb, 'boost and climb must pitch the nozzle');
  assert.deepEqual(housing.position.toArray(), fixedHousing.toArray());
  assert.ok(Math.abs(gimbal.rotation.y) < 0.25);
  assert.ok(Math.abs(gimbal.rotation.x) < 0.25);
});

test('boost never jumps rotor phase after a long mission and releases smoothly', () => {
  const robot = createFlyingRobot();
  const rig = robot.userData.mechRig;
  animateMechPower(robot, 137.45, false, 0, {}, 1 / 60);
  let last = rig.turbineRotor.rotation.z;
  for (const boosting of [true, true, false, false, true, false]) {
    const beforePower = rig.propulsionPower;
    animateMechPower(robot, 137.45, boosting, 0, {}, 1 / 60);
    const distance = (rig.turbineRotor.rotation.z - last + Math.PI * 2) % (Math.PI * 2);
    assert.ok(distance >= 10 / 60 - 1e-10 && distance <= 24 / 60 + 1e-10);
    assert.ok(Math.abs(rig.propulsionPower - beforePower) < 0.2, 'no instant ignition/cutoff');
    last = rig.turbineRotor.rotation.z;
  }
});

test('propulsion keeps equivalent phase at 30/60/120 Hz and anchors exhaust at each nozzle', () => {
  const results = [30, 60, 120].map((fps) => {
    const robot = createFlyingRobot();
    const rig = robot.userData.mechRig;
    let elapsed = 0;
    for (const boosting of [false, true, false]) {
      for (let frame = 0; frame < fps; frame++) {
        elapsed += 1 / fps;
        animateMechPower(robot, elapsed, boosting, 0, { x: 1, y: -1 }, 1 / fps);
        assert.ok(
          Math.abs(rig.turbineFlame.position.z - (1.75 * rig.turbineFlame.scale.y) / 2 - 0.725) <
            1e-10,
        );
        for (const plume of rig.sidePlumes) {
          assert.ok(Math.abs(plume.position.z - (1.4 * plume.scale.y) / 2 - 2.2) < 1e-10);
        }
      }
    }
    return [
      rig.turbineRotor.rotation.z,
      rig.propulsionPower,
      rig.turbineGimbal.rotation.x,
      rig.turbineGimbal.rotation.y,
    ];
  });
  for (const result of results.slice(1)) {
    result.forEach((value, index) => assert.ok(Math.abs(value - results[0][index]) < 1e-9));
  }
});

test('zero simulation delta freezes propulsion and steering reversals interpolate within limits', () => {
  const robot = createFlyingRobot();
  const rig = robot.userData.mechRig;
  animateMechPower(robot, 1, true, 0, { x: -1, y: -1 }, 0.05);
  const before = [
    rig.turbineRotor.rotation.z,
    rig.turbineGimbal.rotation.x,
    rig.turbineGimbal.rotation.y,
    rig.turbineFlame.scale.y,
  ];
  animateMechPower(robot, 900, false, 0, { x: 1, y: 1 }, 0);
  assert.deepEqual(
    [
      rig.turbineRotor.rotation.z,
      rig.turbineGimbal.rotation.x,
      rig.turbineGimbal.rotation.y,
      rig.turbineFlame.scale.y,
    ],
    before,
  );
  animateMechPower(robot, 1.05, true, 0, { x: 1, y: 1 }, 0.05);
  assert.ok(
    Math.abs(rig.turbineGimbal.rotation.y - before[2]) < 0.19,
    'direction change is damped',
  );
  assert.ok(Math.abs(rig.turbineGimbal.rotation.x) <= 0.21);
});

test('real touch and keyboard boost share mech pose, pause and energy-exhaustion behavior', (t) => {
  const runs = ['keyboard', 'touch'].map((input) => {
    let robot;
    const h = harness({
      observeScene: (scene) => {
        robot = scene.getObjectByName('five-cats-flight-mech') ?? robot;
      },
    });
    t.after(() => h.close());
    h.game.start();
    h.key('KeyT');
    h.advance(1);
    assert.ok(robot?.visible);
    if (input === 'keyboard') h.key('ShiftLeft');
    else h.elements.get('boostTouch').onpointerdown({ pointerId: 12, preventDefault() {} });
    h.advance(0.4);
    const rig = robot.userData.mechRig;
    assert.ok(rig.propulsionPower > 0.9, 'the input must actually engage propulsion');
    const poweredPose = [
      rig.propulsionPower,
      ...rig.arms.map((arm) => arm.rotation.x),
      ...rig.legs.map((leg) => leg.rotation.x),
    ];
    h.game.pause();
    const phase = rig.turbineRotor.rotation.z;
    h.advance(2);
    assert.equal(rig.turbineRotor.rotation.z, phase, 'pause freezes propulsion');
    h.game.pause();
    // Pause releases both input sources. Reapply a fresh boost and drain it.
    if (input === 'keyboard') h.key('ShiftLeft');
    else h.elements.get('boostTouch').onpointerdown({ pointerId: 13, preventDefault() {} });
    h.advance(5);
    assert.ok(
      rig.propulsionPower < 0.01,
      'held input cannot animate boost after energy exhaustion',
    );
    h.game.start();
    assert.equal(rig.propulsionPower, 0, 'restart clears propulsion intensity');
    assert.equal(rig.turbineRotor.rotation.z, 0, 'restart clears rotor phase');
    h.key('KeyT');
    h.advance(0.2);
    assert.equal(rig.propulsionPower, 0, 'fresh mission starts without boost');
    return poweredPose;
  });
  assert.deepEqual(runs[0], runs[1], 'touch must animate the same pose as keyboard');
});

test('newly transformed mech stays visible throughout invulnerability without relying on BOOST', (t) => {
  let robot;
  const h = harness({
    observeScene(scene) {
      robot = scene.getObjectByName('five-cats-flight-mech') ?? robot;
    },
  });
  t.after(() => h.close());
  h.game.start();
  h.key('KeyT');
  let previous = 0;
  for (const time of [0.08, 0.35, 0.85, 1.25]) {
    h.advance(time - previous, 0.02);
    previous = time;
    assert.ok(robot?.visible, 'mecha rig stays enabled at ' + time + 's');
    assert.equal(robot.parent.visible, true, 'parent fighter cannot blink away the mech');
  }
  h.advance(1.6);
  assert.equal(robot.parent.visible, true);
});
