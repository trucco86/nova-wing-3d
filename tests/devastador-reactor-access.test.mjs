import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVASTADOR_REACTOR_SECTOR,
  DEVASTADOR_ACCESS_MODULES,
  DEVASTADOR_ACCESS_THRESHOLD,
  reactorModulesComplete,
  shouldEnterDevastadorReactorAccess,
} from '../src/devastador-reactor-access.js';

test('Devastador stage 04 has exactly three distinct activation modules', () => {
  assert.equal(DEVASTADOR_REACTOR_SECTOR, 3);
  assert.equal(DEVASTADOR_ACCESS_MODULES.length, 3);
  assert.deepEqual(
    DEVASTADOR_ACCESS_MODULES.map((item) => item.name),
    ['CIRCUITOS', 'REFRIGERAÇÃO', 'MOTORES'],
  );
  assert.ok(DEVASTADOR_ACCESS_MODULES.every(({ id }) => typeof id === 'string'));
  assert.equal(new Set(DEVASTADOR_ACCESS_MODULES.map(({ id }) => id)).size, 3);
  assert.ok(DEVASTADOR_ACCESS_THRESHOLD > 0.5 && DEVASTADOR_ACCESS_THRESHOLD < 1);
});

test('reactor remains locked until exactly the three genuine modules are active', () => {
  const ids = DEVASTADOR_ACCESS_MODULES.map(({ id }) => id);
  assert.equal(reactorModulesComplete([]), false);
  assert.equal(reactorModulesComplete(ids.slice(0, 2)), false);
  assert.equal(reactorModulesComplete([ids[0], ids[0], ids[1]]), false);
  assert.equal(reactorModulesComplete([...ids, 'unknown']), false);
  assert.equal(reactorModulesComplete([ids[0], ids[1], 'unknown']), false);
  assert.equal(reactorModulesComplete(null), false);
  assert.equal(reactorModulesComplete(ids), true);
  assert.equal(reactorModulesComplete([...ids].reverse()), true);
});

test('only regular stage four flight pauses for the embedded reactor access', () => {
  const base = {
    sector: 3,
    elapsed: 80,
    duration: 100,
    completed: false,
    active: false,
    boss: false,
    subbossActive: false,
    dynamicFlight: true,
    encounter: 'stage',
  };
  assert.equal(shouldEnterDevastadorReactorAccess(base), true);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, elapsed: 61 }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, sector: 2 }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, sector: 4 }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, completed: true }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, active: true }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, boss: true }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, subbossActive: true }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, encounter: 'boss' }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, encounter: 'subboss' }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, dynamicFlight: false }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, duration: NaN }), false);
  assert.equal(shouldEnterDevastadorReactorAccess({ ...base, elapsed: Infinity }), false);
});
