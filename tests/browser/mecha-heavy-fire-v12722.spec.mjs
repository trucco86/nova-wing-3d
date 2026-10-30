import { test, expect } from '@playwright/test';
import { clickMenu } from './menu-navigation.mjs';

test('mecha enters heavy-fire mode, charges right-arm plasma and keeps game stable', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await clickMenu(page, '#start', info.project.name === 'mobile' ? 'tap' : 'click');
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'false');

  if (info.project.name === 'mobile') await page.locator('#robotTouch').tap();
  else await page.keyboard.press('KeyT');
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#robotTouch')).toHaveText('NAVE');
  await expect(page.locator('#lockTouch')).not.toHaveAttribute('hidden', '');

  // Drive real pointer/keyboard input; do not bypass the combat loop or mock damage.
  const mobile = info.project.name === 'mobile';
  if (mobile) {
    const bounds = await page.locator('#fireTouch').boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await expect(page.locator('#fireTouch')).toHaveClass(/pressed/);
  } else {
    await page.keyboard.down('Space');
  }
  await expect
    .poll(
      () => page.locator('#chargeBar').evaluate((el) => Number.parseFloat(el.style.width)),
      { timeout: 45000 },
    )
    .toBeGreaterThan(58);
  await page.screenshot({ path: info.outputPath(`mecha-heavy-charge-${info.project.name}.png`) });
  if (mobile) await page.mouse.up();
  else await page.keyboard.up('Space');
  await expect
    .poll(
      () => page.locator('#chargeBar').evaluate((el) => Number.parseFloat(el.style.width)),
      { timeout: 20000 },
    )
    .toBeLessThan(2);
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
