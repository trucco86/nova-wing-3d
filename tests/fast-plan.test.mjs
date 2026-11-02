test('FAST includes orbit, living depth and premium boss regressions even if only sources changed', () => {
  const orbit = selectFastTests(['src/reactor-orbit-presentation.js'], 'auto', () => true);
  assert.deepEqual(orbit.areas, ['core', 'stage4']);
  assert.ok(orbit.tests.includes('tests/reactor-orbit-presentation.test.mjs'));

  const living = selectFastTests(['src/living-world-depth.js'], 'auto', () => true);
  assert.deepEqual(living.areas, ['core', 'graphics']);
  assert.ok(living.tests.includes('tests/living-world-depth.test.mjs'));

  const bosses = selectFastTests(['src/boss-kinetic-details.js', 'src/bosses.js'], 'auto', () => true);
  assert.deepEqual(bosses.areas, ['core', 'graphics']);
  assert.ok(bosses.tests.includes('tests/boss-kinetic-details.test.mjs'));
  assert.ok(bosses.tests.includes('tests/flight-environments.test.mjs'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { selectFastTests, fastAreasForFiles } from '../tools/fast-plan.mjs';
import { AGENT_AREAS, excerptForSymbol, makeAgentBrief } from '../tools/agent-brief.mjs';

test('FAST impact selection includes stage 4 and gameplay baseline without silently skipping changed tests', () => {
  const files = [
    'src/devastador-grand-hall.js',
    'src/styles.css',
    'tests/custom-regression.test.mjs',
  ];
  const result = selectFastTests(files, 'auto', () => true);
  assert.deepEqual(fastAreasForFiles(files), ['core', 'stage4', 'graphics', 'mobile']);
  assert.ok(result.tests.includes('tests/campaign.test.mjs'));
  assert.ok(result.tests.includes('tests/devastador-grand-hall.test.mjs'));
  assert.ok(result.tests.includes('tests/input-title.test.mjs'));
  assert.ok(result.tests.includes('tests/custom-regression.test.mjs'));
});

test('FAST scope rejects unknown areas and keeps baseline when diff is unavailable', () => {
  assert.deepEqual(fastAreasForFiles([]), ['core']);
  assert.deepEqual(selectFastTests([], 'auto', () => true).areas, ['core']);
  assert.throws(() => selectFastTests([], 'break-release', () => true), /Unknown scope/);
  assert.ok(selectFastTests(['README.md'], 'stage4', () => true).tests.length > 0);
  assert.equal(selectFastTests([], 'core', () => false).tests.length, 0);
});

test('agent brief uses bounded symbol excerpts instead of printing entire huge source', () => {
  const huge = 'header\n'.repeat(25000) + 'function criticalStep() {\n  return 42;\n}\n';
  const brief = makeAgentBrief({
    area: 'stage4',
    symbol: 'criticalStep',
    budget: 3300,
    has: () => true,
    load: () => huge,
    status: ' M src/game.js',
  });
  assert.ok(brief.length <= 3300);
  assert.ok(brief.includes('criticalStep'));
  assert.ok(!brief.includes('header\nheader\nheader\nheader'));
  assert.ok(brief.includes('M src/game.js'));
  assert.ok(AGENT_AREAS.pipeline.files.includes('.github/workflows/ci.yml'));
  assert.match(excerptForSymbol('one\ntwo\nthree', 'two'), /2: two/);
  assert.throws(() => makeAgentBrief({ area: 'unknown' }), /Unknown agent area/);
});
