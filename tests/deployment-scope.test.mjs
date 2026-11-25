import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLISHED_WEB_FILES, decidePagesDeployment } from '../tools/deployment-scope.mjs';

const beforeSha = 'a'.repeat(40);
const currentSha = 'b'.repeat(40);
const decide = (changedFiles, extra = {}) =>
  decidePagesDeployment({
    eventName: 'push',
    beforeSha,
    currentSha,
    changedFiles,
    ...extra,
  });

test('all files copied to the published site are in the deployment contract', () => {
  assert.deepEqual(PUBLISHED_WEB_FILES, [
    'index.html',
    '.nojekyll',
    'LICENSE',
    'docs/THREE-LICENSE.txt',
    'docs/control-center/index.html',
  ]);
  for (const path of PUBLISHED_WEB_FILES) {
    assert.equal(decide([path]).deploy, true, path);
  }
});

test('observability-only changes still run CI but cannot redeploy unchanged website', () => {
  assert.equal(
    decide([
      '.github/workflows/gameplay-observer.yml',
      '.github/workflows/ci.yml',
      'tools/gameplay-observer-summary.mjs',
      'tools/gameplay-observer-video.mjs',
      'tools/deployment-scope.mjs',
      'tests/browser/gameplay-quality-observer.spec.mjs',
      'package.json',
      'package-lock.json',
      'docs/GAMEPLAY-QUALITY-AGENT.md',
    ]).deploy,
    false,
  );
  assert.equal(decide([]).deploy, false);
});

test('gameplay build and Control Center changes trigger deployment', () => {
  assert.equal(decide(['tools/foo.mjs', 'index.html']).deploy, true);
  assert.equal(decide(['docs/control-center/index.html']).deploy, true);
});

test('unknown push history fails open rather than silently skipping production', () => {
  assert.equal(decide(['tools/foo.mjs'], { beforeSha: '' }).deploy, true);
  assert.equal(decide(['tools/foo.mjs'], { currentSha: '' }).deploy, true);
  assert.equal(decide(['tools/foo.mjs'], { diffAvailable: false }).deploy, true);
  assert.equal(decide(['tools/foo.mjs'], { beforeSha: '0'.repeat(40) }).deploy, false);
});

test('manually dispatched workflow can publish an unchanged site intentionally', () => {
  assert.equal(decide([], { eventName: 'workflow_dispatch' }).deploy, true);
});
