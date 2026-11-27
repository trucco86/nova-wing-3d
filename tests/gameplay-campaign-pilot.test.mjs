import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignFlight } from '../tools/gameplay-campaign-pilot.mjs';

const state = {
  state: 'playing',
  player: { x: 0, y: 6 },
  playerDepth: 9,
  seconds: 0,
  orbitalLaunch: { phase: 'city' },
  flightBounds: { horizontal: 72, minY: -1, maxY: 46 },
  cityPhysicalSolids: [],
  cityFallingSolids: [],
  cityHazardSolids: [],
  hostilePositions: [],
  targets: [],
  energy: 0,
  bombs: 0,
  mecha: { active: false, lockEnabled: false },
  strategy: { arcana: 0 },
  fiveCats: { plasmaCooldown: Infinity, overdriveCooldown: Infinity },
};

test('pilot holds the real boost gate and does not fire during cinematics', () => {
  const boost = campaignFlight({
    ...state,
    player: { x: 0, y: 10 },
    orbitalLaunch: { phase: 'boost' },
  });
  assert.equal(boost.boost, true);
  assert.equal(boost.fire, true);
  assert.equal(campaignFlight({ ...state, launchCinematic: true }).fire, false);
  assert.equal(campaignFlight({ ...state, state: 'respawning' }).fire, false);
  assert.equal(campaignFlight({ ...state, boss: true }).fire, false);
});

test('pilot selects a stable central lane instead of sweeping across the city', () => {
  const action = campaignFlight(state);
  assert.equal(action.x, 0);
  assert.equal(action.y, 1);
  assert.deepEqual(action.target, { x: 0, y: 10 });
  assert.equal(action.fire, true);
  assert.equal(action.boost, false);
});

test('pilot uses a controlled lateral orbit outside the city', () => {
  const action = campaignFlight({
    ...state,
    seconds: 35,
    player: { x: 0, y: 10 },
    orbitalLaunch: { phase: 'orbit' },
  });
  assert.notEqual(action.target.x, 0);
  assert.ok(Math.abs(action.target.x) <= 22);
});

test('pilot evades nearby hostile projectiles before velocity can be inferred', () => {
  const action = campaignFlight({
    ...state,
    player: { x: 0, y: 10 },
    hostilePositions: [[0, 10, -20]],
  });
  assert.ok(action.x !== 0 || action.y !== 0);
  assert.notDeepEqual(action.target, { x: 0, y: 10 });
});

test('pilot avoids active visible city solids using their real collision footprint', () => {
  const action = campaignFlight({
    ...state,
    player: { x: 0, y: 10 },
    cityPhysicalSolids: [
      {
        active: true,
        x: 0,
        y: 10,
        z: -60,
        halfX: 10,
        halfY: 8,
        halfZ: 12,
      },
    ],
  });
  assert.notDeepEqual(action.target, { x: 0, y: 10 });
  assert.ok(action.x !== 0 || action.y !== 0);
});

test('pilot ignores inactive and already-passed city solids', () => {
  const action = campaignFlight({
    ...state,
    player: { x: 0, y: 10 },
    cityPhysicalSolids: [
      { active: false, x: 0, y: 10, z: -60, halfX: 10, halfY: 8, halfZ: 12 },
      { active: true, x: 0, y: 10, z: 40, halfX: 10, halfY: 8, halfZ: 5 },
    ],
  });
  assert.deepEqual(action.target, { x: 0, y: 10 });
  assert.equal(action.x, 0);
  assert.equal(action.y, 0);
});

test('pilot predicts incoming hostile projectiles and leaves their impact lane', () => {
  const previous = {
    seconds: 10,
    player: { x: 0, y: 10 },
    playerDepth: 9,
    hostilePositions: [[0, 10, -20]],
  };
  const current = {
    ...state,
    seconds: 11,
    player: { x: 0, y: 10 },
    playerDepth: 9,
    hostilePositions: [[0, 10, -10]],
  };
  const action = campaignFlight(current, previous);
  assert.ok(action.x !== 0 || action.y !== 0);
  assert.notDeepEqual(action.target, { x: 0, y: 10 });
});

test('pilot changes lane after a real city collision instead of repeating it', () => {
  const previous = {
    ...state,
    player: { x: 0, y: 10 },
    cityImpactCount: 0,
  };
  const current = {
    ...state,
    player: { x: 0, y: 10 },
    cityImpactCount: 1,
  };
  const action = campaignFlight(current, previous);
  assert.ok(action.x !== 0 || action.y !== 0);
});

test('pilot uses bombs, robot transformation, multi-lock and squad specials against a subboss', () => {
  const subboss = {
    ...state,
    energy: 100,
    bombs: 2,
    strategy: { arcana: 75 },
    fiveCats: { plasmaCooldown: 0, overdriveCooldown: 20 },
    targets: [{ kind: 'subboss', x: 0, y: 10, z: -50, charging: false }],
  };
  const approach = campaignFlight(subboss);
  assert.equal(approach.bomb, true);
  assert.equal(approach.transform, 'robot');
  assert.equal(approach.special, 'plasma');
  assert.equal(approach.multiLock, false);

  const robot = campaignFlight({
    ...subboss,
    mecha: { active: true, lockEnabled: false },
  });
  assert.equal(robot.transform, null);
  assert.equal(robot.multiLock, true);

  const departure = campaignFlight({
    ...state,
    mecha: { active: true, lockEnabled: false },
  });
  assert.equal(departure.transform, 'ship');
  assert.equal(departure.multiLock, false);
});

test('pilot avoids authoritative city hazards with their actual collision bounds', () => {
  const action = campaignFlight({
    ...state,
    player: { x: 0, y: 10 },
    cityHazardSolids: [
      {
        kind: 'falling-facade',
        active: true,
        solid: true,
        x: 0,
        y: 10,
        z: -60,
        halfX: 10,
        halfY: 8,
        halfZ: 12,
        previousX: 0,
        previousY: 10,
        previousZ: -60,
      },
    ],
  });
  assert.notDeepEqual(action.target, { x: 0, y: 10 });
  assert.equal(action.reason, 'evade-city-hazard');
});

test('pilot predicts a moving city hazard before it reaches the ship', () => {
  const previous = {
    ...state,
    seconds: 10,
    player: { x: 0, y: 10 },
    pilotTarget: { x: 0, y: 10 },
  };
  const current = {
    ...state,
    seconds: 11,
    player: { x: 0, y: 10 },
    cityHazardSolids: [
      {
        kind: 'moving-train',
        active: true,
        solid: true,
        x: 0,
        y: 10,
        z: -30,
        halfX: 13,
        halfY: 7,
        halfZ: 21,
        previousX: 0,
        previousY: 10,
        previousZ: -90,
      },
    ],
  };
  const action = campaignFlight(current, previous);
  assert.equal(action.reason, 'evade-city-hazard');
  assert.ok(action.x !== 0 || action.y !== 0);
});
