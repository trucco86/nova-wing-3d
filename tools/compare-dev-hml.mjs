import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const environments = ['dev', 'hml'];
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const environment of environments) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    const url = `https://${environment}.nova-wing-preview.pages.dev/`;
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (!response?.ok()) {
      throw new Error(`${environment}: HTTP ${response?.status()}`);
    }

    await page.waitForTimeout(2500);
    const state = await page.evaluate(() => ({
      title: document.title,
      game: Boolean(document.querySelector('#game')),
      menu: Boolean(document.querySelector('#menu')),
      canvas: document.querySelectorAll('canvas').length,
    }));

    mkdirSync('artifacts/environment-parity', { recursive: true });
    await page.screenshot({
      path: `artifacts/environment-parity/${environment}.png`,
    });

    if (!state.game || !state.menu || !state.canvas) {
      throw new Error(`${environment}: missing game UI ${JSON.stringify(state)}`);
    }
    if (errors.length) {
      throw new Error(`${environment}: JS errors ${JSON.stringify(errors)}`);
    }

    results.push({ environment, ...state, errors });
    await page.close();
  }

  if (results[0].title !== results[1].title) {
    throw new Error('DEV/HML page titles differ');
  }

  writeFileSync(
    'artifacts/environment-parity/browser-smoke.json',
    JSON.stringify(results, null, 2),
  );
  console.log('PASS: DEV/HML live browser smoke', JSON.stringify(results));
} finally {
  await browser.close();
}
