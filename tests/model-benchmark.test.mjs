import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildPrompt, gradeContract, benchmark, cases } from '../tools/model-benchmark.mjs';
const policy = JSON.parse(readFileSync('model-policy.json', 'utf8'));
test('benchmark includes five task types and identical public context', () => {
  assert.equal(new Set(cases.map((c) => c.task)).size, 5);
  const a = buildPrompt(cases[0]);
  assert.equal(a, buildPrompt(cases[0]));
  assert.match(a, /createFlightCamera/);
});
test('schema and evidence checks never claim semantic correctness', () => {
  const valid = {
    answer: 'Example',
    evidence: [{ path: 'src/flight.js', reason: 'Example' }],
    checks: ['Inspect'],
  };
  assert.deepEqual(gradeContract(JSON.stringify(valid), cases[0]), {
    contractPassed: true,
    semanticQuality: 'human-review-pending',
  });
  valid.evidence[0].path = 'nonexistent.js';
  assert.equal(gradeContract(JSON.stringify(valid), cases[0]).contractPassed, false);
  assert.equal(gradeContract('not JSON', cases[0]).contractPassed, false);
});
test('unconfigured benchmark reports blocked samples, no fake responses or HTTP', async () => {
  const report = await benchmark(policy, cases, {
    env: {},
    live: true,
    fetcher: async () => {
      assert.fail('Unexpected HTTP call');
    },
  });
  assert.ok(report.results.length > 5);
  assert.ok(
    report.results.every(
      (r) => r.status === 'blocked' && r.evaluation === null && r.attempts.length === 0,
    ),
  );
});
