import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../docs/control-center/index.html', import.meta.url), 'utf8');
const source = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
assert.ok(source, 'execute the real dashboard module, not duplicated implementation');

class Node {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.dataset = {};
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren(...children) {
    this.children = [...children];
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }
  emit(name) {
    return this.listeners[name]?.();
  }
}

const responseData = {
  '/issues?state=open&per_page=100': [
    {
      number: 285,
      title: 'Corrigir colisões',
      state: 'open',
      html_url: 'https://github.com/example/285',
      updated_at: '2026-11-10T12:00:00Z',
      user: { login: 'qa' },
    },
    {
      number: 500,
      title: '[monitor] CI bloqueada',
      state: 'open',
      html_url: 'https://github.com/example/500',
      updated_at: '2026-11-10T12:00:00Z',
      user: { login: 'ci' },
    },
    {
      number: 501,
      title: 'PR duplicada na API de issues',
      pull_request: { url: 'https://api.github.com/prs/1' },
    },
  ],
  '/pulls?state=open&per_page=100': [
    {
      number: 317,
      title: 'QA107',
      state: 'open',
      draft: true,
      html_url: 'https://github.com/example/317',
      updated_at: '2026-11-10T12:00:00Z',
      user: { login: 'qa' },
    },
  ],
  '/actions/runs?per_page=40': {
    workflow_runs: [
      {
        id: 90,
        name: 'CI',
        head_branch: 'feature/noisy-build',
        status: 'completed',
        conclusion: 'failure',
        html_url: 'https://github.com/example/runs/90',
        created_at: '2026-11-10T12:30:00Z',
      },
    ],
  },
  '/actions/workflows/ci.yml/runs?branch=main&per_page=1': {
    workflow_runs: [
      {
        id: 88,
        name: 'CI',
        head_branch: 'main',
        head_sha: 'abcdef1234567890',
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.com/example/runs/88',
        created_at: '2026-11-10T12:00:00Z',
      },
    ],
  },
  '/actions/runs/88/jobs?per_page=100': {
    jobs: [
      {
        name: 'pages',
        status: 'completed',
        conclusion: 'success',
        started_at: '2026-11-10T12:15:00Z',
      },
    ],
  },
  '/releases?per_page=20': [
    {
      name: 'Release 1.27',
      tag_name: '1.27',
      html_url: 'https://github.com/example/release',
      published_at: '2026-11-10T12:00:00Z',
    },
  ],
  '/branches/main': { commit: { sha: 'abcdef1234567890' } },
  '/pulls?state=closed&sort=updated&direction=desc&per_page=30': [
    {
      number: 312,
      title: 'Release QA106',
      merged_at: '2026-11-10T11:00:00Z',
      html_url: 'https://github.com/example/312',
    },
  ],
};

function harness({ staleMainCi = false } = {}) {
  const ids = {};
  const getNode = (id) => (ids[id] ??= new Node());
  const tabs = ['tasks', 'prs', 'blockers'].map((tab) => {
    const element = new Node('button');
    element.dataset.tab = tab;
    return element;
  });
  const timers = new Map();
  const calls = [];
  let nextTimer = 0;
  let fail = false;
  let remaining = '50';
  const reset = String(Math.floor(Date.now() / 1000) + 3600);
  const document = {
    getElementById: getNode,
    createElement: (tag) => new Node(tag),
    querySelectorAll: () => tabs,
  };
  getNode('interval').value = '1800000';
  const sandbox = {
    document,
    fetch: async (url) => {
      const route =
        new URL(url).pathname.replace('/repos/trucco86/nova-wing-3d', '') + new URL(url).search;
      calls.push(route);
      const data = structuredClone(responseData[route]);
      if (staleMainCi && route === '/actions/workflows/ci.yml/runs?branch=main&per_page=1')
        data.workflow_runs[0].head_sha = 'outdated-commit';
      return {
        ok: !fail && data !== undefined,
        status: fail ? 503 : data === undefined ? 404 : 200,
        headers: {
          get: (name) =>
            name === 'x-ratelimit-remaining'
              ? remaining
              : name === 'x-ratelimit-reset'
                ? reset
                : null,
        },
        json: async () => structuredClone(data),
      };
    },
    setInterval: (fn, ms) => {
      const id = ++nextTimer;
      timers.set(id, { fn, ms });
      return id;
    },
    clearInterval: (id) => timers.delete(id),
    Date,
    Intl,
  };
  vm.runInNewContext(source, sandbox, { filename: 'control-center-browser-module.js' });
  return {
    ids,
    tabs,
    calls,
    timers,
    setFail: (value) => {
      fail = value;
    },
    setRemaining: (value) => {
      remaining = String(value);
    },
  };
}

function labels(node) {
  return [node.textContent, ...node.children.map(labels)].join(' ');
}
async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

test('real dashboard loads data and filters PRs, tasks and monitor blockers', async () => {
  const app = harness();
  await settle();
  assert.equal(app.ids.tasks.textContent, 1);
  assert.equal(app.ids.prs.textContent, 1);
  assert.equal(app.ids.ci.textContent, 'Aprovado');
  assert.equal(app.ids.deploy.textContent, 'Aprovado');
  assert.match(labels(app.ids['work-list']), /Corrigir colisões/);
  assert.doesNotMatch(labels(app.ids['work-list']), /CI bloqueada/);
  app.tabs[1].emit('click');
  assert.match(labels(app.ids['work-list']), /QA107/);
  app.tabs[2].emit('click');
  assert.match(labels(app.ids['work-list']), /CI bloqueada/);
  assert.doesNotMatch(labels(app.ids['work-list']), /Corrigir colisões/);
  assert.equal(app.calls.length, 8);
  assert.ok(app.calls.includes('/actions/workflows/ci.yml/runs?branch=main&per_page=1'));
  assert.equal(app.ids.error.hidden, true);
});

test('dashboard never shows stale CI from a previous main commit', async () => {
  const app = harness({ staleMainCi: true });
  await settle();
  assert.equal(app.ids.ci.textContent, 'Sem dados');
  assert.equal(app.ids.deploy.textContent, 'Sem dados');
  assert.equal(app.calls.length, 7, 'no Pages lookup for an outdated CI');
});

test('refresh cadence is exclusive and API failures keep previously rendered data', async () => {
  const app = harness();
  await settle();
  assert.deepEqual(
    [...app.timers.values()].map((x) => x.ms),
    [1800000],
  );
  app.ids.interval.value = '3600000';
  app.ids.interval.emit('change');
  assert.deepEqual(
    [...app.timers.values()].map((x) => x.ms),
    [3600000],
  );
  app.ids.interval.value = '0';
  app.ids.interval.emit('change');
  assert.equal(app.timers.size, 0);
  app.setFail(true);
  await app.ids.refresh.emit('click');
  assert.equal(app.ids.tasks.textContent, 1);
  assert.equal(app.ids.error.hidden, false);
  assert.match(app.ids.error.textContent, /Não foi possível atualizar/);
});

test('GitHub rate limit reset suspends further requests without deleting prior results', async () => {
  const app = harness();
  await settle();
  const before = app.calls.length;
  app.setRemaining(6);
  await app.ids.refresh.emit('click');
  const after = app.calls.length;
  assert.ok(after > before, 'one refresh checks server rate-limit headers');
  await app.ids.refresh.emit('click');
  assert.equal(app.calls.length, after, 'blocked requests do not hit GitHub before reset');
  assert.equal(app.ids.tasks.textContent, 1);
  assert.equal(app.ids.error.hidden, false);
  assert.match(app.ids.error.textContent, /limite/i);
});
