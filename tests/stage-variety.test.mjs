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

test('camera changes are mission mechanics, never arbitrary time cuts', () => {
  for (let sector = 0; sector < 10; sector++) {
    for (const progress of [0, 0.15, 0.25, 0.35, 0.47, 0.7, 0.99]) {
      const shot = stagePerspectiveAt(sector, progress * 100, 100);
      if (sector === 7 && progress === 0.47) assert.equal(shot, 'overhead');
      else assert.equal(shot, 'chase', 'noninteractive cut in sector ' + sector);
    }
    assert.equal(stagePerspectiveAt(sector, 47, 100, true), 'chase');
  }
  assert.equal(stagePerspectiveAt(7, 47, 0), 'chase');
});
