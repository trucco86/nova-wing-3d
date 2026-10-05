import { createHash } from 'node:crypto';
import { routeTask, validatePolicy } from './model-router.mjs';
import { callModel, estimateCost, keyNames, ProviderError } from './model-provider.mjs';

export async function executeTask(
  policy,
  request,
  {
    env = process.env,
    fetcher = fetch,
    live = false,
    prices = {},
    maxOutputTokens = 1024,
    timeoutMs = 60000,
    fallback = true,
  } = {},
) {
  validatePolicy(policy);
  if (
    typeof request.prompt !== 'string' ||
    !request.prompt.trim() ||
    Buffer.byteLength(request.prompt) > 100000 ||
    !Number.isSafeInteger(maxOutputTokens) ||
    maxOutputTokens < 1 ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    request.vision
  )
    throw new Error('Invalid text execution request or limits');
  const config = structuredClone(policy);
  for (const route of Object.values(config.routes)) {
    route.maxOutputTokens = Math.min(route.maxOutputTokens, maxOutputTokens);
    route.timeoutMs = Math.min(route.timeoutMs, timeoutMs);
  }
  const available = { ...env };
  for (const m of config.models)
    if (!keyNames[m.provider] || !env[keyNames[m.provider]]) delete available[m.modelEnv];
  const evidence = {
    promptSha256: createHash('sha256').update(request.prompt).digest('hex'),
    task: request.task,
    risk: request.risk ?? 'medium',
    live,
    attempts: [],
    estimatedCostUsd: 0,
    priceBasis: 'configured USD per million tokens; not a provider invoice',
  };
  const failedModels = [];
  for (let attempt = 0; ; attempt++) {
    // Provider-side token count below is authoritative before generation.
    const decision = routeTask(
      config,
      {
        task: request.task,
        risk: request.risk,
        authorModel: request.authorModel,
        inputTokens: 0,
        attempts: attempt,
        failedModels,
      },
      available,
    );
    if (decision.status !== 'selected') return { ...evidence, status: 'blocked', decision };
    if (!live) return { ...evidence, status: 'ready', decision };
    const started = Date.now();
    const modelConfig = config.models.find((m) => m.key === decision.model.key);
    try {
      const result = await callModel(
        decision.model,
        request.prompt,
        decision.limits,
        modelConfig.contextTokens,
        env,
        fetcher,
      );
      const identity = `${decision.model.provider}/${result.resolvedModel ?? decision.model.id}`;
      const cost = estimateCost(decision.model.provider, result.usage, prices[identity]);
      evidence.attempts.push({
        model: decision.model,
        ...result,
        durationMs: Date.now() - started,
        estimatedCostUsd: cost,
      });
      evidence.estimatedCostUsd =
        evidence.estimatedCostUsd === null || cost === null
          ? null
          : evidence.estimatedCostUsd + cost;
      return { ...evidence, status: result.status };
    } catch (error) {
      const code = error instanceof ProviderError ? error.code : 'execution-failed';
      evidence.attempts.push({
        model: decision.model,
        status: 'failed',
        error: code,
        durationMs: Date.now() - started,
        usage: null,
        estimatedCostUsd: null,
      });
      evidence.estimatedCostUsd = null;
      if (!(error instanceof ProviderError) || !error.retryable || !fallback)
        return { ...evidence, status: 'failed' };
      failedModels.push(decision.model.key);
    }
  }
}
