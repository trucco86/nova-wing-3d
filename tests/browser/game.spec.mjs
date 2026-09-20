import { test, expect } from '@playwright/test';
test('WebGL starts, renders, plays and pauses without runtime errors', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /INICIAR MISSÃO/ })).toBeEnabled();
  // A disabled WebGL context is a failure in this required CI job, never a skipped pass.
  expect(await page.locator('#brief').innerText()).not.toContain('não conseguiu');
  await page.getByRole('button', { name: /INICIAR MISSÃO/ }).click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#stage')).toContainText('APROXIMAÇÃO');
  if (info.project.name === 'mobile') {
    await expect(page.locator('#touch')).toBeVisible();
    await page.locator('#bombTouch').tap();
  } else {
    await page.keyboard.down('Space');
    await page.keyboard.press('KeyB');
    await page.keyboard.up('Space');
  }
  await expect(page.locator('#bombs')).toHaveText('◆ ◆');
  await page.getByRole('button', { name: 'Pausar jogo' }).click();
  await expect(page.locator('#message')).toContainText('PAUSADO');
  await expect(page.locator('#pause')).toHaveText('▶');
  await expect(page.locator('#game')).toHaveJSProperty(
    'width',
    info.project.name === 'mobile' ? 844 : 1366,
  );
  await page.screenshot({ path: test.info().outputPath('mission.png') });
  expect(errors).toEqual([]);
});
test('missing WebGL presents an honest, non-interactive error', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.startsWith('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#start')).toBeDisabled();
  await expect(page.locator('#brief')).toContainText('não conseguiu iniciar o 3D');
});
