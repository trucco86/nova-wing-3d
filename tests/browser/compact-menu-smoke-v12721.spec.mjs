import { test, expect } from '@playwright/test';

const viewports = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1366, height: 768 },
];

for (const viewport of viewports) {
  test(`Five Cats start and three-option navigation at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    const menu = page.locator('#menu');
    await expect(menu).toHaveAttribute('data-screen', 'splash');
    await expect(page.locator('#pressStart')).toBeVisible();
    await expect(page.locator('#menuPrimary')).toBeHidden();

    const cover = await menu.evaluate((node) => {
      const style = getComputedStyle(node, '::before');
      const button = node.querySelector('#pressStart').getBoundingClientRect();
      return {
        image: style.backgroundImage.includes('data:image/webp;base64,'),
        size: style.backgroundSize,
        start: { left: button.left, right: button.right, bottom: button.bottom },
      };
    });
    expect(cover.image).toBe(true);
    expect(cover.size).toContain('contain');
    expect(cover.start.left).toBeGreaterThanOrEqual(-1);
    expect(cover.start.right).toBeLessThanOrEqual(viewport.width + 1);
    expect(cover.start.bottom).toBeLessThanOrEqual(viewport.height + 1);
    await page.screenshot({ path: info.outputPath(`five-cats-splash-${viewport.width}.png`) });

    await page.locator('#pressStart').click();
    await expect(menu).toHaveAttribute('data-screen', 'home');
    await expect(page.locator('#menuPrimary button:visible')).toHaveCount(3);
    await expect(page.locator('#novaRanking')).toBeHidden();
    await expect(page.locator('#novaAuth')).toBeHidden();

    await page.locator('#menuHangar').click();
    await expect(menu).toHaveAttribute('data-screen', 'hangar');
    await expect(page.locator('#squadSelection')).toBeVisible();
    await expect(page.locator('#pilot-bia')).toBeVisible();
    await expect(page.locator('#pilot-jenifer')).toBeVisible();

    await page.locator('#menuBack').click();
    await page.locator('#menuHub').click();
    await expect(menu).toHaveAttribute('data-screen', 'central');
    await expect(page.locator('#novaRanking')).toBeVisible();
    await expect(page.locator('#novaTrophies')).toBeVisible();
    await expect(page.locator('#catRanks')).toBeVisible();

    await page.locator('#menuBack').click();
    await page.locator('#menuPlay').click();
    await expect(menu).toHaveAttribute('data-screen', 'play');
    await expect(page.locator('#start')).toBeVisible();
  });
}

test('Enter opens the title without launching a mission; Escape returns from a submenu', async ({
  page,
}) => {
  await page.goto('/');
  const menu = page.locator('#menu');
  await expect(menu).toHaveAttribute('data-screen', 'splash');
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('data-screen', 'home');
  await expect(page.locator('body')).toHaveClass(/menu/);
  await page.locator('#menuPlay').click();
  await expect(menu).toHaveAttribute('data-screen', 'play');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('data-screen', 'home');
});
