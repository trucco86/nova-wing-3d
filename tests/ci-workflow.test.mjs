import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

test('each browser shard builds current HTML before the release and browser gates', () => {
  const ci = parse(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
  const steps = ci.jobs['browser-shard'].steps;
  const commands = steps.filter((step) => typeof step.run === 'string').map((step) => step.run.trim());
  const installIndex = commands.indexOf('npm ci');
  const buildIndex = commands.indexOf('npm run build');
  const validateIndex = commands.indexOf('npm run validate -- --browser');
  assert.ok(installIndex >= 0, 'Browser shards must install dependencies');
  assert.ok(buildIndex > installIndex, 'Browser shards must build after npm ci');
  assert.ok(validateIndex > buildIndex, 'Browser validation requires a fresh versioned build');
});
