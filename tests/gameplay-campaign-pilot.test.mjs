import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignFlight, campaignShopPlan } from '../tools/gameplay-campaign-pilot.mjs';

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
  shield: 100,
  initialShield: 100,
  repairReady: false,
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

test('pilot detects a nearby projectile beyond the first five observed shots', () => {
  const irrelevant = Array.from({ length: 5 }, (_, index) => [80 + index * 5, 40, -20]);
  const action = campaignFlight({
    ...state,
    player: { x: 0, y: 10 },
    hostilePositions: [...irrelevant, [0, 10, -20]],
  });
  assert.ok(action.x !== 0 || action.y !== 0);
  assert.notDeepEqual(action.target, { x: 0, y: 10 });
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

test('pilot repairs the shield when the utility is ready and the threshold is crossed', () => {
  const ready = campaignFlight({
    ...state,
    shield: 60,
    initialShield: 100,
    repairReady: true,
  });
  assert.equal(ready.repair, true);

  const healthy = campaignFlight({
    ...state,
    shield: 80,
    initialShield: 100,
    repairReady: true,
  });
  assert.equal(healthy.repair, false);

  const coolingDown = campaignFlight({
    ...state,
    shield: 40,
    initialShield: 100,
    repairReady: false,
  });
  assert.equal(coolingDown.repair, false);
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

test('shop plan repairs first and buys a balanced loadout for sector two', () => {
  const plan = campaignShopPlan({
    sector: 1,
    shield: 35,
    maxShield: 100,
    weapon: 2,
    armor: 0,
    pods: 0,
    bombs: 2,
    volley: 0,
    rapid: 0,
    scatterOwned: false,
  });
  assert.equal(plan.nextSector, 2);
  assert.deepEqual(plan.targets, {
    weapon: 3,
    armor: 1,
    pods: 1,
    bombs: 5,
    volley: 0,
    rapid: 0,
    scatterOwned: false,
  });
  assert.deepEqual(plan.priorities, ['repair', 'weapon', 'armor', 'pods', 'bombPack']);
});

test('shop plan switches to single bombs when the pack cap has been crossed', () => {
  const plan = campaignShopPlan({
    sector: 5,
    shield: 100,
    maxShield: 100,
    weapon: 4,
    armor: 2,
    pods: 2,
    bombs: 6,
    volley: 1,
    rapid: 0,
    scatterOwned: true,
  });
  assert.equal(plan.nextSector, 6);
  assert.ok(plan.priorities.includes('bomb'));
  assert.ok(!plan.priorities.includes('bombPack'));
  assert.ok(plan.priorities.includes('rapid'));
});

test('shop plan adds scatter only from sector five onward', () => {
  const early = campaignShopPlan({
    sector: 2,
    shield: 100,
    maxShield: 100,
    weapon: 3,
    armor: 1,
    pods: 1,
    bombs: 5,
    volley: 0,
    rapid: 0,
    scatterOwned: false,
  });
  const late = campaignShopPlan({
    sector: 4,
    shield: 100,
    maxShield: 100,
    weapon: 4,
    armor: 2,
    pods: 2,
    bombs: 6,
    volley: 1,
    rapid: 0,
    scatterOwned: false,
  });
  assert.ok(!early.priorities.includes('scatter'));
  assert.ok(late.priorities.includes('scatter'));
});

test('asteroid pilot does not transform before a fissure is visible', () => {
  const action = campaignFlight({
    ...state,
    sector: 3,
    player: { x: 0, y: 10 },
    mecha: { active: false, lockEnabled: false },
    energy: 100,
    asteroidInterior: {
      phase: 'transition',
      course: { offset: 0, obstacles: [] },
    },
    asteroidHull: {
      ship: { x: 5, y: 4, z: 2 },
      robot: { x: 2.2, y: 3, z: 1.8 },
      current: { x: 5, y: 4, z: 2 },
    },
  });
  assert.equal(action.transform, null);
  assert.equal(action.rollHeld, false);
  assert.ok(Math.hypot(action.target.x, action.target.y - 10) <= 24);
});

test('physical fissure clearance outranks multiple visible projectile threats', () => {
  const fissures = [-29, 29].map((x) => ({
    kind: 'fissure',
    x,
    y: 10,
    baseZ: -850,
    z: -90,
    hx: 18.2,
    hy: 36,
    hz: 18,
  }));
  const previous = {
    ...state,
    sector: 3,
    seconds: 10,
    player: { x: 9, y: 15 },
    playerDepth: 9,
    pilotTarget: { x: 9, y: 15 },
    asteroidInterior: { phase: 'interior', course: { offset: 746, obstacles: fissures } },
    asteroidHull: { current: { x: 4.9, y: 6, z: 2.9 } },
    hostilePositions: [],
  };
  const current = {
    ...previous,
    seconds: 10.25,
    asteroidInterior: { phase: 'interior', course: { offset: 760, obstacles: fissures } },
    hostilePositions: [
      [0, 10, 0],
      [0, 10, -5],
      [2, 12, -8],
      [-2, 8, -10],
    ],
  };
  const action = campaignFlight(current, previous);
  assert.equal(action.rollHeld, true, 'ship must stay banked while the fissure is in approach range');
  assert.equal(action.transform, null, 'do not transform out of the ship during a fissure pass');
  assert.equal(action.reason, 'evade-visible-threat');
  assert.equal(action.target.x, 0, 'pilot must keep the robot inside the physical fissure gap');
  assert.equal(action.x, -1, 'real steering input must move the pilot toward the clear corridor');
});

test('asteroid pilot predicts moving course solids and chooses a clear corridor lane', () => {
  const previous = {
    ...state,
    sector: 3,
    seconds: 10,
    player: { x: 0, y: 10 },
    asteroidInterior: {
      phase: 'interior',
      course: {
        offset: -10,
        obstacles: [{ kind: 'rock', x: 0, y: 10, baseZ: -30, z: -40, hx: 8, hy: 8, hz: 12 }],
      },
    },
    asteroidHull: { current: { x: 2, y: 2.5, z: 2 } },
  };
  const current = {
    ...state,
    sector: 3,
    seconds: 11,
    player: { x: 0, y: 10 },
    asteroidInterior: {
      phase: 'interior',
      course: {
        offset: 0,
        obstacles: [{ kind: 'rock', x: 0, y: 10, baseZ: -30, z: -30, hx: 8, hy: 8, hz: 12 }],
      },
    },
    asteroidHull: { current: { x: 2, y: 2.5, z: 2 } },
  };
  const action = campaignFlight(current, previous);
  assert.equal(action.reason, 'evade-asteroid-course');
  assert.ok(Math.hypot(action.target.x, action.target.y - 10) <= 24);
  assert.ok(action.x !== 0 || action.y !== 0);
});


test('asteroid pilot returns to ship before banking when already in robot mode', () => {
  const action = campaignFlight({
    ...state,
    sector: 3,
    seconds: 10,
    player: { x: 0, y: 10 },
    mecha: { active: true, lockEnabled: false },
    asteroidInterior: {
      phase: 'interior',
      course: {
        offset: 760,
        obstacles: [{ kind: 'fissure', x: -29, y: 10, baseZ: -850, z: -90, hx: 18.2, hy: 36, hz: 18 }],
      },
    },
    asteroidHull: { current: { x: 4.9, y: 6, z: 2.9 } },
  });
  assert.equal(action.transform, 'ship');
  assert.equal(action.rollHeld, false, 'bank only after the ship transformation completes');
});

test('asteroid pilot returns to ship after the cavern escape phase', () => {
  const action = campaignFlight({
    ...state,
    sector: 3,
    mecha: { active: true, lockEnabled: false },
    asteroidInterior: { phase: 'escape', course: { offset: 2100, obstacles: [] } },
  });
  assert.equal(action.transform, 'ship');
});
