import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { regressionMemory, regressionPlan } from '../tools/gameplay-regression-plan.mjs';

test('historical contracts have unique IDs, traceable tests and explicit review gaps', () => {
  assert.equal(new Set(regressionMemory.map((item) => item.id)).size, regressionMemory.length);
  for (const item of regressionMemory) {
    assert.match(item.id, /^NW-R\d{3}$/);
    assert.ok(['P0', 'P1', 'P2'].includes(item.severity));
    assert.ok(item.rule && item.review);
    assert.ok(item.node.length + item.browser.length > 0);
    for (const path of [...item.node, ...item.browser]) {
      assert.ok(path.startsWith('tests/'), path);
      assert.ok(existsSync(new URL('../' + path, import.meta.url)), path);
    }
  }
});

test('targeted plans select contracts, deduplicate tests and never grant approval', () => {
  const plan = regressionPlan(['city', 'europa']);
  assert.ok(plan.contracts.every((item) => ['city', 'europa'].includes(item.area)));
  for (const command of plan.commands) {
    assert.equal(new Set(command).size, command.length);
  }
  assert.equal(plan.status, 'PLAN_ONLY');
  assert.equal(plan.humanApproval, 'PENDING');
  assert.equal(plan.releaseAuthorized, false);
  assert.throws(() => regressionPlan(['typo']), /Unknown gameplay area/);
});

test('unfiltered plan includes every contract', () => {
  assert.equal(regressionPlan().contracts.length, regressionMemory.length);
});
