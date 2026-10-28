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

test('sector-directed perspective changes are bounded and preserve boss readability', () => {
  const signatures = new Set();
  for (let i = 0; i < 10; i++) {
    const sequence = [0.05, 0.18, 0.26, 0.35, 0.46, 0.56, 0.68, 0.85, 0.99].map((part) =>
      stagePerspectiveAt(i, part * 100, 100),
    );
    signatures.add(sequence.join(','));
    assert.equal(stagePerspectiveAt(i, 0, 100), 'chase');
    assert.equal(stagePerspectiveAt(i, 100, 100), 'chase');
    assert.equal(stagePerspectiveAt(i, 35, 100, true), 'chase');
    assert.ok(sequence.some((mode) => mode !== 'chase'));
  }
  assert.ok(signatures.size >= 8, 'each environment should have a different shot language');
  assert.equal(stagePerspectiveAt(3, 30, 0), 'chase');
});
