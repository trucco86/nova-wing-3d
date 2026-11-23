import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function selectHealthyCheckpoint(cwd, failedSha) {
  if (git(cwd, 'rev-parse', 'main') !== failedSha) {
    throw new Error('Main advanced; stale rollback forbidden');
  }
  const tags = git(cwd, 'tag', '-l', 'production-good-*', '--sort=-creatordate');
  for (const tag of tags.split('\n').filter(Boolean)) {
    const sha = git(cwd, 'rev-list', '-n', '1', tag);
    if (sha === failedSha) continue;
    try {
      git(cwd, 'merge-base', '--is-ancestor', sha, failedSha);
      return sha;
    } catch {
      // Reject checkpoints from unrelated history.
    }
  }
  throw new Error('No verified healthy checkpoint');
}

test('production rollback selects an ancestor checkpoint, rejects stale and missing checkpoints', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'nova-rollback-'));
  try {
    git(cwd, 'init', '-b', 'main');
    git(cwd, 'config', 'user.name', 'Nova CI');
    git(cwd, 'config', 'user.email', 'ci@example.invalid');
    git(cwd, 'commit', '--allow-empty', '-m', 'healthy');
    const healthy = git(cwd, 'rev-parse', 'HEAD');
    git(cwd, 'tag', 'production-good-' + healthy);
    git(cwd, 'commit', '--allow-empty', '-m', 'failed deployment');
    const failed = git(cwd, 'rev-parse', 'HEAD');
    assert.equal(selectHealthyCheckpoint(cwd, failed), healthy);
    assert.throws(() => selectHealthyCheckpoint(cwd, healthy), /stale rollback/);
    git(cwd, 'tag', '-d', 'production-good-' + healthy);
    assert.throws(() => selectHealthyCheckpoint(cwd, failed), /No verified healthy checkpoint/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
