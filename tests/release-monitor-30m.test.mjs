import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import YAML from 'yaml';

const workflow = YAML.parse(
  readFileSync(new URL('../.github/workflows/nova-release-monitor.yml', import.meta.url), 'utf8'),
);
const script = workflow.jobs.monitor.steps[0].with.script;
assert.ok(script.includes('listWorkflowRuns'), 'tests execute actual workflow logic');

function makeHarness({ ciStatus = 'completed', ciConclusion = 'success', ciAge = 20,
  pagesStatus = 'completed', pagesConclusion = 'success', existingBlocker = false,
  siteStatus = 200 } = {}) {
  let now = Date.parse('2026-11-10T20:00:00Z');
  const sha = '0123456789abcdef0123456789abcdef01234567';
  let nextNumber = 600;
  const issues = existingBlocker ? [{
    number: 500,
    title: '[monitor] Nova Wing: bloqueio de release',
    body: 'Problema anterior',
    state: 'open',
    html_url: 'https://github.com/example/issues/500',
  }] : [];
  const calls = { ci: [], searches: [], updates: [], comments: [], created: [] };
  const ci = {
    id: 77, head_sha: sha, name: 'CI', status: ciStatus, conclusion: ciConclusion,
    created_at: new Date(now - ciAge * 60000).toISOString(),
    html_url: 'https://github.com/example/actions/runs/77',
  };
  const pages = { name: 'pages', status: pagesStatus, conclusion: pagesConclusion };
  const github = {
    rest: {
      repos: { getBranch: async () => ({ data: { commit: { sha } } }) },
      actions: {
        listWorkflowRuns: async (args) => {
          calls.ci.push(args);
          return { data: { workflow_runs: [ci] } };
        },
        listJobsForWorkflowRun: async () => ({ data: { jobs: [pages] } }),
      },
      search: {
        issuesAndPullRequests: async ({ q }) => {
          calls.searches.push(q);
          const wanted = q.match(/"([^"]+)"$/)?.[1];
          return { data: { items: issues.filter((issue) => issue.title === wanted) } };
        },
      },
      issues: {
        create: async (args) => {
          const issue = {
            number: ++nextNumber, title: args.title, body: args.body, state: 'open',
            html_url: 'https://github.com/example/issues/' + nextNumber,
          };
          issues.push(issue);
          calls.created.push(issue);
          return { data: issue };
        },
        update: async (args) => {
          const issue = issues.find((item) => item.number === args.issue_number);
          assert.ok(issue, 'update only a known issue');
          if (args.state) issue.state = args.state;
          if (args.body) issue.body = args.body;
          calls.updates.push(args);
          return { data: issue };
        },
        createComment: async (args) => {
          calls.comments.push(args);
          return { data: { id: calls.comments.length } };
        },
      },
    },
  };
  const core = { info() {}, warning() {} };
  const FakeDate = class extends Date {
    static now() { return now; }
  };
  const sandbox = {
    github,
    context: { repo: { owner: 'trucco86', repo: 'nova-wing-3d' } },
    core,
    fetch: async () => ({
      ok: siteStatus === 200,
      status: siteStatus,
      text: async () => '<html><title>Nova Wing</title></html>',
    }),
    AbortSignal,
    Buffer,
    Date: FakeDate,
  };
  return {
    ci,
    pages,
    calls,
    issues,
    run: () => vm.runInNewContext('(async () => {\n' + script + '\n})()', sandbox),
    advance: (minutes) => { now += minutes * 60000; },
  };
}

test('CI is selected by workflow and SHA, not confused with monitor executions', async () => {
  const h = makeHarness();
  await h.run();
  assert.equal(h.calls.ci.length, 1);
  assert.equal(h.calls.ci[0].workflow_id, 'ci.yml');
  assert.equal(h.calls.ci[0].head_sha, h.ci.head_sha);
  assert.equal(h.calls.created.length, 1, 'only one successful release notice');
  assert.equal(h.calls.created[0].state, 'closed');
  assert.ok(h.calls.searches.every((query) => query.includes('is:issue in:title')));
});

test('pending CI and queued Pages cannot close or recreate an existing blocker', async () => {
  const h = makeHarness({
    ciStatus: 'in_progress', ciConclusion: null,
    pagesStatus: 'queued', pagesConclusion: null, existingBlocker: true,
  });
  await h.run();
  assert.equal(h.issues[0].state, 'open');
  assert.equal(h.calls.comments.length, 0);
  assert.equal(h.calls.created.length, 0);
  assert.equal(h.calls.updates.length, 0);
});

test('elapsed minutes never change the identity of an unresolved stuck CI', async () => {
  const h = makeHarness({
    ciStatus: 'in_progress', ciConclusion: null, ciAge: 100,
    pagesStatus: 'queued', pagesConclusion: null,
  });
  await h.run();
  assert.equal(h.calls.created.length, 1);
  const original = h.issues[0].body;
  assert.match(original, /CI sem concluir há 100 min/);
  h.advance(30);
  await h.run();
  assert.equal(h.calls.created.length, 1);
  assert.equal(h.calls.comments.length, 0);
  assert.equal(h.issues[0].state, 'open');
  assert.match(h.issues[0].body, /monitor-fingerprint:/);
});

test('only full CI, Pages and site recovery closes the same old issue', async () => {
  const h = makeHarness({
    ciStatus: 'completed', ciConclusion: 'success',
    pagesStatus: 'in_progress', pagesConclusion: null, existingBlocker: true,
  });
  await h.run();
  assert.equal(h.issues[0].state, 'open');
  h.pages.status = 'completed';
  h.pages.conclusion = 'success';
  await h.run();
  assert.equal(h.issues[0].state, 'closed');
  assert.equal(h.calls.comments.length, 1);
  assert.equal(h.calls.created.length, 0);
});

test('production HTTP failures remain actionable even when CI and Pages are green', async () => {
  const h = makeHarness({ siteStatus: 503, existingBlocker: true });
  await h.run();
  assert.equal(h.issues[0].state, 'open');
  assert.match(h.issues[0].body, /Produção HTTP 503/);
  assert.equal(h.calls.created.length, 0);
});
