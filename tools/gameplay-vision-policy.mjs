import { readFile } from 'node:fs/promises';

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function parseEndpoint(value) {
  let endpoint;
  try {
    endpoint = new URL(value);
  } catch {
    throw new Error('GAMEPLAY_AGENT_API_URL must be an absolute URL');
  }
  const local = ['localhost', '127.0.0.1', '::1'].includes(endpoint.hostname);
  if (endpoint.protocol !== 'https:' && !(local && endpoint.protocol === 'http:')) {
    throw new Error('Vision policy endpoint must use HTTPS (HTTP is allowed only on localhost)');
  }
  return endpoint;
}

function extractJson(content) {
  const trimmed = String(content || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error('Vision policy response is not valid JSON');
  }
}

function validateDecision(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Vision policy must return a JSON object');
  }
  const { type } = value;
  if (!['click', 'key', 'wait', 'stop'].includes(type)) {
    throw new Error('Vision policy returned an unsupported action type');
  }
  if (type === 'click' && (typeof value.name !== 'string' || !value.name.trim())) {
    throw new Error('Vision policy click action requires a visible accessible name');
  }
  if (type === 'key' && typeof value.key !== 'string') {
    throw new Error('Vision policy key action requires a key');
  }
  if (['key', 'wait'].includes(type) &&
      (!Number.isFinite(Number(value.durationMs)) || Number(value.durationMs) < 1)) {
    throw new Error('Vision policy key/wait action requires a positive durationMs');
  }
  if (type === 'stop' && value.reason != null && typeof value.reason !== 'string') {
    throw new Error('Vision policy stop reason must be a string');
  }
  return {
    ...value,
    rationale: String(value.rationale || '').slice(0, 500),
    confidence: Number.isFinite(Number(value.confidence))
      ? Math.max(0, Math.min(1, Number(value.confidence)))
      : null,
  };
}

/**
 * Creates a visual decision policy for OpenAI-compatible chat-completions APIs.
 * The provider receives a screenshot and player-visible text only.
 */
export function createVisionPolicy({
  endpoint,
  apiKey,
  model,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxImageBytes = MAX_IMAGE_BYTES,
  goal = 'Start a normal game session, learn the controls from visible instructions, and play safely.',
} = {}) {
  if (!endpoint) throw new Error('GAMEPLAY_AGENT_API_URL is required');
  if (!apiKey) throw new Error('GAMEPLAY_AGENT_API_KEY is required');
  if (!model) throw new Error('GAMEPLAY_AGENT_MODEL is required');
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
  const apiUrl = parseEndpoint(endpoint);

  return async (observation, recentActions = [], { profile = 'casual', step = 0 } = {}) => {
    if (!observation?.screenshot) throw new Error('Observation must include a screenshot path');
    const image = await readFile(observation.screenshot);
    if (image.length > maxImageBytes) throw new Error('Observation screenshot exceeds configured size limit');

    const prompt = [
      'You are the player controller for Nova Wing, a browser rail shooter.',
      'Act only on information visible in the screenshot and visible text below.',
      'Do not assume hidden game state. Do not claim an action succeeded unless a later observation confirms it.',
      'Choose exactly one next action. Prefer short, reversible actions when uncertain.',
      'Available action JSON:',
      '{"type":"click","name":"exact visible accessible button name","rationale":"...","confidence":0.0}',
      '{"type":"key","key":"Space|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|KeyW|KeyA|KeyS|KeyD|ShiftLeft|KeyQ|KeyE|KeyZ|KeyB|KeyX|KeyV|Escape|KeyP","durationMs":250,"rationale":"...","confidence":0.0}',
      '{"type":"wait","durationMs":500,"rationale":"...","confidence":0.0}',
      '{"type":"stop","reason":"...","rationale":"...","confidence":0.0}',
      'Return JSON only. Do not use markdown.',
      `Goal: ${goal}`,
      `Player profile: ${profile}`,
      `Step: ${step}`,
      `Visible page title: ${observation.title || ''}`,
      `Visible page text: ${String(observation.text || '').slice(0, 8000)}`,
      `Visible accessible controls: ${JSON.stringify(observation.controls || [])}`,
      `Recent actions: ${JSON.stringify(recentActions.slice(-6))}`,
    ].join('\n');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${image.toString('base64')}`,
                  detail: 'high',
                },
              },
            ],
          }],
        }),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 1000);
        throw new Error(`Vision policy provider returned HTTP ${response.status}: ${detail}`);
      }
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') throw new Error('Vision policy provider response has no assistant content');
      return validateDecision(extractJson(content));
    } catch (error) {
      if (error.name === 'AbortError') throw new Error(`Vision policy timed out after ${timeoutMs}ms`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function createVisionPolicyFromEnv(options = {}) {
  return createVisionPolicy({
    endpoint: process.env.GAMEPLAY_AGENT_API_URL,
    apiKey: process.env.GAMEPLAY_AGENT_API_KEY,
    model: process.env.GAMEPLAY_AGENT_MODEL,
    ...options,
  });
}
