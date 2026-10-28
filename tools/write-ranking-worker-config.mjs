import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function workerDeploymentConfig({
  target,
  databaseId,
  firebaseProjectId,
  season = 'current',
  enableWrites = false,
} = {}) {
  if (!['hml', 'prod'].includes(target)) throw new Error('HML or PROD environment required');
  if (!/^[a-f0-9-]{36}$/i.test(databaseId || '')) throw new Error('Dedicated D1 ID is required');
  if (!/^[a-z0-9][a-z0-9-]{4,60}$/.test(firebaseProjectId || ''))
    throw new Error('Valid Firebase project ID required');
  if (target === 'prod' && firebaseProjectId === 'nova-wing-dev')
    throw new Error('Production cannot trust Firebase DEV tokens');
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(season)) throw new Error('Invalid season');
  const origin =
    target === 'prod' ? 'https://trucco86.github.io' : 'https://hml.nova-wing-preview.pages.dev';
  return [
    'name = "nova-wing-ranking-' + target + '"',
    'main = "src/index.js"',
    'compatibility_date = "2026-10-27"',
    'workers_dev = true',
    '',
    '[vars]',
    'FIREBASE_PROJECT_ID = "' + firebaseProjectId + '"',
    'ALLOWED_ORIGINS = "' + origin + '"',
    'RANKING_SEASON = "' + season + '"',
    'SCORE_WRITE_ENABLED = "' + (enableWrites ? 'true' : 'false') + '"',
    '',
    '[[d1_databases]]',
    'binding = "DB"',
    'database_name = "nova-wing-ranking-' + target + '"',
    'database_id = "' + databaseId + '"',
    'migrations_dir = "migrations"',
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = workerDeploymentConfig({
    target: process.env.NOVA_RANKING_TARGET,
    databaseId: process.env.NOVA_RANKING_D1_ID,
    firebaseProjectId: process.env.NOVA_RANKING_FIREBASE_PROJECT_ID,
    season: process.env.NOVA_RANKING_SEASON || 'current',
    enableWrites: process.env.NOVA_RANKING_ENABLE_WRITES === 'true',
  });
  writeFileSync('workers/ranking/wrangler.toml', config);
  console.log(
    'Generated ' +
      process.env.NOVA_RANKING_TARGET +
      ' Worker config with separate Firebase, D1 and write gate.',
  );
}
