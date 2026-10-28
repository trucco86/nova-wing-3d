import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createFlyingRobot } from '../src/visuals.js';
import { updateMechaPose, selectMechaTarget } from '../src/mecha-motion.js';
import { createMechaThrusterAudio } from '../src/mecha-thruster-audio.js';
import { harness } from './harness.mjs';

function soundContext() {
  let running = 0;
  let stopped = 0;
  const ctx = {
    currentTime: 0,
    destination: {},
    state: 'running',
    createGain() {
      return { gain: { value: 0 }, connect() {}, disconnect() {} };
    },
    createOscillator() {
      return {
        frequency: {
          value: 0,
          setValueAtTime(v) {
            this.value = v;
          },
        },
        type: 'sine',
        connect() {},
        disconnect() {},
        start() {
          running++;
        },
        stop() {
          stopped++;
        },
      };
    },
  };
  return { ctx, counts: () => ({ running, stopped }) };
}

test('two independently articulated shoulders and two dorsal gimbals remain finite', () => {
  const robot = createFlyingRobot();
  const rig = robot.userData.mecha;
  assert.ok(rig.arms.right.shoulder.name.includes('right'));
  assert.ok(rig.arms.left.shoulder.name.includes('left'));
  assert.equal(rig.thrusters.length, 2);
  assert.ok(rig.thrusters.every(({ nozzle }) => nozzle.position.y > 1.6));
  robot.position.set(0, 5, 9);
  for (let i = 0; i < 80; i++)
    updateMechaPose(robot, {
      dt: 0.05,
      time: i * 0.05,
      strafe: 0.6,
      boosting: i >= 40,
      firing: i % 3 === 0,
      targetWorld: new T.Vector3(16, 12, -90),
    });
  assert.ok(Math.abs(rig.arms.right.shoulder.rotation.y) < 0.01);
  assert.ok(Math.abs(rig.arms.left.shoulder.rotation.y) > 0.02);
  assert.notEqual(rig.arms.left.shoulder.rotation.x, rig.arms.right.shoulder.rotation.x);
  assert.ok(
    rig.thrusters.every(
      ({ plume, nozzle }) =>
        Number.isFinite(plume.scale.y) && plume.scale.y > 0.4 && Number.isFinite(nozzle.rotation.y),
    ),
  );
  assert.ok(robot.getObjectByName('mecha-right-muzzle'));
  assert.ok(robot.getObjectByName('mecha-left-muzzle'));
});

test('lock target requires front cone, line of sight and weak-point preference', () => {
  const origin = new T.Vector3(0, 0, 9);
  const near = { id: 1, position: new T.Vector3(2, 0, -60) };
  const weak = { id: 2, weak: true, position: new T.Vector3(4, 0, -70) };
  const behind = { id: 3, position: new T.Vector3(0, 0, 30) };
  const outside = { id: 4, position: new T.Vector3(200, 0, -40) };
  assert.equal(selectMechaTarget(origin, [near, weak, outside, behind]), weak);
  assert.equal(
    selectMechaTarget(origin, [near, weak], {
      visible: (_, candidate) => candidate !== weak.position,
    }),
    near,
  );
  assert.equal(selectMechaTarget(origin, [behind, outside]), null);
});

test('motor uses two voices only, scales power and silences on pause or shutdown', () => {
  const { ctx, counts } = soundContext();
  const motor = createMechaThrusterAudio(ctx);
  assert.equal(counts().running, 2);
  motor.update({ dt: 0.4, active: true, boosting: false });
  const cruise = motor.snapshot().amplitude;
  motor.update({ dt: 0.4, active: true, boosting: true });
  assert.ok(motor.snapshot().amplitude > cruise);
  motor.silence();
  assert.equal(motor.snapshot().amplitude, 0);
  motor.update({ dt: 0.3, active: false });
  assert.equal(motor.snapshot().amplitude, 0);
  motor.destroy();
  motor.destroy();
  assert.equal(motor.snapshot().voices, 0);
  assert.equal(counts().stopped, 2);
});

test('mecha controls expose independent lock and clear it on switching back to ship', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.key('KeyT');
  const robot = h.game.snapshot().mecha;
  assert.equal(robot.active, true);
  assert.equal(robot.motor.voices, 2);
  assert.equal(h.elements.get('lockTouch').hidden, false);
  h.key('KeyN');
  assert.equal(h.game.snapshot().mecha.lockEnabled, true);
  h.advance(0.2);
  assert.ok(Number.isFinite(h.game.snapshot().mecha.thrustLength));
  h.advance(2.5);
  h.key('KeyT');
  assert.equal(h.game.snapshot().mecha.active, false);
  assert.equal(h.game.snapshot().mecha.lockEnabled, false);
  assert.equal(h.elements.get('lockTouch').hidden, true);
});
