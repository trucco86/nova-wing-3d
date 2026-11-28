import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Browser-only player runtime.
 *
 * The policy receives only rendered/accessible browser information. It must
 * never receive game objects, fixture APIs, snapshots, or internal telemetry.
 */
const allowedKeys = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'KeyQ', 'KeyE',
  'KeyZ', 'KeyB', 'KeyX', 'KeyV', 'Escape', 'KeyP',
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function safeSessionId(value) {
  return String(value || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '-');
}

export async function observePlayerSurface(page, step, outputDir) {
  const visible = await page.evaluate(() => {
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll('button,[role="button"],input,select')]
      .filter(isVisible)
      .slice(0, 80)
      .map((element) => ({
        role: element.getAttribute('role') || element.tagName.toLowerCase(),
        name: (element.getAttribute('aria-label') ||
          element.getAttribute('title') ||
          element.innerText ||
          element.value ||
          '').trim().replace(/\\s+/g, ' ').slice(0, 120),
        disabled: Boolean(element.disabled),
      }));
    return {
      title: document.title,
      text: (document.body?.innerText || '').slice(0, 12000),
      controls,
      canvasCount: document.querySelectorAll('canvas').length,
      viewport: { width: innerWidth, height: innerHeight },
    };
  });

  const screenshot = join(outputDir, `step-${String(step).padStart(3, '0')}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  return {
    step,
    observedAt: new Date().toISOString(),
    url: page.url(),
    ...visible,
    screenshot,
  };
}

export async function executePlayerAction(page, action) {
  if (!action || typeof action !== 'object') throw new Error('Policy returned no action');
  if (action.type === 'stop') return { type: 'stop', reason: action.reason || 'policy-stop' };

  if (action.type === 'click') {
    if (!action.name || typeof action.name !== 'string') throw new Error('Click action requires an accessible name');
    const button = page.getByRole('button', { name: action.name, exact: true }).first();
    if (!(await button.isVisible().catch(() => false))) {
      throw new Error(`Visible button not found: ${action.name}`);
    }
    await button.click({ timeout: 5000 });
    return { type: 'click', name: action.name };
  }

  if (action.type === 'key') {
    if (!allowedKeys.has(action.key)) throw new Error(`Unsupported gameplay key: ${action.key}`);
    const durationMs = Math.max(50, Math.min(2000, Number(action.durationMs) || 250));
    await page.keyboard.down(action.key);
    try {
      await sleep(durationMs);
    } finally {
      await page.keyboard.up(action.key);
    }
    return { type: 'key', key: action.key, durationMs };
  }

  if (action.type === 'wait') {
    const durationMs = Math.max(100, Math.min(3000, Number(action.durationMs) || 500));
    await sleep(durationMs);
    return { type: 'wait', durationMs };
  }

  throw new Error(`Unsupported policy action: ${action.type}`);
}

/**
 * Runs one bounded session against the normal game URL.
 * decide(observation, history) is an injected policy adapter. No QA fixture
 * or internal game state is exposed to it.
 */
export async function runPlayerSession({
  browser,
  url,
  decide,
  profile = 'casual',
  outputDir = 'artifacts/gameplay-player',
  maxSteps = 24,
  viewport = { width: 1366, height: 768 },
  sessionId = Date.now(),
}) {
  if (!browser) throw new Error('A Playwright browser instance is required');
  if (typeof decide !== 'function') throw new Error('A player policy adapter is required');
  if (!/^https?:\\/\\//.test(url || '')) throw new Error('Provide an absolute DEV or PR-preview URL');
  const parsed = new URL(url);
  if (/__dynamic|qa[A-Z_-]?/i.test(parsed.pathname + parsed.search)) {
    throw new Error('Player Runtime refuses QA fixture and diagnostic routes');
  }

  const id = safeSessionId(sessionId);
  const sessionDir = join(outputDir, id);
  await mkdir(sessionDir, { recursive: true });
  const context = await browser.newContext({
    viewport,
    recordVideo: { dir: sessionDir, size: viewport },
  });
  const page = await context.newPage();
  const actions = [];
  const observations = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push({ at: new Date().toISOString(), message: error.message }));
  const startedAt = new Date().toISOString();
  let status = 'REVIEW_REQUIRED';
  let stopReason = 'step-limit';
  let videoPath = null;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    for (let step = 0; step < maxSteps; step += 1) {
      const observation = await observePlayerSurface(page, step, sessionDir);
      observations.push(observation);
      const decision = await decide(observation, actions.slice(-8), { profile, step });
      const result = await executePlayerAction(page, decision);
      actions.push({
        at: new Date().toISOString(),
        decision: { ...decision },
        executed: result,
        rationale: String(decision.rationale || '').slice(0, 500),
      });
      if (result.type === 'stop') {
        stopReason = result.reason;
        status = 'REVIEW_REQUIRED';
        break;
      }
    }
  } catch (error) {
    status = 'BLOCKED';
    stopReason = error.message;
    errors.push({ at: new Date().toISOString(), message: error.message });
  } finally {
    const video = page.video();
    await context.close();
    if (video) videoPath = await video.path().catch(() => null);
  }

  const report = {
    schemaVersion: 1,
    runtime: 'browser-player',
    sessionId: id,
    profile,
    url,
    viewport,
    startedAt,
    finishedAt: new Date().toISOString(),
    status,
    stopReason,
    observationCount: observations.length,
    actionCount: actions.length,
    observations,
    actions,
    browserErrors: errors,
    videoPath,
    limitations: [
      'The quality of gameplay decisions depends on the injected policy adapter.',
      'This runtime does not claim autonomous visual understanding unless the policy provides it.',
      'No game fixture, snapshot, or internal gameplay state is exposed to the policy.',
    ],
  };
  const reportPath = join(sessionDir, 'session.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  return { ...report, reportPath };
}
