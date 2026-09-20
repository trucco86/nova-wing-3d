import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  lstatSync,
  readlinkSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const started = new Date().toISOString();
mkdirSync('artifacts', { recursive: true });
const excludes = new Set([
  '.git',
  'node_modules',
  'artifacts',
  'test-results',
  'playwright-report',
]);
function files(dir = '.') {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      excludes.has(e.name) ? [] : e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
    )
    .sort();
}
const hash = createHash('sha256');
for (const f of files())
  hash.update(f).update(lstatSync(f).isSymbolicLink() ? readlinkSync(f) : readFileSync(f));
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim() || null;
const commands = ['format:check', 'lint', 'test', 'check:repo', 'build:check'];
if (process.argv.includes('--browser')) commands.push('test:browser');
const checks = [];
for (const command of commands) {
  const start = Date.now();
  const r = spawnSync('npm', ['run', command], { encoding: 'utf8', timeout: 180000 });
  const output = (r.stdout ?? '') + (r.stderr ?? '');
  writeFileSync(`artifacts/${command.replaceAll(':', '-')}.log`, output);
  process.stdout.write(output);
  checks.push({
    command,
    exitCode: r.status ?? 1,
    durationMs: Date.now() - start,
    error: r.error?.message ?? null,
  });
  if (r.status !== 0) break;
}
const passed = checks.length === commands.length && checks.every((c) => c.exitCode === 0);
writeFileSync(
  'artifacts/validation.json',
  JSON.stringify(
    {
      started,
      finished: new Date().toISOString(),
      commit,
      sourceDigest: hash.digest('hex'),
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
