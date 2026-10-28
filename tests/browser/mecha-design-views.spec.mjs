import { test, expect } from '@playwright/test';

test('actual mecha geometry renders from true front, side and rear for design review', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [view, label] of [
    ['front', 'FRENTE'],
    ['profile', 'PERFIL'],
    ['rear', 'COSTAS'],
  ]) {
    await page.goto('/__visual.html?mode=mecha&view=' + view);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('h1')).toHaveText('MECHA / ' + label);
    const inspection = await page.evaluate(() => window.modelInspection);
    expect(inspection.view).toBe(view);
    expect(inspection.projected).toHaveLength(8);
    for (const [x, y, z] of inspection.projected) {
      expect(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)).toBe(true);
      expect(Math.abs(x)).toBeLessThan(0.95);
      expect(Math.abs(y)).toBeLessThan(0.95);
      expect(z).toBeGreaterThan(-1);
      expect(z).toBeLessThan(1);
    }
    await page.screenshot({ path: info.outputPath('mecha-design-' + view + '.png') });
  }
  expect(errors).toEqual([]);
});
