import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectBossPatterns } from '../tools/gameplay-boss-pattern-observer.mjs';

const route = (kinds) =>
  kinds.flatMap((kind, cycle) =>
    ['windup', 'windup', 'attack', 'recovery'].map((phase, i) => ({
      age: cycle * 10 + i,
      cycle,
      kind,
      phase,
      mode: 'physical',
    })),
  );

test('counts completed attack windows rather than individual frames', () => {
  const result = inspectBossPatterns(route(['a', 'b', 'a', 'b']));
  assert.equal(result.status, 'OBSERVED_OK');
  assert.equal(result.completeWindows, 4);
  assert.equal(result.longestRun, 1);
  assert.deepEqual(result.distribution, { a: 2, b: 2 });
  assert.equal(result.releaseAuthorized, false);
});

test('flags repeated consecutive attacks only with enough exposure', () => {
  const result = inspectBossPatterns(route(['a', 'a', 'a', 'b']));
  assert.equal(result.status, 'FINDINGS');
  assert.equal(result.findings[0].rule, 'NW-R008');
  assert.equal(result.longestRun, 3);
});

test('short samples and unfinished attacks are insufficient evidence', () => {
  const samples = route(['a', 'a', 'a', 'a']).slice(0, -2);
  const result = inspectBossPatterns(samples);
  assert.equal(result.status, 'INSUFFICIENT_EXPOSURE');
  assert.equal(result.completeWindows, 3);
  assert.equal(result.findings.length, 0);
});

test('unobserved cycle breaks a consecutive sequence', () => {
  const samples = route(['a', 'a', 'a', 'a']).filter((sample) => sample.cycle !== 1);
  const result = inspectBossPatterns(samples, { minWindows: 3 });
  assert.equal(result.longestRun, 2);
  assert.equal(result.status, 'OBSERVED_OK');
});

test('invalid encounter clock cannot be accepted', () => {
  const samples = route(['a']);
  samples[1].age = samples[0].age;
  assert.equal(inspectBossPatterns(samples).status, 'BLOCKED');
});
