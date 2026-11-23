import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reactorCinematicPose,
  reactorGateStatus,
  REACTOR_ARRIVAL_SECONDS,
  REACTOR_DEPARTURE_SECONDS,
} from '../src/reactor-access-cinematic.js';
import { createOrbit9MotionFilter } from '../src/orbit9-locomotion.js';

test('QA179 gate reports lock and three distinct module states before the boss', () => {
  for (let i = 0; i < 3; i++) {
    const gate = reactorGateStatus(i);
    assert.equal(gate.locked, true);
    assert.equal(gate.activated, i);
    assert.match(gate.text, /PORTÃO BLOQUEADO/);
  }
  assert.equal(reactorGateStatus(3).locked, false);
  assert.match(reactorGateStatus(3).text, /TÚNEL DO REATOR/);
  assert.equal(reactorGateStatus(9).activated, 3);
});
test('QA179 3D arrival and reboarding remain INSIDE the same carrier tunnel, not open space', () => {
  const intro = reactorCinematicPose('arrival', 0);
  const dock = reactorCinematicPose('arrival', REACTOR_ARRIVAL_SECONDS);
  assert.ok(intro.eye.z > dock.eye.z);
  assert.equal(dock.complete, true);
  const departure = reactorCinematicPose('departure', 0);
  const gate = reactorCinematicPose('departure', REACTOR_DEPARTURE_SECONDS);
  assert.ok(departure.ship.z > gate.ship.z);
  assert.ok(departure.eye.z > gate.eye.z);
  assert.equal(gate.complete, true);
  for (const pose of [intro, dock, departure, gate]) {
    assert.ok(pose.eye.z >= -12 && pose.eye.z <= 40, 'camera stays in authored corridor');
    assert.ok(pose.aim.z >= -46 && pose.aim.z < 0, 'camera points to interior gate/ship');
    assert.ok(pose.ship.z >= -25 && pose.ship.z <= 20);
  }
});
test('QA179 motion eases acceleration/deceleration, resets and stops at actual collision', () => {
  const motion = createOrbit9MotionFilter();
  const first = motion.update(1, 0, 0.016);
  assert.ok(first.x > 0 && first.x < 1);
  for (let i = 0; i < 32; i++) motion.update(1, 0, 0.016);
  const running = motion.snapshot();
  assert.ok(running.x > 0.95);
  const braking = motion.update(0, 0, 0.016);
  assert.ok(braking.x < running.x && braking.x > 0);
  motion.stopBlockedAxes(0, 0, 0.016);
  assert.equal(motion.snapshot().x, 0);
  motion.reset();
  assert.deepEqual(motion.snapshot(), { x: 0, z: 0 });
});
