import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { sourceDigest } from './source-digest.mjs';
const started = new Date().toISOString();
mkdirSync('artifacts', { recursive: true });
const digest = sourceDigest();
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim() || null;
const commands = ['format:check', 'lint', 'test', 'check:repo', 'build:check'];
if (process.argv.includes('--browser')) commands.push('test:browser');
const checks = [];
for (const command of commands) {
  const start = Date.now();
  const args = ['run', command];
  if (command === 'test:browser' && process.env.NOVA_BROWSER_SHARD) {
    const shard = process.env.NOVA_BROWSER_SHARD;
    const parts = shard.split('/');
    if (
      parts.length !== 2 ||
      parts.some((part) => !part || !Number.isSafeInteger(Number(part)) || Number(part) < 1)
    )
      throw new Error('Invalid browser shard');
    args.push('--', '--shard=' + shard);
  }
  const r = spawnSync('npm', args, {
    encoding: 'utf8',
    // Four software-rendered WebGL shards can exceed 12 minutes while still
    // passing real assertions. Let Playwright finish; the job retains a
    // separate 25-minute hard ceiling and still fails on every test error.
    timeout: command === 'test:browser' ? 1200000 : 180000,
  });
  const output = (r.stdout ?? '') + (r.stderr ?? '');
  writeFileSync(`artifacts/${command.replaceAll(':', '-')}.log`, output);
  process.stdout.write(output);
  checks.push({
    command,
    exitCode: r.error ? 1 : (r.status ?? 1),
    durationMs: Date.now() - start,
    error: r.error?.message ?? null,
  });
  if (r.error || r.status !== 0) break;
}
const passed = checks.length === commands.length && checks.every((c) => c.exitCode === 0);
writeFileSync(
  'artifacts/validation.json',
  JSON.stringify(
    {
      started,
      finished: new Date().toISOString(),
      commit,
      sourceDigest: digest,
      passed,
      checks,
      browser: process.argv.includes('--browser') ? 'executed' : 'not-run',
    },
    null,
    2,
  ) + '\n',
);
console.log(`Validation ${passed ? 'PASSED' : 'FAILED'}; evidence: artifacts/validation.json`);
process.exitCode = passed ? 0 : 1;
