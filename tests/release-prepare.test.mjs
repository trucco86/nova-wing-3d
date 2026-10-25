import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releasePlan } from '../tools/release-prepare.mjs';

const fixture = {
  package: { name: 'nova-wing-3d', version: '1.24.2' },
  lock: {
    name: 'nova-wing-3d',
    version: '1.24.2',
    packages: { '': { version: '1.24.2' }, other: { version: '1.0.0' } },
  },
  iosProject:
    'MARKETING_VERSION = 1.24.2;\nCURRENT_PROJECT_VERSION = 1024002;\n' +
    'MARKETING_VERSION = 1.24.2;\nCURRENT_PROJECT_VERSION = 1024002;\n',
  changelog: '# Histórico\n\n## 1.24.2 — Versão atual\n',
};

test('release preparation synchronizes both iOS targets and package lock', () => {
  const result = releasePlan('1.24.3', fixture);
  assert.equal(result.packageJson.version, '1.24.3');
  assert.equal(result.lockJson.version, '1.24.3');
  assert.equal(result.lockJson.packages[''].version, '1.24.3');
  assert.equal(result.lockJson.packages.other.version, '1.0.0');
  assert.equal(result.iosProject.match(/MARKETING_VERSION = 1.24.3;/g).length, 2);
  assert.equal(result.iosProject.match(/CURRENT_PROJECT_VERSION = 1024003;/g).length, 2);
  assert.ok(result.changelog.includes('## 1.24.3'));
  assert.ok(result.notes.includes('v1.24.3'));
  assert.ok(result.notes.includes('Não publicar'));
});

test('version plan is idempotent and does not duplicate changelog headings', () => {
  const once = releasePlan('1.24.3', fixture);
  const twice = releasePlan('1.24.3', {
    package: once.packageJson,
    lock: once.lockJson,
    iosProject: once.iosProject,
    changelog: once.changelog,
  });
  assert.equal(twice.changelog, once.changelog);
  assert.equal(twice.iosProject, once.iosProject);
});

test('version plan rejects invalid versions and downgrades', () => {
  for (const version of ['bad', '1.2', '01.24.3', '1.23.9', '0.99.99']) {
    assert.throws(() => releasePlan(version, fixture));
  }
});
