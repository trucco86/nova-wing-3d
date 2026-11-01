import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCATTER_CADENCE_FACTOR,
  SCATTER_LIFETIME,
  SCATTER_PELLETS,
  SCATTER_PRICE,
  readScatterLoadout,
  scatterDamageFactor,
  scatterPellets,
} from '../src/scatter-cannon.js';

test('scatter cannon emits five distinct symmetric trajectories', () => {
  const pellets = scatterPellets();
  assert.equal(pellets.length, SCATTER_PELLETS);
  assert.deepEqual(
    pellets.map((p) => p.drift),
    [-24, -12, 0, 12, 24],
  );
  assert.deepEqual(
    pellets.map((p) => p.offset),
    [-1.1, -0.55, 0, 0.55, 1.1],
  );
  assert.ok(SCATTER_LIFETIME < 1);
  assert.ok(SCATTER_CADENCE_FACTOR > 1);
  assert.equal(SCATTER_PRICE, 420);
});

test('scatter pellet damage falls with travel distance and remains bounded', () => {
  const close = scatterDamageFactor(0);
  const medium = scatterDamageFactor(85);
  const far = scatterDamageFactor(190);
  assert.ok(close > medium && medium > far);
  assert.equal(close, 0.46);
  assert.equal(far, 0.18);
  assert.equal(scatterDamageFactor(Number.NaN), 0.18);
  assert.equal(scatterDamageFactor(-50), close);
});

test('legacy saves never equip an unpurchased weapon', () => {
  assert.deepEqual(readScatterLoadout(null), { owned: false, mode: 'pulse' });
  assert.deepEqual(readScatterLoadout({ fireMode: 'scatter' }), {
    owned: false,
    mode: 'pulse',
  });
  assert.deepEqual(readScatterLoadout({ scatterOwned: true, fireMode: 'scatter' }), {
    owned: true,
    mode: 'scatter',
  });
  assert.deepEqual(readScatterLoadout({ scatterOwned: true, fireMode: 'unknown' }), {
    owned: true,
    mode: 'pulse',
  });
});
