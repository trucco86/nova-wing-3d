import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const tasks = ['planning', 'implementation', 'review', 'tests', 'documentation'];
const risks = ['low', 'medium', 'high'];
const profiles = ['fast', 'balanced', 'deep'];
const positive = (n) => Number.isSafeInteger(n) && n > 0;

export function validatePolicy(policy) {
  if (policy?.version !== 1 || !Array.isArray(policy.models) || !policy.models.length)
    throw new Error('Invalid model policy');
  const ids = new Set();
  for (const model of policy.models) {
    if (
      !model ||
      typeof model.key !== 'string' ||
      !model.key ||
      ids.has(model.key) ||
      typeof model.provider !== 'string' ||
      !model.provider ||
      !/^[A-Z][A-Z0-9_]*$/.test(model.modelEnv) ||
      !profiles.includes(model.profile) ||
      !positive(model.contextTokens) ||
      typeof model.vision !== 'boolean'
    )
      throw new Error('Invalid model entry');
    ids.add(model.key);
  }
  for (const task of tasks) {
    const route = policy.routes?.[task];
    if (
      !route ||
      !Array.isArray(route.candidates) ||
      !route.candidates.length ||
      new Set(route.candidates).size !== route.candidates.length ||
      !route.candidates.every((key) => ids.has(key)) ||
      !positive(route.maxOutputTokens) ||
      !positive(route.timeoutMs) ||
      !positive(route.maxAttempts)
    )
      throw new Error(`Invalid route: ${task}`);
  }
  return policy;
}

export function routeTask(policy, request, env = process.env) {
  validatePolicy(policy);
  const {
    task,
    risk = 'medium',
    inputTokens = 0,
    vision = false,
    failedModels = [],
    attempts = 0,
    authorModel = null,
  } = request;
  if (
    !tasks.includes(task) ||
    !risks.includes(risk) ||
    !Number.isSafeInteger(inputTokens) ||
    inputTokens < 0 ||
    typeof vision !== 'boolean' ||
    !Array.isArray(failedModels) ||
    !failedModels.every((id) => typeof id === 'string') ||
    !Number.isSafeInteger(attempts) ||
    attempts < 0 ||
    (authorModel !== null && typeof authorModel !== 'string')
  )
    throw new Error('Invalid routing request');
  const route = policy.routes[task];
  const limits = {
    maxOutputTokens: route.maxOutputTokens,
    timeoutMs: route.timeoutMs,
    maxAttempts: route.maxAttempts,
  };
  const base = { task, risk, limits, callsModel: false };
  if (attempts >= route.maxAttempts)
    return { ...base, status: 'blocked', reason: 'attempt-budget-exhausted' };
  const minimum =
    risk === 'high' || attempts > 0
      ? 'deep'
      : risk === 'medium' && task !== 'documentation'
        ? 'balanced'
        : 'fast';
  const rejected = [];
  for (const key of route.candidates) {
    const model = policy.models.find((m) => m.key === key);
    const modelId = env[model.modelEnv]?.trim();
    let reason;
    if (!modelId) reason = 'not-configured';
    else if (failedModels.includes(key)) reason = 'previous-failure';
    else if (profiles.indexOf(model.profile) < profiles.indexOf(minimum))
      reason = 'insufficient-profile';
    else if (vision && !model.vision) reason = 'vision-required';
    else if (inputTokens + route.maxOutputTokens > model.contextTokens) reason = 'context-budget';
    else if (task === 'review' && authorModel === `${model.provider}/${modelId}`)
      reason = 'same-as-author';
    if (reason) {
      rejected.push({ key, reason });
      continue;
    }
    return {
      ...base,
      status: 'selected',
      minimumProfile: minimum,
      model: { key, provider: model.provider, id: modelId, profile: model.profile },
      rejected,
      validation: 'npm run validate',
      independentReview: task === 'review' && authorModel !== null,
    };
  }
  return { ...base, status: 'blocked', reason: 'no-eligible-model', rejected };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [task, risk = 'medium', input = '0', ...flags] = process.argv.slice(2);
    if (flags.some((f) => f !== '--vision')) throw new Error('Unknown CLI option');
    const policy = JSON.parse(
      readFileSync(new URL('../model-policy.json', import.meta.url), 'utf8'),
    );
    const result = routeTask(policy, {
      task,
      risk,
      inputTokens: Number(input),
      vision: flags.includes('--vision'),
    });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'selected' ? 0 : 2;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
