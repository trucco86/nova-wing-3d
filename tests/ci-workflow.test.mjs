import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

test('each browser shard builds current HTML before the release and browser gates', () => {
  const ci = parse(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
  const steps = ci.jobs['browser-shard'].steps;
  const commands = steps
    .filter((step) => typeof step.run === 'string')
    .map((step) => step.run.trim());
  const installIndex = commands.indexOf('npm ci');
  const buildIndex = commands.indexOf('npm run build');
  const validateIndex = commands.indexOf('npm run validate -- --browser');
  assert.ok(installIndex >= 0, 'Browser shards must install dependencies');
  assert.ok(buildIndex > installIndex, 'Browser shards must build after npm ci');
  assert.ok(validateIndex > buildIndex, 'Browser validation requires a fresh versioned build');
});

test('release pipelines reject a stale committed HTML before any rebuilding', () => {
  const ci = parse(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
  const preview = parse(
    readFileSync(new URL('../.github/workflows/cloudflare-preview.yml', import.meta.url), 'utf8'),
  );
  for (const [name, job] of [
    ['quality', ci.jobs.quality],
    ['browser-shard', ci.jobs['browser-shard']],
    ['cloudflare deploy', preview.jobs.deploy],
  ]) {
    const commands = job.steps
      .filter((step) => typeof step.run === 'string')
      .map((step) => step.run.trim());
    const installIndex = commands.indexOf('npm ci');
    const checkIndex = commands.indexOf('npm run build:check');
    const buildIndex = commands.indexOf('npm run build');
    assert.ok(installIndex >= 0, name + ' must install the locked dependencies');
    assert.ok(checkIndex > installIndex, name + ' must check the committed bundle');
    assert.ok(buildIndex > checkIndex, name + ' must not overwrite a stale bundle before checking');
  }
});
