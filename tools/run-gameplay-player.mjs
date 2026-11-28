import { chromium } from '@playwright/test';
import { runPlayerSession } from './gameplay-player-runtime.mjs';
import { createVisionPolicyFromEnv } from './gameplay-vision-policy.mjs';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function positiveInteger(name, fallback, max) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new Error(`${name} must be an integer between 1 and ${max}`);
  }
  return value;
}

const url = required('GAMEPLAY_AGENT_TARGET_URL');
const profile = process.env.GAMEPLAY_AGENT_PROFILE || 'casual';
const maxSteps = positiveInteger('GAMEPLAY_AGENT_MAX_STEPS', 24, 100);
const timeout = positiveInteger('GAMEPLAY_AGENT_TIMEOUT_MS', 20_000, 120_000);
const browser = await chromium.launch({ headless: true });

try {
  const result = await runPlayerSession({
    browser,
    url,
    profile,
    maxSteps,
    outputDir: process.env.GAMEPLAY_AGENT_OUTPUT_DIR || 'artifacts/gameplay-player',
    decide: createVisionPolicyFromEnv({ timeoutMs: timeout }),
  });
  process.stdout.write(JSON.stringify({
    sessionId: result.sessionId,
    status: result.status,
    stopReason: result.stopReason,
    observationCount: result.observationCount,
    actionCount: result.actionCount,
    videoPath: result.videoPath,
    reportPath: result.reportPath,
  }, null, 2) + '\n');
  if (result.status === 'BLOCKED') process.exitCode = 2;
} finally {
  await browser.close();
}
