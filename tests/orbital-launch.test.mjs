import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { ORBITAL_LAUNCH, createOrbitalLaunch } from '../src/orbital-launch.js';
import { createObstacle } from '../src/encounters.js';
import {
  launchOrbitReady,
  projectileHitsObstacle,
  projectileHitsApproachingObstacle,
} from '../src/flight.js';

test('boost is mandatory; depletion triggers a long atmospheric ascent', (t) => {
  const launch = createOrbitalLaunch();
  for (let seconds = 1; seconds <= 150; seconds++)
    launch.advance({ seconds, dt: 1, boosting: false, chargeBefore: 100, chargeAfter: 100 });
  assert.equal(launch.snapshot().phase, 'boost');
  assert.equal(launch.snapshot().amount, 0);
  assert.equal(launch.snapshot().complete, false);

  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  h.advance(24);
  assert.equal(h.game.snapshot().orbitalLaunch.phase, 'boost');
  assert.equal(h.game.snapshot().orbitalLaunch.amount, 0);
  h.key('ShiftLeft', true);
  h.advance(3.5);
  h.key('ShiftLeft', false);
  const exhausted = h.game.snapshot();
  assert.equal(exhausted.orbitalLaunch.phase, 'atmosphere');
  assert.ok(exhausted.orbitalLaunch.exhaustedAt <= 5, 'BOOST must have exhausted');
  assert.ok(exhausted.orbitalLaunch.amount >= ORBITAL_LAUNCH.boostClimbFraction);
  assert.ok(exhausted.orbitalLaunch.amount < 0.28, 'the coasting transition has only just begun');
  h.advance(19);
  const halfway = h.game.snapshot();
  assert.equal(halfway.orbitalLaunch.phase, 'atmosphere');
  assert.ok(halfway.orbitalLaunch.amount > 0.5);
  assert.ok(halfway.orbitalLaunch.amount < 1);
  h.advance(20);
  assert.equal(h.game.snapshot().orbitalLaunch.phase, 'orbit');
  assert.equal(h.game.snapshot().orbitalLaunch.complete, true);
  assert.equal(launchOrbitReady(h.game.snapshot().orbitalLaunch.amount), true);
});

test('orbital ship, satellite arrays, wreckage and urban beams block fast shots', () => {
  for (const kind of ['carrier', 'satellite', 'debris']) {
    const o = createObstacle(kind);
    assert.ok(o.userData.solids.length > 0);
    assert.ok(new T.Box3().setFromObject(o).getSize(new T.Vector3()).length() > 20);
  }
  const fire = (x, y, kind, travel = 0) =>
    projectileHitsObstacle(
      new T.Vector3(x, y, 30),
      new T.Vector3(x, y, -30),
      createObstacle(kind),
      travel,
    );
  assert.equal(fire(15, 15, 'satellite'), true, 'solar panel is a solid');
  assert.equal(fire(15, 35, 'satellite'), false, 'above panels is safe');
  assert.equal(fire(0, 14, 'carrier'), true, 'hull blocks shots');
  assert.equal(fire(0, 40, 'carrier'), false, 'ship is escapable above');
  assert.equal(fire(0, 14, 'carrier', 16), true, 'moving hull does not permit tunneling');
  assert.equal(fire(0, 29, 'gantry'), true, 'urban overhead beam blocks shots');
});

test('shots cannot hurt targets behind solid obstacles before obstacles advance', () => {
  const gantry = createObstacle('gantry');
  gantry.position.set(0, 0, 0);
  const start = new T.Vector3(0, 29, 40);
  const end = new T.Vector3(0, 29, -35);
  assert.equal(
    projectileHitsApproachingObstacle(start, end, gantry, 20),
    true,
    'incoming ally shot must be stopped before the target behind the beam',
  );
  assert.equal(
    projectileHitsApproachingObstacle(end, start, gantry, -20),
    true,
    'hostile shot must be stopped before it can damage a player behind a wall',
  );
  const high = new T.Vector3(0, 55, 40);
  assert.equal(
    projectileHitsApproachingObstacle(high, new T.Vector3(0, 55, -35), gantry, 20),
    false,
    'open corridor above the obstacle must not block shots',
  );
  const satellite = createObstacle('satellite');
  satellite.position.set(0, 0, -10);
  assert.equal(
    projectileHitsApproachingObstacle(
      new T.Vector3(15, 15, 15),
      new T.Vector3(15, 15, -45),
      satellite,
      14,
    ),
    true,
    'fast projectiles must not tunnel through moving solar panels',
  );
});

test('urban hazards stop after BOOST-powered orbit; space hazards replace them', (t) => {
  const h = harness({ spawnEncounters: true });
  t.after(() => h.close());
  h.game.start();
  let cityObjectSeen = false;
  let spaceObjectSeen = false;
  for (let i = 0; i < 24; i++) {
    h.game.collect('shield');
    h.advance(1);
    if (h.game.snapshot().obstacleKinds.some((k) => ['gantry', 'reactor'].includes(k)))
      cityObjectSeen = true;
  }
  assert.equal(h.game.snapshot().orbitalLaunch.amount, 0);
  h.key('ShiftLeft', true);
  h.advance(3.5);
  h.key('ShiftLeft', false);
  assert.equal(h.game.snapshot().orbitalLaunch.phase, 'atmosphere');
  for (let i = 0; i < 52; i++) {
    h.game.collect('shield');
    h.advance(1);
    const state = h.game.snapshot();
    if (
      state.orbitalLaunch.amount > 0.7 &&
      state.obstacleKinds.some((k) => ['carrier', 'satellite', 'debris'].includes(k))
    )
      spaceObjectSeen = true;
    assert.equal(state.tunnel, false, 'industrial tunnel is not part of orbital ascent');
  }
  assert.ok(cityObjectSeen, 'urban hazards are retained in the city');
  assert.ok(spaceObjectSeen, 'spacecraft and satellites replace urban hazards in orbit');
  assert.equal(
    h.game.snapshot().obstacleKinds.some((k) => ['gantry', 'reactor'].includes(k)),
    false,
  );
});
