import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEV_FIREBASE } from '../src/runtime-config.js';
import {
  HML_ORIGIN,
  verifyHmlSnapshot,
  checkHmlDeployment,
  retryHmlDeployment,
} from '../tools/verify-hml-deploy.mjs';

const sha = 'a'.repeat(40);
const buildText = `sha=${sha}\nref=refs/heads/hml\n`;
const indexText = '<!doctype html><html lang="pt"><canvas id="game"></canvas></html>';
const config = { environment: 'hml', firebase: DEV_FIREBASE, rankingApiUrl: null };

function response(value, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof value === 'string' ? value : JSON.stringify(value)),
    json: async () => (typeof value === 'string' ? JSON.parse(value) : value),
  };
}

function fixture({ build = buildText, html = indexText, publicConfig = config, health } = {}) {
  const calls = [];
  const fetcher = async (url, options = {}) => {
    const parsed = new URL(url);
    calls.push({ url: parsed.href, options });
    if (parsed.href === HML_ORIGIN + '/BUILD.txt') return response(build);
    if (parsed.href === HML_ORIGIN + '/index.html') return response(html);
    if (parsed.href === HML_ORIGIN + '/nova-config.json') return response(publicConfig);
    if (parsed.pathname === '/v1/health' && health) return response(health);
    return response('not found', 404);
  };
  return { calls, fetcher };
}

test('accept only the published HML SHA, branch and actual game HTML', () => {
  const report = verifyHmlSnapshot({
    expectedSha: sha,
    buildText,
    indexText,
    publicConfig: config,
  });
  assert.equal(report.buildMatches, true);
  assert.equal(report.environment, 'hml');
  assert.equal(report.firebaseUsesDevProject, true);
  assert.equal(report.rankingApiConfigured, false);
  assert.throws(() => verifyHmlSnapshot({
    expectedSha: 'b'.repeat(40), buildText, indexText, publicConfig: config,
  }), /HML_DEPLOYED_SHA_MISMATCH/);
  assert.throws(() => verifyHmlSnapshot({
    expectedSha: sha, buildText: `sha=${sha}\nref=refs/heads/main\n`,
    indexText, publicConfig: config,
  }), /HML_DEPLOYED_SHA_MISMATCH/);
  assert.throws(() => verifyHmlSnapshot({
    expectedSha: sha, buildText, indexText: '<html>error</html>', publicConfig: config,
  }), /HML_GAME_ARTIFACT_INVALID/);
});

test('read-only smoke warns about absent score API; never invokes authenticated mutation', async () => {
  const f = fixture();
  const report = await checkHmlDeployment({ expectedSha: sha, fetcher: f.fetcher });
  assert.equal(report.rankingApiConfigured, false);
  assert.equal(report.rankingHealthReachable, false);
  assert.equal(f.calls.length, 3);
  assert.ok(f.calls.every((entry) => entry.options.method === undefined));
  assert.ok(f.calls.every((entry) => !entry.options.headers?.authorization));
});

test('ranking health is probed only when HTTPS API is configured', async () => {
  const f = fixture({
    publicConfig: { ...config, rankingApiUrl: 'https://rank.nova-wing.workers.dev' },
    health: { status: 'ok', scoreSubmissionsEnabled: false },
  });
  const report = await checkHmlDeployment({ expectedSha: sha, fetcher: f.fetcher });
  assert.equal(report.rankingHealthReachable, true);
  assert.equal(f.calls.length, 4);
  assert.equal(f.calls.at(-1).url, 'https://rank.nova-wing.workers.dev/v1/health');
  assert.ok(f.calls.every((entry) => entry.options.method === undefined));
});

test('invalid or production public configuration fails closed', async () => {
  const prod = fixture({ publicConfig: { ...config, environment: 'prod' } });
  await assert.rejects(() => checkHmlDeployment({
    expectedSha: sha, fetcher: prod.fetcher,
  }), /HML_PUBLIC_CONFIG_INVALID/);
  const badUrl = fixture({ publicConfig: { ...config, rankingApiUrl: 'http://127.0.0.1' } });
  await assert.rejects(() => checkHmlDeployment({
    expectedSha: sha, fetcher: badUrl.fetcher,
  }), /HML_PUBLIC_CONFIG_INVALID/);
  const invalidOrigin = fixture();
  await assert.rejects(() => checkHmlDeployment({
    expectedSha: sha, fetcher: invalidOrigin.fetcher,
    origin: 'https://random.example.org',
  }), /HML_ORIGIN_INVALID/);
});

test('bounded CDN retries accept the correct deployment only after stale response recovers', async () => {
  let buildFetches = 0;
  const f = fixture();
  const slowFetch = async (url, options) => {
    if (new URL(url).pathname === '/BUILD.txt') {
      buildFetches++;
      if (buildFetches === 1) return response('sha=' + '0'.repeat(40) + '\nref=refs/heads/hml\n');
    }
    return f.fetcher(url, options);
  };
  const report = await retryHmlDeployment({
    expectedSha: sha, fetcher: slowFetch, attempts: 2, pauseMs: 0,
  });
  assert.equal(report.buildMatches, true);
  assert.equal(buildFetches, 2);
});
