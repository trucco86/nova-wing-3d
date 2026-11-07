import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { changedFiles, selectFastTests } from './fast-plan.mjs';

const started = Date.now();
const scopeArg = process.argv.find((arg) => arg.startsWith('--scope='));
const scope = scopeArg?.slice('--scope='.length) || 'auto';
const changed = changedFiles();
const plan = selectFastTests(changed, scope);
const stages = [
  ['format:check', 'npm', ['run', 'format:check']],
  ['lint', 'npm', ['run', 'lint']],
  ['check:repo', 'npm', ['run', 'check:repo']],
  ['selected-node-tests', process.execPath, ['--test', ...plan.tests]],
];
const checks = [];
let passed = true;
for (const [name, command, args] of stages) {
  const start = Date.now();
  console.log('[FAST]', name, '|', plan.areas.join(','), '|', plan.tests.length, 'tests/files');
  const result = spawnSync(command, args, { stdio: 'inherit', timeout: 120000 });
  checks.push({
    name,
    passed: !result.error && result.status === 0,
    durationMs: Date.now() - start,
  });
  if (result.error || result.status !== 0) {
    passed = false;
    break;
  }
}
mkdirSync('artifacts', { recursive: true });
writeFileSync(
  'artifacts/fast-validation.json',
  JSON.stringify(
    {
      kind: 'early-feedback-not-release',
      passed,
      commit: process.env.GITHUB_SHA || null,
      changedFiles: changed,
      scope,
      selectedAreas: plan.areas,
      selectedTests: plan.tests,
      checks,
      durationMs: Date.now() - started,
      warning: 'Does not replace npm run validate or the full four-shard Playwright gate.',
    },
    null,
    2,
  ) + '\n',
);
console.log('[FAST] ' + (passed ? 'PASS' : 'FAIL') + ' — never a release approval.');
if (!passed) process.exitCode = 1;
