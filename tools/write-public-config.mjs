import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_FIREBASE, parsePublicConfig } from '../src/runtime-config.js';

export function generatePublicConfig({ environment, firebaseJson = '', rankingApiUrl = '' } = {}) {
  if (!['dev', 'hml', 'prod'].includes(environment)) return null;
  let firebase = null;
  if (firebaseJson) {
    try {
      firebase = JSON.parse(firebaseJson);
    } catch {
      throw new Error('Invalid Firebase public JSON configuration');
    }
  }
  if (!firebase && environment !== 'prod') firebase = DEV_FIREBASE;
  if (!firebase) return null; // Fail closed in production: never use DEV identities.
  const candidate = {
    environment,
    firebase,
    rankingApiUrl: rankingApiUrl || null,
  };
  if (!parsePublicConfig(candidate, environment))
    throw new Error('Invalid environment Firebase/ranking public configuration');
  return candidate;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = process.argv[2];
  if (!output) throw new Error('Usage: node tools/write-public-config.mjs <output.json>');
  const config = generatePublicConfig({
    environment: process.env.NOVA_ENV,
    firebaseJson: process.env.NOVA_FIREBASE_CONFIG_JSON,
    rankingApiUrl: process.env.NOVA_RANKING_API_URL,
  });
  if (config) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(config, null, 2) + '\n');
    console.log('Public runtime config prepared for ' + config.environment);
  } else {
    console.log('Public config omitted. OAuth and remote ranking remain disabled.');
  }
}
