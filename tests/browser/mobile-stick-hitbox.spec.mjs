import { test, expect } from '@playwright/test';

test('mobile steering target is enlarged without overriding compact viewport rules', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch controls require mobile context');
  for (const { width, height, expected } of [
    { width: 844, height: 390, expected: 128 },
    { width: 390, height: 844, expected: 102 },
    { width: 320, height: 568, expected: 88 },
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const joystick = await page.locator('#stick').boundingBox();
    expect(joystick, 'joystick must remain visible').not.toBeNull();
    expect(joystick.width).toBe(expected);
    expect(joystick.height).toBe(expected);
    expect(joystick.x).toBeGreaterThanOrEqual(0);
    expect(joystick.x + joystick.width).toBeLessThanOrEqual(width);
    expect(joystick.y + joystick.height).toBeLessThanOrEqual(height);
  }
});
