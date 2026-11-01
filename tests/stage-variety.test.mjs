import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageVisualAt, stagePerspectiveAt, STAGE_VISUALS } from '../src/stage-variety.js';

test('ten visually independent destinations, Earth only at launch and no universal cracked moon', () => {
  assert.equal(STAGE_VISUALS.length, 10);
  assert.equal(new Set(STAGE_VISUALS.map((p) => p.location)).size, 10);
  assert.equal(STAGE_VISUALS.filter((p) => p.globe === 'earth').length, 1);
  assert.equal(STAGE_VISUALS.filter((p) => p.globe === 'fractured-moon').length, 1);
  assert.equal(STAGE_VISUALS.filter((p) => p.globe === 'ice-world').length, 1);
  assert.equal(new Set(STAGE_VISUALS.map((p) => p.encounter)).size, 10);
  assert.equal(stageVisualAt(9).location, 'marvin-fortress');
  assert.throws(() => stageVisualAt(10), RangeError);
});

test('perspectives require an authored gameplay objective, not arbitrary timestamps', () => {
  for (let sector = 0; sector < 10; sector++) {
    for (const time of [0, 20, 35, 60, 95]) {
      assert.equal(stagePerspectiveAt(sector, time, 100), 'chase');
    }
  }
  assert.equal(stagePerspectiveAt(3, 44, 100, false, { mission: 'reactor-grid' }), 'overhead');
  assert.equal(stagePerspectiveAt(2, 55, 100, false, { mission: 'asteroid-escape' }), 'combat');
  assert.equal(stagePerspectiveAt(3, 44, 100, true, { mission: 'reactor-grid' }), 'chase');
  assert.equal(stagePerspectiveAt(3, 44, 0, false, { mission: 'reactor-grid' }), 'chase');
  assert.equal(stagePerspectiveAt(3, Number.NaN, 100, false, { mission: 'reactor-grid' }), 'chase');
});
