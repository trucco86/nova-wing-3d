import { chromium, expect } from '@playwright/test';
import {
  openMenu,
  confirmCampaignPreflight,
  enterGameplayAfterLaunch,
} from '../tests/browser/menu-navigation.mjs';

const base = (
  process.env.NOVA_PRODUCTION_URL || 'https://trucco86.github.io/nova-wing-3d/'
).replace(/\/?$/, '/');
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(base + '?smoke=' + Date.now(), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  if (!response?.ok()) throw new Error('Game HTTP status: ' + response?.status());
  await page
    .waitForFunction(() => document.querySelectorAll('canvas').length > 0, null, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => ({
    title: document.title,
    canvas: document.querySelectorAll('canvas').length,
    visible: !!document.body && document.body.getBoundingClientRect().width > 0,
  }));
  if (!state.visible || !state.canvas)
    throw new Error('Game canvas not mounted: ' + JSON.stringify(state));

  // Production gate for the touch-only QA140 radial RPG. This was missing
  // from the previous smoke, which checked only that a canvas existed.
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  mobile.on('pageerror', (error) => errors.push(error.message));
  const mobileResponse = await mobile.goto(base + '?smoke-rpg=' + Date.now(), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  if (!mobileResponse?.ok())
    throw new Error('Mobile RPG smoke HTTP status: ' + mobileResponse?.status());
  await expect(mobile.locator('#strategyDrawer')).toBeAttached();
  await openMenu(mobile, 'play');
  await mobile.locator('#start').click();
  await confirmCampaignPreflight(mobile);
  await enterGameplayAfterLaunch(mobile);
  const drawer = mobile.locator('#strategyDrawer');
  await drawer.locator('summary').tap();
  await expect(mobile.locator('body')).toHaveClass(/rpg-tactical-paused/);
  await expect(mobile.locator('#rpgRadialMenu')).toBeVisible();
  await expect(mobile.locator('#rpgCategoryPanel')).toBeHidden();
  for (const category of ['weapons', 'specials', 'berserk', 'utilities']) {
    await expect(mobile.locator('[data-rpg-category="' + category + '"]')).toBeVisible();
  }
  await mobile.locator('[data-rpg-category="weapons"]').tap();
  await expect(mobile.locator('#rpgCategoryPanel')).toBeVisible();
  await expect(mobile.locator('#rpgRadialMenu')).toBeHidden();
  await mobile.locator('#rpgCategoryBack').tap();
  await expect(mobile.locator('#rpgRadialMenu')).toBeVisible();
  await mobile.locator('#rpgRadialClose').tap();
  await expect(drawer).not.toHaveAttribute('open');
  await expect(mobile.locator('body')).not.toHaveClass(/rpg-tactical-paused/);

  if (errors.length) throw new Error('Uncaught browser errors: ' + errors.slice(0, 5).join(' | '));
  const control = await page.goto(base + 'control-center/?smoke=' + Date.now(), {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  if (!control?.ok()) throw new Error('Control Center HTTP status: ' + control?.status());
  console.log('Production smoke passed:', JSON.stringify({ ...state, mobileRpg: 'radial menu verified' }));
} finally {
  await browser.close();
}
