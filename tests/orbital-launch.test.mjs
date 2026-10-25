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

test('launch gate consistently switches to orbit only after city departure', () => {
  assert.equal(SECTORS[0].duration, 145);
  assert.equal(launchOrbitReady(launchAmount(40, 145)), false);
  assert.equal(launchOrbitReady(launchAmount(110, 145)), true);
  assert.equal(launchOrbitReady(launchAmount(0, 0)), false);
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

test('city hazards stop at launch and no extra obstacles spawn during first subboss', (t) => {
  const h = harness({ spawnEncounters: true });
  t.after(() => h.close());
  h.game.start();
  let cityObjectSeen = false;
  let subbossSeen = false;
  let orbitalCompletionSeen = false;
  for (let i = 0; i < 74; i++) {
    h.game.collect('shield');
    if (i === 23) h.key('ShiftLeft');
    if (i === 28) h.key('ShiftLeft', false);
    h.advance(1);
    const state = h.game.snapshot();
    if (i < 35 && state.obstacleKinds.some((k) => ['gantry', 'reactor'].includes(k)))
      cityObjectSeen = true;
    if (state.encounterKinds.includes('subboss')) subbossSeen = true;
    if (state.orbitalLaunch.complete) orbitalCompletionSeen = true;
    if (i >= 60 && state.encounterKinds.includes('subboss')) {
      assert.equal(state.obstacleKinds.length, 0, 'no competing obstacle while subboss is alive');
    }
    assert.equal(state.tunnel, false, 'industrial tunnel is not part of orbital ascent');
  }
  assert.ok(cityObjectSeen, 'urban hazards are retained in the city');
  assert.ok(subbossSeen, 'the first subboss still spawns');
  assert.ok(orbitalCompletionSeen, 'the boost-powered ascent completes');
  // Space props resume once the subboss is defeated; the fight itself stays clear.
  assert.equal(
    h.game.snapshot().obstacleKinds.some((k) => ['gantry', 'reactor'].includes(k)),
    false,
  );
});
