import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('release gate rejects inconsistent deliverables', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'nova-version-'));
  const run = () =>
    spawnSync(process.execPath, [resolve('tools/version.mjs')], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, NOVA_BASE_SHA: '' },
    });
  const write = (path, value) => writeFileSync(join(cwd, path), value);
  try {
    mkdirSync(join(cwd, 'releases'));
    write('package.json', JSON.stringify({ version: '1.4.0' }));
    const lock = (v) =>
      write('package-lock.json', JSON.stringify({ version: v, packages: { '': { version: v } } }));
    lock('1.4.0');
    write('CHANGELOG.md', '## 1.4.0\n');
    write('releases/v1.4.0.md', '# v1.4.0\n');
    write('index.html', '<span id="gameVersion">v1.4.0</span>');
    assert.equal(run().status, 0);
    for (const version of ['01.4.0', '1.04.0', '1.4.00']) {
      write('package.json', JSON.stringify({ version }));
      assert.match(run().stderr, /Expected MAJOR.MINOR.PATCH/);
    }
    write('package.json', JSON.stringify({ version: '1.4.0' }));
    lock('1.3.0');
    assert.match(run().stderr, /Version differs from lockfile/);
    lock('1.4.0');
    write('index.html', '<span id="gameVersion">v1.3.0</span>');
    assert.match(run().stderr, /Build does not display/);
    write('index.html', '<span id="gameVersion">v1.4.0</span>');
    write('releases/v1.4.0.md', '');
    assert.match(run().stderr, /Missing release notes/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
