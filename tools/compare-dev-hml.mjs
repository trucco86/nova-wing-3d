import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

const environments = ['dev', 'hml'];
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl'],
});
const results = [];
try {
  for (const environment of environments) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const url = `https://${environment}.nova-wing-preview.pages.dev/`;
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!response?.ok()) throw new Error(`${environment}: HTTP ${response?.status()}`);
    await page.waitForTimeout(2500);
    const state = await page.evaluate(() => ({
      title: document.title,
      game: Boolean(document.querySelector('#game')),
      menu: Boolean(document.querySelector('#menu')),
      canvas: document.querySelectorAll('canvas').length,
    }));
    const screenshot = `artifacts/environment-parity/${environment}.png`;
    await page.screenshot({ path: screenshot, fullPage: false });
    if (!state.game || !state.menu || !state.canvas)
      throw new Error(`${environment}: missing game UI ${JSON.stringify(state)}`);
    if (errors.length) throw new Error(`${environment}: JS errors ${JSON.stringify(errors)}`);
    results.push({ environment, ...state, errors });
    await page.close();
  }
  if (results[0].title !== results[1].title)
    throw new Error('DEV/HML page titles differ');
  mkdirSync('artifacts/environment-parity', { recursive: true });
  writeFileSync(
    'artifacts/environment-parity/browser-smoke.json',
    JSON.stringify(results, null, 2),
  );
  console.log('PASS: DEV/HML live browser smoke', JSON.stringify(results));
} finally {
  await browser.close();
}
