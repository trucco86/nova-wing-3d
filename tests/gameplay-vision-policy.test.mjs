import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createVisionPolicy } from '../tools/gameplay-vision-policy.mjs';

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'nova-wing-policy-'));
  const screenshot = join(dir, 'screen.png');
  await writeFile(screenshot, Buffer.from('fake-png'));
  return { dir, screenshot, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

const base = {
  endpoint: 'https://vision.example.test/v1/chat/completions',
  apiKey: 'test-secret',
  model: 'vision-model',
};

test('vision policy rejects non-HTTPS remote endpoints', () => {
  assert.throws(() => createVisionPolicy({ ...base, endpoint: 'http://vision.example.test/api' }), /HTTPS/);
});

test('vision policy accepts localhost HTTP for local providers', () => {
  assert.doesNotThrow(() => createVisionPolicy({ ...base, endpoint: 'http://127.0.0.1:11434/v1/chat/completions' }));
});

test('vision policy sends screenshot and visible observations to provider', async () => {
  const f = await fixture();
  let request;
  try {
    const decide = createVisionPolicy({
      ...base,
      fetchImpl: async (url, options) => {
        request = { url, options, body: JSON.parse(options.body) };
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: JSON.stringify({
            type: 'key', key: 'Space', durationMs: 300, rationale: 'Fire at visible target', confidence: 0.8,
          }) } }] }),
        };
      },
    });
    const result = await decide({
      screenshot: f.screenshot,
      title: 'Nova Wing',
      text: 'Press Space to fire',
      controls: [{ role: 'button', name: 'Start' }],
    }, [], { profile: 'beginner', step: 2 });
    assert.equal(result.type, 'key');
    assert.equal(result.confidence, 0.8);
    assert.equal(request.options.headers.authorization, 'Bearer test-secret');
    assert.equal(request.body.messages[0].content[1].image_url.detail, 'high');
    assert.match(request.body.messages[0].content[0].text, /Press Space to fire/);
    assert.match(request.body.messages[0].content[0].text, /beginner/);
  } finally {
    await f.cleanup();
  }
});

test('vision policy rejects invalid action schemas', async () => {
  const f = await fixture();
  try {
    const decide = createVisionPolicy({
      ...base,
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"type":"teleport"}' } }] }),
      }),
    });
    await assert.rejects(decide({ screenshot: f.screenshot }), /unsupported action type/);
  } finally {
    await f.cleanup();
  }
});

test('vision policy enforces screenshot size limit before network call', async () => {
  const f = await fixture();
  let called = false;
  try {
    const decide = createVisionPolicy({
      ...base,
      maxImageBytes: 2,
      fetchImpl: async () => { called = true; },
    });
    await assert.rejects(decide({ screenshot: f.screenshot }), /exceeds configured size limit/);
    assert.equal(called, false);
  } finally {
    await f.cleanup();
  }
});
