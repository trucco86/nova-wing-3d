import { spawnSync } from 'node:child_process';

// Local fail-fast gate: repair generated assets before validating the commit.
const fix = process.argv.includes('--fix');
const commands = fix ? ['format', 'build', 'validate'] : ['validate'];
for (const command of commands) {
  console.log(`[preflight] npm run ${command}`);
  const result = spawnSync('npm', ['run', command], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('[preflight] All checks passed.');
