import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRankingClient } from '../src/ranking-client.js';
import { readLocalHistory } from '../src/score-history.js';

function fakeElement() {
  const handlers = new Map();
  return {
    checked: false,
    value: '',
    textContent: '',
    open: false,
    children: [],
    addEventListener(event, handler) {
      handlers.set(event, handler);
    },
    removeEventListener(event, handler) {
      if (handlers.get(event) === handler) handlers.delete(event);
    },
    dispatch(event) {
      handlers.get(event)?.();
    },
    replaceChildren() {
      this.children = [];
    },
    append(child) {
      this.children.push(child);
    },
  };
}

function setup() {
  const fields = new Map();
  for (const name of [
    'nickname',
    'consent',
    'identity',
    'summary',
    'status',
    'local',
    'global',
    'cloud',
    'refresh',
  ])
    fields.set(name, fakeElement());

  const panel = {
    ...fakeElement(),
    querySelector(selector) {
      return fields.get(selector.match(/^\\[data-rank-([a-z]+)\\]$/)?.[1]) || null;
    },
  };
  const document = {
    getElementById(id) {
      if (id === 'novaRanking') return panel;
      if (id === 'gameVersion') return { textContent: 'v1.24.21' };
      return null;
    },
    createElement: () => fakeElement(),
  };
  const state = new Map();
  const storage = {
    getItem: (key) => state.get(key) || null,
    setItem: (key, value) => state.set(key, value),
  };
  const calls = [];
  let failWrites = false;
  const client = createRankingClient({
    document,
    storage,
    fetcher: async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (options.method === 'POST') {
        calls.push({
          path,
          bearer: options.headers?.authorization,
          body: JSON.parse(options.body),
        });
        if (failWrites) return { ok: false, json: async () => ({ error: 'OFFLINE' }) };
        if (path === '/v1/runs/start')
          return {
            ok: true,
            json: async () => ({
              runId: '7fa913e1-1c02-489c-acdc-871110008000',
              nonce: 'long-enough-test-nonce-1234567890123456',
            }),
          };
        return { ok: true, json: async () => ({ recorded: true, verified: false }) };
      }
      return {
        ok: true,
        json: async () => ({ entries: [] }),
      };
    },
  });
  const field = (name) => fields.get(name);
  const configure = () => client.setRuntimeConfig({ rankingApiUrl: 'https://ranking.example.org' });
  return {
    client,
    field,
    storage,
    calls,
    configure,
    setWriteFailure(value) {
      failWrites = value;
    },
  };
}

const player = (uid, getIdToken = async () => 'token-' + uid) => ({ uid, getIdToken });
const finish = { sector: 1, points: 120, durationMs: 98000 };
const settle = () => new Promise((resolve) => setImmediate(resolve));

test('browser-restored consent and nickname are cleared even before Firebase initializes', () => {
  const app = setup();
  assert.equal(app.field('consent').checked, false);
  assert.equal(app.field('nickname').value, '');
  app.client.destroy();
});

test('account B cannot inherit A nickname or consent; local history survives both identities', async () => {
  const app = setup();
  app.configure();
  app.client.setUser(player('A'));
  app.field('consent').checked = true;
  app.field('nickname').value = 'Pilot A';
  app.client.onStageStarted({ sector: 1 });
  await settle();

  app.client.setUser(null);
  assert.equal(app.field('consent').checked, false);
  assert.equal(app.field('nickname').value, '');
  assert.equal(app.field('identity').textContent, 'Visitante · resultados locais');
  app.client.setUser(player('B'));
  assert.equal(app.field('consent').checked, false);
  assert.equal(app.field('nickname').value, '');
  assert.equal(app.field('cloud').children.length, 1);
  assert.equal(app.field('cloud').children[0].textContent, 'Consulte o histórico desta conta.');

  // An A run cannot finish after B signs in. Starting B without consent is local only.
  app.client.onStageStarted({ sector: 1 });
  await app.client.onStageFinished(finish);
  assert.equal(app.calls.filter((call) => call.path === '/v1/runs/finish').length, 0);
  assert.equal(readLocalHistory(app.storage).length, 1);

  app.field('nickname').value = 'Pilot B';
  app.field('consent').checked = true;
  app.client.onStageStarted({ sector: 1 });
  await settle();
  await app.client.onStageFinished(finish);
  assert.equal(app.calls.filter((call) => call.path === '/v1/runs/finish').length, 1);
  assert.equal(app.calls.at(-1).bearer, 'Bearer token-B');
  assert.equal(
    app.calls.filter((call) => call.path === '/v1/runs/start').at(-1).body.nickname,
    'Pilot B',
  );
  assert.equal(readLocalHistory(app.storage).length, 2);
  app.client.destroy();
});

test('late Google token from account A cannot dispatch a score request after login B', async () => {
  let releaseToken;
  const token = new Promise((resolve) => {
    releaseToken = resolve;
  });
  const app = setup();
  app.configure();
  app.client.setUser(player('A', () => token));
  app.field('nickname').value = 'Pilot A';
  app.field('consent').checked = true;
  app.client.onStageStarted({ sector: 1 });
  app.client.setUser(player('B'));
  releaseToken('token-A');
  await settle();
  await app.client.onStageFinished(finish);
  assert.equal(app.calls.filter((call) => call.path.startsWith('/v1/runs')).length, 0);
  assert.equal(readLocalHistory(app.storage).length, 1);
  app.client.destroy();
});

test('revoking opt-in midflight prevents finishing an existing server run', async () => {
  const app = setup();
  app.configure();
  app.client.setUser(player('A'));
  app.field('nickname').value = 'Pilot A';
  app.field('consent').checked = true;
  app.client.onStageStarted({ sector: 1 });
  await settle();
  assert.equal(app.calls.filter((call) => call.path === '/v1/runs/start').length, 1);

  app.field('consent').checked = false;
  app.field('consent').dispatch('change');
  await app.client.onStageFinished(finish);
  assert.equal(app.calls.filter((call) => call.path === '/v1/runs/finish').length, 0);
  assert.equal(readLocalHistory(app.storage).length, 1);

  // Turning opt-in back on does not resurrect the partially completed run.
  app.field('consent').checked = true;
  await app.client.onStageFinished(finish);
  assert.equal(app.calls.filter((call) => call.path === '/v1/runs/finish').length, 0);
  app.client.destroy();
});

test('revocation while awaiting the finish token never sends the finish POST', async () => {
  let hold = false;
  let releaseToken;
  const delayed = new Promise((resolve) => {
    releaseToken = resolve;
  });
  const app = setup();
  app.configure();
  app.client.setUser(player('A', () => (hold ? delayed : Promise.resolve('token-A'))));
  app.field('nickname').value = 'Pilot A';
  app.field('consent').checked = true;
  app.client.onStageStarted({ sector: 1 });
  await settle();
  hold = true;
  const pending = app.client.onStageFinished(finish);
  await settle();
  app.field('consent').checked = false;
  app.field('consent').dispatch('change');
  releaseToken('token-A');
  await pending;
  assert.equal(app.calls.filter((call) => call.path === '/v1/runs/finish').length, 0);
  assert.equal(readLocalHistory(app.storage).length, 1);
  app.client.destroy();
});

test('network errors retain the local result without claiming a remote score', async () => {
  const app = setup();
  app.configure();
  app.setWriteFailure(true);
  app.client.setUser(player('A'));
  app.field('nickname').value = 'Pilot A';
  app.field('consent').checked = true;
  app.client.onStageStarted({ sector: 1 });
  await app.client.onStageFinished(finish);
  assert.equal(readLocalHistory(app.storage).length, 1);
  assert.match(app.field('status').textContent, /local/);
  app.client.destroy();
});
