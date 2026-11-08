import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  ASTEROID_COURSE,
  createAsteroidCourse,
  measurePilotHull,
  projectPilotHull,
  rockSweep,
} from '../src/asteroid-course.js';
import { fighter, createFlyingRobot } from '../src/visuals.js';

const chassis = fighter();
const ship = measurePilotHull(chassis);
const flat = projectPilotHull(ship, new T.Euler());
const bank = projectPilotHull(ship, new T.Euler(0, 0, -Math.PI / 2));
const pilot = { x: 0, y: 10, z: 9 };
function setup() {
  const scene = new T.Scene();
  const course = createAsteroidCourse(scene);
  course.setPhase('transition');
  return { scene, course };
}

test('real chassis projection swaps wing width for height without shrinking the hull', () => {
  assert.ok(flat.x > 4 && flat.y < 2.6);
  assert.ok(Math.abs(bank.x - flat.y) < 1e-9);
  assert.ok(Math.abs(bank.y - flat.x) < 1e-9);
  const halfway = projectPilotHull(ship, new T.Euler(0, 0, -Math.PI / 4));
  assert.ok(halfway.x > bank.x && halfway.y > flat.y);
  assert.ok(projectPilotHull(ship, new T.Euler(), 1.12).x > flat.x);
});

test('flat wings stop at the visible fissure; banking permits recovery and traversal', () => {
  const { course } = setup();
  assert.equal(course.advance(1000, pilot, flat).collided, true);
  const stopped = course.snapshot().offset;
  assert.ok(stopped > 800 && stopped < 850);
  assert.equal(course.advance(10, pilot, flat).distance, 0);
  assert.equal(course.advance(100, pilot, bank).collided, false);
  assert.ok(course.snapshot().offset > stopped + 99);
  course.destroy();
});

test('boost cannot tunnel through rock at 30, 60 or 120 Hz', () => {
  const offsets = [];
  for (const hz of [30, 60, 120]) {
    const { course } = setup();
    for (let i = 0; i < hz * 12; i++) course.advance(90 / hz, pilot, flat);
    offsets.push(course.snapshot().offset);
    course.destroy();
  }
  assert.ok(Math.max(...offsets) - Math.min(...offsets) < 0.002);
});

test('robot cannot inherit ship banking clearance; transformation envelope is detectable', () => {
  const { course } = setup();
  const robot = measurePilotHull(createFlyingRobot());
  assert.equal(course.advance(850, pilot, projectPilotHull(robot, new T.Euler())).collided, true);
  course.reset();
  course.advance(850, pilot, bank);
  assert.equal(course.overlaps(pilot, flat), true);
  assert.equal(course.overlaps(pilot, bank), false);
  course.destroy();
});

test('lateral sweep stops at rock without teleport, and sliding away remains possible', () => {
  const { course } = setup();
  course.advance(850, pilot, bank);
  const contact = course.constrain(pilot, { ...pilot, x: 20 }, bank);
  assert.equal(contact.collided, true);
  assert.ok(contact.x >= 0 && contact.x < 1);
  const recovery = course.constrain(contact, pilot, bank);
  assert.equal(recovery.collided, false);
  assert.equal(recovery.x, 0);
  course.destroy();
});

test('central fragment has free routes on both sides and blocks shots only at its rock', () => {
  const fragment = ASTEROID_COURSE[2];
  const from = { x: 0, y: 10, z: -1100 };
  const to = { ...from, z: -1250 };
  assert.notEqual(rockSweep(from, to, fragment, flat), null);
  for (const x of [-16, 16])
    assert.equal(rockSweep({ ...from, x }, { ...to, x }, fragment, flat), null);
  const { course } = setup();
  assert.equal(course.projectileBlocked(from, to), true);
  assert.equal(course.projectileBlocked({ ...from, x: 16 }, { ...to, x: 16 }), false);
  course.destroy();
});

test('pause, reset and boss visibility keep collision and scene lifecycle aligned', () => {
  const { scene, course } = setup();
  course.advance(500, pilot, bank);
  const before = course.snapshot();
  course.advance(0, pilot, bank);
  assert.deepEqual(course.snapshot(), before);
  course.reset();
  assert.equal(course.snapshot().offset, 0);
  assert.equal(scene.getObjectByName('asteroid-physical-course').position.z, 0);
  course.setPhase('boss');
  assert.equal(scene.getObjectByName('asteroid-physical-course').visible, false);
  assert.equal(course.projectileBlocked({ x: 20, y: 10, z: 0 }, { x: 20, y: 10, z: -1000 }), false);
  course.destroy();
  assert.equal(scene.children.length, 0);
});

test('each rendered rock has exactly the authored collision dimensions and position', () => {
  const { scene, course } = setup();
  const rocks = scene.getObjectByName('asteroid-course-rocks');
  const matrix = new T.Matrix4();
  for (let i = 0; i < ASTEROID_COURSE.length; i++) {
    const r = ASTEROID_COURSE[i];
    rocks.getMatrixAt(i, matrix);
    rocks.geometry.computeBoundingBox();
    const bounds = rocks.geometry.boundingBox.clone().applyMatrix4(matrix);
    for (const axis of ['x', 'y', 'z']) {
      assert.ok(Math.abs(bounds.min[axis] - (r[axis] - r['h' + axis])) < 1e-4);
      assert.ok(Math.abs(bounds.max[axis] - (r[axis] + r['h' + axis])) < 1e-4);
    }
  }
  course.destroy();
});
