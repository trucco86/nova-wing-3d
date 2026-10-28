import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { parsePublicConfig, DEV_FIREBASE } from '../src/runtime-config.js';

export const HML_ORIGIN = 'https://hml.nova-wing-preview.pages.dev';

function readBuildInfo(source) {
  const values = Object.fromEntries(
    String(source)
      .split(/\r?\n/)
      .filter((line) => line.includes('='))
      .map((line) => {
        const equals = line.indexOf('=');
        return [line.slice(0, equals), line.slice(equals + 1)];
      }),
  );
  return values;
}

export function verifyHmlSnapshot({ expectedSha, buildText, indexText, publicConfig }) {
  if (!/^[a-f0-9]{40}$/.test(expectedSha || '')) throw new Error('EXPECTED_SHA_INVALID');
  const build = readBuildInfo(buildText);
  if (build.sha !== expectedSha || build.ref !== 'refs/heads/hml')
    throw new Error('HML_DEPLOYED_SHA_MISMATCH');
  if (
    typeof indexText !== 'string' ||
    !indexText.includes('<html') ||
    !indexText.includes('id="game"')
  )
    throw new Error('HML_GAME_ARTIFACT_INVALID');
  const config = parsePublicConfig(publicConfig, 'hml');
  if (!config) throw new Error('HML_PUBLIC_CONFIG_INVALID');
  return {
    buildMatches: true,
    environment: 'hml',
    identityConfigPresent: true,
    firebaseUsesDevProject: config.firebase.projectId === DEV_FIREBASE.projectId,
    rankingApiConfigured: !!config.rankingApiUrl,
    rankingApiOrigin: config.rankingApiUrl,
  };
}

export async function checkHmlDeployment({
  expectedSha,
  origin = HML_ORIGIN,
  fetcher = fetch,
} = {}) {
  const base = new URL(origin);
  if (base.protocol !== 'https:' || base.origin !== HML_ORIGIN)
    throw new Error('HML_ORIGIN_INVALID');
  const fetchText = async (path) => {
    const response = await fetcher(new URL(path, base), {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('HML_STATIC_HTTP_' + response.status);
    return response.text();
  };
  const [buildText, indexText, configText] = await Promise.all([
    fetchText('/BUILD.txt'),
    fetchText('/index.html'),
    fetchText('/nova-config.json'),
  ]);
  let publicConfig;
  try {
    publicConfig = JSON.parse(configText);
  } catch {
    throw new Error('HML_PUBLIC_JSON_INVALID');
  }
  const report = verifyHmlSnapshot({ expectedSha, buildText, indexText, publicConfig });
  if (report.rankingApiConfigured) {
    const url = new URL('/v1/health', report.rankingApiOrigin);
    const response = await fetcher(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('HML_RANKING_HEALTH_HTTP_' + response.status);
    const health = await response.json().catch(() => null);
    if (health?.status !== 'ok') throw new Error('HML_RANKING_HEALTH_INVALID');
    report.rankingHealthReachable = true;
  } else {
    report.rankingHealthReachable = false;
  }
  return report;
}

export async function retryHmlDeployment({
  expectedSha,
  attempts = 8,
  pauseMs = 5000,
  ...options
}) {
  let lastError;
  for (let n = 1; n <= attempts; n++) {
    try {
      return await checkHmlDeployment({ expectedSha, ...options });
    } catch (error) {
      lastError = error;
      if (n !== attempts) await delay(pauseMs);
    }
  }
  throw lastError;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  retryHmlDeployment({ expectedSha: process.env.GITHUB_SHA })
    .then((report) => {
      // Only booleans and build status. Never log Firebase keys, UID or tokens.
      console.log('HML deployment SHA verified; environment=hml');
      console.log(
        'Firebase configuration present=true; separate HML project=' +
          !report.firebaseUsesDevProject,
      );
      console.log('Ranking API configured=' + report.rankingApiConfigured);
      console.log('Ranking health reachable=' + report.rankingHealthReachable);
      if (!report.rankingApiConfigured)
        console.log('::warning::HML ranking API URL is absent; local scores remain available.');
      if (report.firebaseUsesDevProject)
        console.log('::warning::HML uses the DEV Firebase project; real OAuth was not tested.');
      console.log(
        'OAuth, authenticated scoring, data deletion and D1 were NOT tested by this smoke.',
      );
    })
    .catch((error) => {
      console.error('::error::HML post-deploy smoke failed:', error?.message || 'UNKNOWN');
      process.exitCode = 1;
    });
}
