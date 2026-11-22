import { chromium } from '@playwright/test';
const base = (process.env.NOVA_PRODUCTION_URL || 'https://trucco86.github.io/nova-wing-3d/').replace(/\/?$/, '/');
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(base + '?smoke=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!response?.ok()) throw new Error('Game HTTP status: ' + response?.status());
  // Retry on CDN propagation and asynchronous WebGL initialization.
  await page.waitForFunction(() => document.querySelectorAll('canvas').length > 0, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => ({
    title: document.title,
    canvas: document.querySelectorAll('canvas').length,
    visible: !!document.body && document.body.getBoundingClientRect().width > 0,
  }));
  if (!state.visible || !state.canvas) throw new Error('Game canvas not mounted: ' + JSON.stringify(state));
  if (errors.length) throw new Error('Uncaught browser errors: ' + errors.slice(0, 5).join(' | '));
  const control = await page.goto(base + 'control-center/?smoke=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!control?.ok()) throw new Error('Control Center HTTP status: ' + control?.status());
  console.log('Production smoke passed:', JSON.stringify(state));
} finally {
  await browser.close();
}
