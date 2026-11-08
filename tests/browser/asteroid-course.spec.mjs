import { test, expect } from '@playwright/test';

async function seekOffset(page, target) {
  const result = await page.evaluate((distance) => {
    for (let i = 0; i < 1800; i++) {
      if (window.fixture.game.snapshot().asteroidInterior.course.offset >= distance) {
        window.fixture.advance(0);
        return true;
      }
      window.fixture.advance(0.05, { renderAfter: false });
    }
    window.fixture.advance(0);
    return false;
  }, target);
  expect(result, 'pilot must reach the requested course checkpoint').toBe(true);
}

test('fissure banks the actual ship, supports recovery and opens alternate rock routes', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=2&asteroidCourse=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await seekOffset(page, 650);
  await page.screenshot({ path: info.outputPath('course-fissure-approach.png') });
  await page.evaluate(() => window.fixture.advance(4));
  const blocked = await page.evaluate(() => window.fixture.game.snapshot());
  expect(blocked.asteroidInterior.course.blocked).toBe(true);
  await page.screenshot({ path: info.outputPath('course-fissure-contact.png') });

  const touch = info.project.name === 'mobile' ? await page.context().newCDPSession(page) : null;
  if (touch) {
    const roll = page.locator('#rollTouch');
    await expect(roll).toBeVisible();
    const bounds = await roll.boundingBox();
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
    });
  } else await page.keyboard.down('q');
  // The gesture's tap/hold threshold uses wall time; simulation alone does
  // not represent an actual long pointer/key press.
  await page.waitForTimeout(260);
  await page.evaluate(() => window.fixture.advance(0.6));
  const edgeOn = await page.evaluate(() => window.fixture.game.snapshot());
  expect(edgeOn.bankAngle).toBeLessThan(-1.4);
  expect(edgeOn.asteroidInterior.course.offset).toBeGreaterThan(
    blocked.asteroidInterior.course.offset + 20,
  );
  await page.screenshot({ path: info.outputPath('course-fissure-edge-on.png') });
  if (touch) await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  else await page.keyboard.up('q');
  await page.evaluate(() => window.fixture.advance(1.6));
  expect(
    Math.abs(await page.evaluate(() => window.fixture.game.snapshot().bankAngle)),
  ).toBeLessThan(0.1);

  await page.keyboard.down('d');
  await page.evaluate(() => window.fixture.advance(0.65));
  await page.keyboard.up('d');
  await seekOffset(page, 1220);
  await page.screenshot({ path: info.outputPath('course-fragment-side-route.png') });
  await page.keyboard.down('a');
  await page.evaluate(() => window.fixture.advance(0.65));
  await page.keyboard.up('a');
  await seekOffset(page, 2010);
  await page.evaluate(() => window.fixture.advance(30));
  const arena = await page.evaluate(() => window.fixture.game.snapshot());
  expect(arena.asteroidInterior.course.complete).toBe(true);
  expect(arena.journey.phase).toBe('boss');
  expect(errors).toEqual([]);
});
