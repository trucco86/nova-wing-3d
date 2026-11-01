import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const workflow = (name) =>
  parse(readFileSync(new URL('../.github/workflows/' + name, import.meta.url), 'utf8'));
const commands = (job) =>
  job.steps.flatMap((step) =>
    typeof step.run === 'string'
      ? step.run
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : [],
  );

test('release quality checks committed output before rebuilding; browser shards execute real Playwright', () => {
  const ci = workflow('ci.yml');
  const quality = commands(ci.jobs.quality);
  const browser = commands(ci.jobs['browser-shard']);
  for (const [name, steps] of [
    ['quality', quality],
    ['browser-shard', browser],
  ]) {
    const install = steps.indexOf('npm ci');
    const check = steps.indexOf('npm run build:check');
    const build = steps.indexOf('npm run build');
    assert.ok(install >= 0, name + ' installs locked dependencies');
    assert.ok(check > install, name + ' rejects stale committed HTML before build');
    assert.ok(build > check, name + ' rebuilds only after verifying source and distribution');
  }
  assert.ok(
    browser.includes('npm run test:browser -- --shard="$NOVA_BROWSER_SHARD"'),
    'all four real browser shards must execute Playwright, not mocks',
  );
  assert.equal(
    browser.some((line) => line.startsWith('npm run validate')),
    false,
    'Node/lint/invariant suite must not run four redundant times',
  );
  assert.ok(quality.includes('npm run validate'), 'full Node gate remains compulsory');
  assert.deepEqual(ci.jobs['browser-shard'].strategy.matrix.shard, [1, 2, 3, 4]);
  assert.equal(ci.jobs.pages.needs, 'browser', 'production Pages is gated by browser results');
  assert.deepEqual(ci.jobs.browser.needs, ['quality', 'browser-shard']);
});

test('preview builds fresh sources and runs FAST tests but never grants release status', () => {
  const preview = workflow('cloudflare-preview.yml');
  const steps = commands(preview.jobs.deploy);
  const install = steps.indexOf('npm ci');
  const build = steps.indexOf('npm run build');
  const check = steps.indexOf('npm run build:check');
  const fast = steps.indexOf('npm run test:fast -- --scope=auto');
  assert.ok(install >= 0 && build > install);
  assert.ok(check > build, 'QA preview checks its freshly built source artifact');
  assert.ok(fast > check, 'FAST checks are mandatory before the QA preview is published');
  assert.equal(
    steps.includes('npm run validate'),
    false,
    'Preview deliberately has a separate non-release gate; FULL stays on CI',
  );
  assert.equal(preview.jobs.deploy.environment, 'nova-preview');
  assert.match(
    String(preview.jobs.deploy.if),
    /head\.repo\.full_name == github\.repository/,
    'untrusted forks must never receive Cloudflare secrets',
  );
  assert.ok(
    preview.jobs.deploy.steps.some((step) =>
      String(step.run).includes('Preview-only gate. Full Node and browser CI remain required'),
    ),
    'QA-only semantics must be explicit in pipeline output',
  );
});
