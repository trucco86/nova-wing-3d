import { test, expect } from '@playwright/test';

test('approved artwork and 360 hangar support selection, touch drag, zoom and reduced motion', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    window.hangarDraws = 0;
    for (const name of ['drawElements', 'drawArrays']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        if (this.canvas.id === 'hangarCanvas') window.hangarDraws++;
        return original.apply(this, args);
      };
    }
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const cover = await page
    .locator('#menu')
    .evaluate((e) => getComputedStyle(e, '::before').animationName);
  expect(cover).toBe('none');
  await page.locator('#prepareSquad').click();
  for (const id of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    await expect(page.locator('#pilot-' + id + ' .cat-avatar')).toBeVisible();
  }
  const canvas = page.locator('#hangarCanvas');
  await expect(canvas).toHaveAttribute('data-model', 'nova7');
  await expect(page.locator('#hangarAuto')).toHaveAttribute('aria-pressed', 'false');
  // Observe a settled static scene long enough to catch a render loop or body mutations.
  await page.waitForTimeout(200);
  const staticDraws = await page.evaluate(() => window.hangarDraws);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.hangarDraws)).toBe(staticDraws);
  const portrait = await page
    .locator('#profileAvatar')
    .evaluate((e) => getComputedStyle(e).backgroundImage);
  expect(portrait).toContain('data:image/webp;base64,');
  await page.locator('#ship-aegis').click();
  await page.locator('#ship-color-gold').click();
  await expect(canvas).toHaveAttribute('data-model', 'aegis');
  await expect(canvas).toHaveAttribute('data-color', 'gold');
  const yaw = await canvas.getAttribute('data-yaw');
  await page.locator('#hangarRight').click();
  await expect.poll(() => canvas.getAttribute('data-yaw')).not.toBe(yaw);
  await page.locator('#hangarZoomIn').click();
  await expect(canvas).toHaveAttribute('data-zoom', '1.15');
  await page.locator('#hangarReset').click();
  await expect(canvas).toHaveAttribute('data-zoom', '1.00');
  await page.locator('#hangarPilot').click();
  for (const id of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    await page.locator('#pilot-' + id).click();
    await expect(canvas).toHaveAttribute('data-model', id);
  }
  await canvas.scrollIntoViewIfNeeded();
  const before = await canvas.getAttribute('data-yaw');
  const box = await canvas.boundingBox();
  if (info.project.name === 'mobile') {
    const session = await page.context().newCDPSession(page);
    const touch = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: touch.x + 55, y: touch.y + 20 }],
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 55, box.y + box.height / 2 + 20, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(() => canvas.getAttribute('data-yaw')).not.toBe(before);
  await page.screenshot({ path: info.outputPath('hangar-pilot.png') });
  await page.locator('#hangarShip').click();
  await page.screenshot({ path: info.outputPath('hangar-ship.png') });
  await page.locator('#start').click();
  await page.locator('#cinematicSkip').click();
  await expect(page.locator('#menu')).toBeHidden();
  expect(errors).toEqual([]);
});
