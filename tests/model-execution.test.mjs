import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { executeTask } from '../tools/model-executor.mjs';
import { callModel, estimateCost } from '../tools/model-provider.mjs';
const policy = JSON.parse(readFileSync('model-policy.json', 'utf8'));
const env = {
  ANTHROPIC_API_KEY: 'test-only-secret',
  GEMINI_API_KEY: 'test-only-google',
  NOVA_MODEL_BALANCED: 'test-balanced',
  NOVA_MODEL_DEEP: 'test-deep',
  NOVA_MODEL_DEEP_FALLBACK: 'test-pro',
};
const request = { task: 'implementation', prompt: 'Public test fixture' };
const reply = (data, status = 200) => ({ ok: status === 200, status, json: async () => data });
const claude = {
  model: 'test-balanced',
  stop_reason: 'end_turn',
  content: [{ type: 'text', text: 'answer' }],
  usage: { input_tokens: 10, output_tokens: 5 },
};
const noNetwork = async () => {
  throw new Error('Network must not be called');
};

test('preflight and missing credentials make no HTTP calls', async () => {
  assert.equal((await executeTask(policy, request, { env, fetcher: noNetwork })).status, 'ready');
  const report = await executeTask(policy, request, { env: {}, live: true, fetcher: noNetwork });
  assert.equal(report.status, 'blocked');
  assert.equal(report.attempts.length, 0);
});
test('Claude counts full prompt before generation and applies output and timeout limits', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, ...init });
    return reply(calls.length === 1 ? { input_tokens: 10 } : claude);
  };
  const result = await executeTask(policy, request, {
    env,
    live: true,
    fetcher,
    maxOutputTokens: 64,
  });
  assert.equal(result.status, 'completed');
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /count_tokens$/);
  assert.equal(JSON.parse(calls[1].body).max_tokens, 64);
  assert.equal(calls[0].signal, calls[1].signal);
  assert.equal(calls[1].redirect, 'error');
  assert.equal(result.attempts[0].usage.outputTokens, 5);
  assert.equal(result.estimatedCostUsd, null);
  assert.ok(!JSON.stringify(result).includes(env.ANTHROPIC_API_KEY));
});
test('provider token count rejects oversized context without generation', async () => {
  let calls = 0;
  const result = await executeTask(policy, request, {
    env,
    live: true,
    fetcher: async () => {
      calls++;
      return reply({ input_tokens: 64000 });
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.attempts[0].error, 'context-budget');
});
test('429 escalates to deep within two attempts; third call to generation never occurs', async () => {
  let counts = 0,
    generations = 0;
  const fetcher = async (url) => {
    if (url.endsWith('count_tokens')) {
      counts++;
      return reply({ input_tokens: 10 });
    }
    generations++;
    return reply({}, 429);
  };
  const result = await executeTask(policy, request, { env, live: true, fetcher });
  assert.equal(counts, 2);
  assert.equal(generations, 2);
  assert.deepEqual(
    result.attempts.map((a) => a.model.key),
    ['balanced', 'deep'],
  );
  assert.equal(result.decision.reason, 'attempt-budget-exhausted');
});
test('transport failure is sanitized and not retried with uncertain billing', async () => {
  let calls = 0;
  const result = await executeTask(policy, request, {
    env,
    live: true,
    fetcher: async () => {
      calls++;
      throw new Error(`secret ${env.ANTHROPIC_API_KEY}`);
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.status, 'failed');
  assert.equal(result.estimatedCostUsd, null);
  assert.ok(!JSON.stringify(result).includes(env.ANTHROPIC_API_KEY));
});
test('timeout aborts active request without fallback', async () => {
  const fetcher = async (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('test exceeded timeout')), 100);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(signal.reason);
        },
        { once: true },
      );
    });
  const result = await executeTask(policy, request, { env, live: true, fetcher, timeoutMs: 10 });
  assert.equal(result.attempts[0].error, 'timeout-usage-unknown');
  assert.equal(result.attempts.length, 1);
});
test('truncated answer preserves usage and is not accepted as complete', async () => {
  const fetcher = async (url) =>
    reply(
      url.endsWith('count_tokens')
        ? { input_tokens: 10 }
        : { ...claude, stop_reason: 'max_tokens' },
    );
  const result = await executeTask(policy, request, { env, live: true, fetcher });
  assert.equal(result.status, 'incomplete');
  assert.equal(result.attempts[0].usage.outputTokens, 5);
});
test('Gemini counts prompt, authenticates via header and records thinking usage', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, ...init });
    return reply(
      url.endsWith(':countTokens')
        ? { totalTokens: 10 }
        : {
            modelVersion: 'test-pro-resolved',
            candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'answer' }] } }],
            usageMetadata: {
              promptTokenCount: 10,
              candidatesTokenCount: 5,
              thoughtsTokenCount: 7,
              cachedContentTokenCount: 2,
            },
          },
    );
  };
  const result = await callModel(
    { provider: 'google', id: 'test-pro' },
    'fixture',
    { maxOutputTokens: 32, timeoutMs: 1000 },
    64000,
    env,
    fetcher,
  );
  assert.equal(result.status, 'completed');
  assert.equal(result.usage.outputTokens, 12);
  assert.equal(result.resolvedModel, 'test-pro-resolved');
  assert.equal(JSON.parse(calls[1].body).generationConfig.maxOutputTokens, 32);
  assert.equal(calls[1].headers['x-goog-api-key'], env.GEMINI_API_KEY);
  assert.ok(!calls[1].url.includes(env.GEMINI_API_KEY));
});
test('invalid counts and refusals do not pass', async () => {
  await assert.rejects(
    callModel(
      { provider: 'anthropic', id: 'test' },
      'x',
      { maxOutputTokens: 32, timeoutMs: 1000 },
      64000,
      env,
      async () => reply({ input_tokens: -1 }),
    ),
    /invalid-token-count/,
  );
  const r = await executeTask(policy, request, {
    env,
    live: true,
    fetcher: async (url) =>
      reply(
        url.endsWith('count_tokens') ? { input_tokens: 10 } : { ...claude, stop_reason: 'refusal' },
      ),
  });
  assert.equal(r.status, 'incomplete');
});
test('cost requires explicit complete rates and accounts for provider cache semantics', () => {
  const usage = { inputTokens: 100, outputTokens: 20, cachedInputTokens: 30, cacheWriteTokens: 0 };
  const price = { input: 2, output: 10, cachedInput: 0.2, cacheWrite: 2.5 };
  assert.equal(estimateCost('anthropic', usage, price), 406 / 1e6);
  assert.equal(estimateCost('google', usage, price), 346 / 1e6);
  assert.equal(estimateCost('google', usage, {}), null);
  assert.equal(estimateCost('google', null, price), null);
});

test('authentication errors and benchmark mode do not trigger fallback', async () => {
  for (const [status, fallback] of [
    [401, true],
    [429, false],
  ]) {
    let calls = 0;
    const result = await executeTask(policy, request, {
      env,
      live: true,
      fallback,
      fetcher: async () => {
        calls++;
        return reply({}, status);
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.status, 'failed');
  }
});
