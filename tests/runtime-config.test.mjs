import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEV_FIREBASE, novaEnvironment, parsePublicConfig, loadPublicConfig } from '../src/runtime-config.js';
import { generatePublicConfig } from '../tools/write-public-config.mjs';

const PROD = {
  apiKey: 'example-public-firebase-key-not-secret',
  authDomain: 'nova-wing-prod.firebaseapp.com',
  projectId: 'nova-wing-prod',
  appId: '1:123456789:web:production-test',
};

test('only precise DEV/HML/PROD/local opt-in hosts can initialize Google', () => {
  assert.equal(novaEnvironment('dev.nova-wing-preview.pages.dev'), 'dev');
  assert.equal(novaEnvironment('hml.nova-wing-preview.pages.dev'), 'hml');
  assert.equal(novaEnvironment('trucco86.github.io'), 'prod');
  assert.equal(novaEnvironment('localhost', '?auth=1'), 'local');
  assert.equal(novaEnvironment('localhost', ''), null);
  assert.equal(novaEnvironment('pr-107.nova-wing-preview.pages.dev'), null);
  assert.equal(novaEnvironment('fake-trucco86.github.io'), null);
});

test('production never falls back to development Firebase project or wrong environment', async () => {
  const offline = async () => { throw new Error('offline'); };
  assert.equal(await loadPublicConfig('prod', { fetchConfig: offline }), null);
  assert.equal((await loadPublicConfig('hml', { fetchConfig: offline })).firebase.projectId,
    DEV_FIREBASE.projectId);
  assert.equal(parsePublicConfig({
    environment: 'prod', firebase: DEV_FIREBASE,
  }, 'prod'), null);
  assert.equal(parsePublicConfig({
    environment: 'hml', firebase: PROD,
  }, 'prod'), null);
  assert.equal(generatePublicConfig({ environment: 'prod' }), null);
});

test('PROD loads separately configured Firebase and HTTPS API without exposing secrets', async () => {
  const publicConfig = generatePublicConfig({
    environment: 'prod',
    firebaseJson: JSON.stringify(PROD),
    rankingApiUrl: 'https://nova-ranking-prod.example.net/',
  });
  assert.equal(publicConfig.firebase.projectId, 'nova-wing-prod');
  assert.equal((await loadPublicConfig('prod', {
    fetchConfig: async () => ({ ok: true, json: async () => publicConfig }),
  })).rankingApiUrl, 'https://nova-ranking-prod.example.net');
  assert.equal(parsePublicConfig({
    ...publicConfig,
    rankingApiUrl: 'http://insecure.example.com',
  }, 'prod'), null);
  assert.equal(parsePublicConfig({
    ...publicConfig,
    rankingApiUrl: 'https://example.com/private/path',
  }, 'prod'), null);
});

test('DEV/HML generator uses isolated environment labels, never PR preview', () => {
  assert.equal(generatePublicConfig({ environment: 'preview' }), null);
  assert.equal(generatePublicConfig({ environment: 'hml' }).environment, 'hml');
  assert.throws(() => generatePublicConfig({
    environment: 'prod', firebaseJson: '{invalid',
  }), /Invalid Firebase/);
});
