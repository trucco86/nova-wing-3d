import { test, expect } from '@playwright/test';

test('Five Cats formation uses world-space ally identifiers and City 3.4 keeps gameplay visible', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
  );
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/__dynamic.html?sector=0&intro=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(1.2));
  await page.screenshot({ path: info.outputPath('city34-01-five-cats-ally-formation.png') });
  await page.evaluate(() => window.fixture.advance(6));
  await page.screenshot({ path: info.outputPath('city34-02-premium-window-density.png') });
  expect(pageErrors).toEqual([]);
});

test('orbital warning is compact and disappears without removing mandatory SUPER BOOST', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.setViewportSize(
    info.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1366, height: 768 },
  );
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(22.5));
  await expect(page.locator('#launchBoostNotice')).toBeVisible();
  const notice = await page.locator('#launchBoostNotice').boundingBox();
  expect(notice.height).toBeLessThan(65);
  expect(notice.width).toBeLessThanOrEqual(page.viewportSize().width - 16);
  await page.evaluate(() => window.fixture.advance(3.1));
  await expect(page.locator('#launchBoostNotice')).toBeHidden();
  await expect(page.locator('#boostTouch')).toHaveText('SUPER BOOST');
  await expect(page.locator('#boostTouch')).toHaveClass(/launch-required/);
  await page.screenshot({ path: info.outputPath('city34-03-boost-alert-dismissed.png') });
});
