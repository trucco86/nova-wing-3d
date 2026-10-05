import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { routeTask, validatePolicy } from '../tools/model-router.mjs';

const policy = JSON.parse(readFileSync(new URL('../model-policy.json', import.meta.url), 'utf8'));
const env = {
  NOVA_MODEL_FAST: 'fast-example',
  NOVA_MODEL_BALANCED: 'balanced-example',
  NOVA_MODEL_DEEP: 'deep-example',
  NOVA_MODEL_DEEP_FALLBACK: 'deep-alternative',
};
const route = (request, config = policy, available = env) => routeTask(config, request, available);

test('task defaults select distinct profiles and a different review provider', () => {
  for (const [task, key] of Object.entries({
    planning: 'deep',
    implementation: 'balanced',
    review: 'deep-fallback',
    tests: 'balanced',
    documentation: 'fast',
  })) {
    const result = route({ task });
    assert.equal(result.model.key, key);
    assert.equal(result.callsModel, false);
  }
});
test('high risk cannot fall back to a cheaper profile', () => {
  const result = route({ task: 'documentation', risk: 'high' }, policy, {
    NOVA_MODEL_FAST: 'fast',
    NOVA_MODEL_BALANCED: 'balanced',
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'no-eligible-model');
});
test('missing or failed primary falls back to another eligible provider', () => {
  assert.equal(route({ task: 'planning', failedModels: ['deep'] }).model.key, 'deep-fallback');
  assert.equal(
    route({ task: 'planning' }, policy, { NOVA_MODEL_DEEP_FALLBACK: 'fallback' }).model.provider,
    'google',
  );
});
test('retry escalates and total attempt limit blocks', () => {
  assert.equal(route({ task: 'implementation', attempts: 1 }).model.key, 'deep');
  assert.equal(route({ task: 'implementation', attempts: 2 }).reason, 'attempt-budget-exhausted');
});
test('empty inventory fails closed', () => {
  assert.equal(route({ task: 'planning' }, policy, {}).status, 'blocked');
});
test('context includes reserved output and preserves exact boundary', () => {
  assert.equal(route({ task: 'planning', inputTokens: 56000 }).status, 'selected');
  assert.equal(route({ task: 'planning', inputTokens: 56001 }).status, 'blocked');
});
test('vision excludes a text-only candidate', () => {
  const config = structuredClone(policy);
  config.models[2].vision = false;
  assert.equal(route({ task: 'planning', vision: true }, config).model.key, 'deep-fallback');
});
test('review excludes author identity even when configured under another key', () => {
  const config = structuredClone(policy);
  config.models[3].provider = 'anthropic';
  const available = { ...env, NOVA_MODEL_DEEP_FALLBACK: 'deep-example' };
  const result = route(
    { task: 'review', risk: 'high', authorModel: 'anthropic/deep-example' },
    config,
    available,
  );
  assert.equal(result.status, 'blocked');
  assert.equal(result.rejected.filter((r) => r.reason === 'same-as-author').length, 2);
});
test('request validation rejects unknown types and invalid budgets', () => {
  for (const request of [
    { task: 'deploy' },
    { task: 'tests', risk: 'critical' },
    { task: 'tests', inputTokens: -1 },
    { task: 'tests', inputTokens: 0.5 },
    { task: 'tests', attempts: -1 },
    { task: 'tests', vision: 'yes' },
    { task: 'tests', failedModels: 'deep' },
  ])
    assert.throws(() => route(request));
});
test('policy validation rejects invalid routes, identities and limits', () => {
  for (const mutate of [
    (p) => {
      p.models[1].key = p.models[0].key;
    },
    (p) => {
      p.routes.review.candidates = ['missing'];
    },
    (p) => {
      p.routes.tests.maxAttempts = 0;
    },
    (p) => {
      p.models[0].contextTokens = 0;
    },
    (p) => {
      p.models[0].modelEnv = 'invalid env';
    },
  ]) {
    const config = structuredClone(policy);
    mutate(config);
    assert.throws(() => validatePolicy(config));
  }
});
