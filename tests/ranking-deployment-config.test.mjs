import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workerDeploymentConfig } from '../tools/write-ranking-worker-config.mjs';

const db = '12345678-1234-1234-1234-123456789abc';
test('HML Worker uses its own database and exact Origin', () => {
  const text = workerDeploymentConfig({
    target: 'hml',
    databaseId: db,
    firebaseProjectId: 'nova-wing-dev',
    enableWrites: true,
  });
  assert.match(text, /name = "nova-wing-ranking-hml"/);
  assert.match(text, /hml\.nova-wing-preview\.pages\.dev/);
  assert.match(text, /SCORE_WRITE_ENABLED = "true"/);
  assert.match(text, /database_id = "12345678-/);
});
test('PROD cannot reuse DEV Firebase, and writes are disabled by default', () => {
  assert.throws(
    () =>
      workerDeploymentConfig({
        target: 'prod',
        databaseId: db,
        firebaseProjectId: 'nova-wing-dev',
      }),
    /Production cannot trust/,
  );
  const text = workerDeploymentConfig({
    target: 'prod',
    databaseId: db,
    firebaseProjectId: 'nova-wing-prod',
  });
  assert.match(text, /SCORE_WRITE_ENABLED = "false"/);
  assert.match(text, /trucco86\.github\.io/);
  assert.doesNotMatch(text, /nova-wing-dev/);
});
test('missing or malicious migration target inputs fail closed', () => {
  assert.throws(
    () =>
      workerDeploymentConfig({
        target: 'hml',
        databaseId: 'bad',
        firebaseProjectId: 'nova-wing-dev',
      }),
    /Dedicated D1 ID/,
  );
  assert.throws(
    () =>
      workerDeploymentConfig({
        target: 'hml',
        databaseId: db,
        firebaseProjectId: 'nova-wing-dev"; evil = "x',
      }),
    /Valid Firebase/,
  );
});
