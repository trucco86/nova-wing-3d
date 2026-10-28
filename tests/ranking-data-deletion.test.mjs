import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRankingClient } from '../src/ranking-client.js';
import { readLocalHistory } from '../src/score-history.js';

function control() {
  const handlers = new Map();
  return {
    disabled: false,
    checked: false,
    value: '',
    textContent: '',
    children: [],
    addEventListener(event, handler) {
      handlers.set(event, handler);
    },
    removeEventListener(event, handler) {
      if (handlers.get(event) === handler) handlers.delete(event);
    },
    trigger(event) {
      return handlers.get(event)?.();
    },
    replaceChildren() {
      this.children = [];
    },
    append(item) {
      this.children.push(item);
    },
  };
}

function setup({ approve = true } = {}) {
  const fields = new Map();
  for (const name of [
    'delete',
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
    fields.set(name, control());
  const panel = {
    ...control(),
    querySelector(selector) {
      return fields.get(selector.match(/^\[data-rank-([a-z]+)\]$/)?.[1]) || null;
    },
  };
  const document = {
    getElementById: (id) => {
      if (id === 'novaRanking') return panel;
      if (id === 'gameVersion') return { textContent: 'v1.24.23' };
      return null;
    },
    createElement: () => control(),
  };
  const state = new Map([['nova-wing-3d-v1', '{"sector":5,"credits":250}']]);
  const storage = {
    getItem: (key) => state.get(key) || null,
    setItem: (key, value) => state.set(key, value),
  };
  const calls = [];
  const responses = new Map();
  let confirmationCount = 0;
  const client = createRankingClient({
    document,
    storage,
    confirmDeletion: (message) => {
      confirmationCount++;
      assert.match(message, /nuvem/);
      return approve;
    },
    fetcher: async (url, options = {}) => {
      const path = new URL(url).pathname;
      calls.push({ path, ...options });
      if (responses.has(path)) return responses.get(path)();
      return {
        ok: true,
        json: async () =>
          path === '/v1/me'
            ? { deleted: true }
            : path === '/v1/runs/start'
              ? { runId: 'mock-run', nonce: 'mock-nonce' }
              : { entries: [] },
      };
    },
  });
  return {
    client,
    storage,
    calls,
    responses,
    field: (name) => fields.get(name),
    clicks: () => confirmationCount,
    setApi: () => client.setRuntimeConfig({ rankingApiUrl: 'https://ranking.example.org' }),
    clickDelete: () => fields.get('delete').trigger('click'),
  };
}

const player = (uid, getIdToken = async () => 'token-' + uid) => ({ uid, getIdToken });
const finish = { sector: 1, points: 75, durationMs: 120000 };

test('delete control fails closed for guest and missing ranking API', () => {
  const app = setup();
  assert.equal(app.field('delete').disabled, true);
  app.client.setUser(player('A'));
  assert.equal(app.field('delete').disabled, true);
  app.setApi();
  assert.equal(app.field('delete').disabled, false);
  app.client.setUser(null);
  assert.equal(app.field('delete').disabled, true);
  app.client.destroy();
});

test('cancelling confirmation never sends delete or alters consent', async () => {
  const app = setup({ approve: false });
  app.setApi();
  app.client.setUser(player('A'));
  app.field('consent').checked = true;
  app.field('nickname').value = 'Alpha';
  await app.clickDelete();
  assert.equal(app.clicks(), 1);
  assert.equal(
    app.calls.some((r) => r.path === '/v1/me'),
    false,
  );
  assert.equal(app.field('consent').checked, true);
  assert.equal(app.field('nickname').value, 'Alpha');
  app.client.destroy();
});

test('confirmed delete sends token-bound DELETE, clears cloud and keeps local gameplay data', async () => {
  const app = setup();
  app.setApi();
  app.client.setUser(player('A'));
  await app.client.onStageFinished(finish);
  const localCount = readLocalHistory(app.storage).length;
  const checkpoint = app.storage.getItem('nova-wing-3d-v1');
  app.field('consent').checked = true;
  app.field('nickname').value = 'Alpha';
  await app.clickDelete();
  assert.equal(app.clicks(), 1);
  const request = app.calls.filter((r) => r.path === '/v1/me');
  assert.equal(request.length, 1);
  assert.equal(request[0].method, 'DELETE');
  assert.equal(request[0].headers.authorization, 'Bearer token-A');
  assert.equal(app.field('consent').checked, false);
  assert.equal(app.field('nickname').value, '');
  assert.match(app.field('status').textContent, /Dados remotos excluídos/);
  assert.equal(app.field('cloud').children[0].textContent, 'Seu histórico remoto foi excluído.');
  assert.equal(readLocalHistory(app.storage).length, localCount);
  assert.equal(app.storage.getItem('nova-wing-3d-v1'), checkpoint);
  assert.equal(app.field('delete').disabled, false);
  app.client.destroy();
});

test('failed delete does not claim remote removal or destroy local results', async () => {
  const app = setup();
  app.setApi();
  app.client.setUser(player('A'));
  await app.client.onStageFinished(finish);
  app.responses.set('/v1/me', async () => ({
    ok: false,
    json: async () => ({ error: 'DATABASE_UNAVAILABLE' }),
  }));
  await app.clickDelete();
  assert.match(app.field('status').textContent, /Não foi possível confirmar/);
  assert.equal(readLocalHistory(app.storage).length, 1);
  assert.equal(app.field('delete').disabled, false);
  app.client.destroy();
});

test('late JWT from A cannot delete data using B session', async () => {
  let release;
  const delayedToken = new Promise((resolve) => {
    release = resolve;
  });
  const app = setup();
  app.setApi();
  app.client.setUser(player('A', () => delayedToken));
  const pending = app.clickDelete();
  app.client.setUser(player('B'));
  release('token-A');
  await pending;
  assert.equal(app.calls.filter((r) => r.path === '/v1/me').length, 0);
  assert.equal(app.field('delete').disabled, false);
  assert.equal(app.field('identity').textContent, 'Google conectado · competição opcional');
  app.client.destroy();
});

test('a duplicate delete click is ignored while the request is in flight', async () => {
  let resolveApi;
  const pendingResponse = new Promise((resolve) => {
    resolveApi = resolve;
  });
  const app = setup();
  app.setApi();
  app.client.setUser(player('A'));
  app.responses.set('/v1/me', () => pendingResponse);
  const first = app.clickDelete();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(app.field('delete').disabled, true);
  await app.clickDelete();
  assert.equal(app.calls.filter((r) => r.path === '/v1/me').length, 1);
  resolveApi({ ok: true, json: async () => ({ deleted: true }) });
  await first;
  assert.equal(app.clicks(), 1);
  app.client.destroy();
});
