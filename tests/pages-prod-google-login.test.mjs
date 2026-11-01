import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { generatePublicConfig } from '../tools/write-public-config.mjs';

const workflow = YAML.parse(
  readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'),
);
const pagesSteps = workflow.jobs.pages.steps;
const configStep = pagesSteps.find((step) => step.name?.includes('optional Google login config'));
const artifactStep = pagesSteps.find((step) =>
  String(step.uses || '').includes('upload-pages-artifact'),
);

test('Pages generates public Firebase config strictly before the published artifact', () => {
  assert.ok(configStep, 'Pages requires the guarded PROD OAuth configuration step');
  assert.ok(artifactStep, 'Pages artifact upload stays enabled');
  assert.ok(pagesSteps.indexOf(configStep) < pagesSteps.indexOf(artifactStep));
  assert.equal(configStep.env.NOVA_ENV, 'prod');
  assert.equal(
    configStep.env.NOVA_FIREBASE_CONFIG_JSON,
    '${{ vars.NOVA_FIREBASE_PROD_CONFIG_JSON }}',
  );
  assert.equal(
    configStep.env.NOVA_RANKING_API_URL,
    '',
    'ranking stays local until separately approved',
  );
  assert.match(
    configStep.run,
    /node tools\/write-public-config\.mjs public-site\/nova-config\.json/,
  );
  assert.doesNotMatch(configStep.run, /cat .*nova-config|echo .*FIREBASE_CONFIG_JSON/);
});

test('PROD config rejects DEV identities and fails closed', () => {
  assert.equal(generatePublicConfig({ environment: 'prod' }), null);
  assert.throws(
    () =>
      generatePublicConfig({
        environment: 'prod',
        firebaseJson: JSON.stringify({
          apiKey: 'firebase-dev-public-key',
          authDomain: 'nova-wing-dev.firebaseapp.com',
          projectId: 'nova-wing-dev',
          appId: 'dev-web-app',
        }),
      }),
    /Invalid environment/,
  );
});

test('valid dedicated PROD Firebase Web project enables login without remote ranking', () => {
  const config = generatePublicConfig({
    environment: 'prod',
    firebaseJson: JSON.stringify({
      apiKey: 'production-public-example-key',
      authDomain: 'nova-wing-prod.firebaseapp.com',
      projectId: 'nova-wing-prod',
      appId: '1:123456789:web:production-webapp',
    }),
  });
  assert.equal(config.environment, 'prod');
  assert.equal(config.firebase.projectId, 'nova-wing-prod');
  assert.equal(config.rankingApiUrl, null);
});
