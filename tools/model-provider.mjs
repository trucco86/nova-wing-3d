// Fixed provider endpoints: credentials cannot be redirected to a user-supplied URL.
export const keyNames = { anthropic: 'ANTHROPIC_API_KEY', google: 'GEMINI_API_KEY' };
export class ProviderError extends Error {
  constructor(code, retryable = false) {
    super(code);
    this.code = code;
    this.retryable = retryable;
  }
}
const count = (n) => Number.isSafeInteger(n) && n >= 0;

export async function callModel(model, prompt, limits, contextTokens, env, fetcher = fetch) {
  const keyName = keyNames[model.provider];
  if (!keyName || !env[keyName]) throw new ProviderError('missing-provider-credential');
  if (!/^[a-zA-Z0-9._-]+$/.test(model.id)) throw new ProviderError('invalid-model-id');
  const signal = AbortSignal.timeout(limits.timeoutMs);
  const anthropic = model.provider === 'anthropic';
  const root = anthropic
    ? 'https://api.anthropic.com/v1/messages'
    : `https://generativelanguage.googleapis.com/v1beta/models/${model.id}`;
  const headers = anthropic
    ? { 'x-api-key': env[keyName], 'anthropic-version': '2023-06-01' }
    : { 'x-goog-api-key': env[keyName] };
  const content = anthropic
    ? { model: model.id, messages: [{ role: 'user', content: prompt }] }
    : { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
  async function post(url, body) {
    try {
      const response = await fetcher(url, {
        method: 'POST',
        redirect: 'error',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok)
        throw new ProviderError(
          `http-${response.status}`,
          response.status === 429 || response.status >= 500,
        );
      return await response.json();
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(
        signal.aborted ? 'timeout-usage-unknown' : 'transport-or-response-usage-unknown',
      );
    }
  }
  const tokenReply = await post(
    anthropic ? `${root}/count_tokens` : `${root}:countTokens`,
    content,
  );
  const inputTokens = anthropic ? tokenReply?.input_tokens : tokenReply?.totalTokens;
  if (!count(inputTokens)) throw new ProviderError('invalid-token-count');
  if (inputTokens + limits.maxOutputTokens > contextTokens)
    throw new ProviderError('context-budget');
  const result = await post(
    anthropic ? root : `${root}:generateContent`,
    anthropic
      ? { ...content, max_tokens: limits.maxOutputTokens }
      : {
          ...content,
          generationConfig: { maxOutputTokens: limits.maxOutputTokens, candidateCount: 1 },
        },
  );
  const text = anthropic
    ? result?.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
    : result?.candidates?.[0]?.content?.parts
        ?.filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('');
  const reason = anthropic ? result?.stop_reason : result?.candidates?.[0]?.finishReason;
  const u = anthropic ? result?.usage : result?.usageMetadata;
  const usage = anthropic
    ? {
        inputTokens: u?.input_tokens,
        outputTokens: u?.output_tokens,
        cachedInputTokens: u?.cache_read_input_tokens ?? 0,
        cacheWriteTokens: u?.cache_creation_input_tokens ?? 0,
      }
    : {
        inputTokens: u?.promptTokenCount,
        outputTokens: count(u?.candidatesTokenCount)
          ? u.candidatesTokenCount + (u.thoughtsTokenCount ?? 0)
          : null,
        cachedInputTokens: u?.cachedContentTokenCount ?? 0,
        cacheWriteTokens: 0,
      };
  const validUsage = Object.values(usage).every(count);
  return {
    status:
      reason === (anthropic ? 'end_turn' : 'STOP') && typeof text === 'string' && text.trim()
        ? 'completed'
        : 'incomplete',
    stopReason: typeof reason === 'string' ? reason : 'missing',
    text: typeof text === 'string' ? text : '',
    resolvedModel: (anthropic ? result?.model : result?.modelVersion) ?? null,
    usage: validUsage ? usage : null,
    countedInputTokens: inputTokens,
  };
}

export function estimateCost(provider, usage, price) {
  if (
    !usage ||
    !price ||
    !['input', 'output', 'cachedInput', 'cacheWrite'].every(
      (k) => Number.isFinite(price[k]) && price[k] >= 0,
    )
  )
    return null;
  // Gemini prompt count includes cached tokens; Anthropic input count excludes them.
  const input =
    provider === 'google' ? usage.inputTokens - usage.cachedInputTokens : usage.inputTokens;
  if (input < 0) return null;
  return (
    (input * price.input +
      usage.outputTokens * price.output +
      usage.cachedInputTokens * price.cachedInput +
      usage.cacheWriteTokens * price.cacheWrite) /
    1e6
  );
}
