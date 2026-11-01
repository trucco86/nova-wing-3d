import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('QA mobile/desktop opens stage 4 with upgraded ship, swaps mecha and pods without restarting', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await openMenu(page, 'central');
  const panel = page.locator('#developerPanel');
  await expect(panel).toBeVisible();
  await panel.locator(':scope > summary').click();
  await expect(page.locator('#developerLabLoadout')).toBeVisible();
  await page.locator('#developerSector').selectOption('3');
  await page.locator('#developerEncounter').selectOption('stage');
  await page.locator('#developerTier').selectOption('18');
  await page.locator('#developerShip').selectOption('aegis');
  await page.locator('#developerArsenal').selectOption('4');
  await page.locator('#developerSpecial').selectOption('2');
  await page.screenshot({ path: info.outputPath('qa-lab-setup.png') });
  await page.locator('#developerLaunch').click();
  await expect(page.locator('#menu')).toBeHidden();
  await expect(page.locator('#developerSessionTag')).toContainText('SETOR 04');
  await expect(page.locator('#stage')).toContainText('NAVE-MÃE');
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'false');

  await page.locator('#pause').click();
  const lab = page.locator('#developerFlightLab');
  await expect(lab).toBeVisible();
  await lab.locator(':scope > summary').click();
  await expect(page.locator('#qaLabApply')).toBeVisible();
  await page.locator('#qaLabLevel').selectOption('12');
  await page.locator('#qaLabShip').selectOption('specter');
  await page.locator('#qaLabArsenal').selectOption('3');
  await page.locator('#qaLabSpecial').selectOption('1');
  await page.locator('#qaLabForm').selectOption('robot');
  await page.locator('#qaLabPods').selectOption('deployed');
  await page.screenshot({ path: info.outputPath('qa-lab-paused-mobile-layout.png') });
  await page.locator('#qaLabApply').click();
  await expect(page.locator('#pauseMenu')).toBeHidden();
  await expect(page.locator('#robotTouch')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#robotTouch')).toContainText('NAVE');
  await expect(page.locator('#developerSessionTag')).toContainText('SEM RANK');
  if (info.project.name === 'mobile') {
    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(layout.document).toBeLessThanOrEqual(layout.viewport + 1);
  }
  expect(errors).toEqual([]);
});

