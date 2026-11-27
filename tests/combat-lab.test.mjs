import test from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT_LAB_FIELDS, createCombatLab } from '../src/combat-lab.js';

test('combat tuning is bounded, reversible and restricted to QA sessions', () => {
  const lab = createCombatLab(true);
  const production = createCombatLab(false);
  for (const [key, field] of Object.entries(COMBAT_LAB_FIELDS)) {
    assert.equal(lab.resolve(key, true), field.base);
    assert.equal(lab.select(key, field.max), true);
    assert.equal(lab.resolve(key, true), field.max);
    assert.equal(lab.resolve(key, false), field.base);
    assert.equal(lab.select(key, field.max + 1), false);
    assert.equal(lab.select(key, NaN), false);
    assert.equal(production.select(key, field.max), false);
  }
  assert.equal(lab.select('unknown', 1), false);
  lab.reset();
  assert.deepEqual(lab.snapshot(), {});
});
