import { test, expect } from '@playwright/test';

async function seekOffset(page, target) {
  const reached = await page.evaluate((distance) => {
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
  expect(reached, 'pilot must reach the requested course checkpoint').toBe(true);
}

test('ship and mecha traverse the authored fissure opening without false collision', async ({
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

  await seekOffset(page, 920);
  const traversed = await page.evaluate(() => window.fixture.game.snapshot());
  expect(traversed.asteroidInterior.course.blocked).toBe(false);
  expect(traversed.asteroidCourseContacts).toBe(0);
  await page.screenshot({ path: info.outputPath('course-fissure-cleared.png') });

  await page.keyboard.press('KeyT');
  await page.evaluate(() => window.fixture.advance(0.2));
  const mecha = await page.evaluate(() => window.fixture.game.snapshot());
  expect(mecha.mecha.active).toBe(true);
  await seekOffset(page, 1220);
  const fragment = await page.evaluate(() => window.fixture.game.snapshot());
  expect(fragment.asteroidInterior.course.blocked).toBe(false);

  await seekOffset(page, 2010);
  await page.evaluate(() => window.fixture.advance(30));
  const arena = await page.evaluate(() => window.fixture.game.snapshot());
  expect(arena.asteroidInterior.course.complete).toBe(true);
  expect(arena.journey.phase).toBe('boss');
  expect(errors).toEqual([]);
});
