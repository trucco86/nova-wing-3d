import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('original art fills home atmosphere while Five Cats remain uncropped in three viewports', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1366, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await openMenu(page, 'home');
    const fit = await page.locator('#menu').evaluate((menu) => ({
      atmosphericSize: getComputedStyle(menu, '::before').backgroundSize,
      heroSize: getComputedStyle(menu.querySelector('#menuHero')).backgroundSize,
      artWidth: menu.querySelector('#menuHero').getBoundingClientRect().width,
      screenWidth: window.innerWidth,
    }));
    expect(fit.atmosphericSize).toContain('cover');
    expect(fit.heroSize).toContain('contain');
    expect(fit.artWidth).toBeGreaterThan(width * (width > height ? 0.4 : 0.87));
    for (const selector of ['#menuPlay', '#menuHangar', '#menuHub']) {
      const box = await page.locator(selector).boundingBox();
      expect(box).not.toBeNull();
      expect(box.x, selector).toBeGreaterThanOrEqual(-1);
      expect(box.y, selector).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width, selector).toBeLessThanOrEqual(width + 1);
      expect(box.y + box.height, selector).toBeLessThanOrEqual(height + 1);
    }
    await page.screenshot({
      path: info.outputPath(`home-original-expanded-${width}x${height}.png`),
    });
  }
});

test('live mission radio shows the correct original Five Cats portrait after mecha transformation', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(0.25));
  await expect(page.locator('#commsPortrait')).toHaveAttribute('data-pilot', 'bia');
  await expect(page.locator('#commsSpeaker')).toHaveText('BIA');
  await page.keyboard.press('KeyT');
  await page.evaluate(() => window.fixture.advance(0.12));
  await expect(page.locator('#commsSpeaker')).toHaveText('CHRISTOPHER');
  await expect(page.locator('#commsPortrait')).toHaveAttribute('data-pilot', 'christopher');
  await expect(page.locator('#commsPortrait')).toHaveAttribute('aria-label', /CHRISTOPHER/);
  const crop = await page
    .locator('#commsPortrait')
    .evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(crop).not.toBe('none');
  const portraits = await page.locator('#commsPortrait').evaluate((el) => {
    const result = {};
    for (const pilot of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
      el.dataset.pilot = pilot;
      const style = getComputedStyle(el);
      result[pilot] = { image: style.backgroundImage, position: style.backgroundPosition };
    }
    el.dataset.pilot = 'christopher';
    return result;
  });
  const facePositions = {
    bia: '70% 0%',
    bob: '50% 0%',
    christopher: '40% 0%',
    calvin: '72% 0%',
    jenifer: '35% 3%',
  };
  for (const pilot of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    expect(portraits[pilot].image).toContain(pilot + '-spotlight.webp');
    expect(portraits[pilot].position).toBe(facePositions[pilot]);
  }
  await page.screenshot({ path: info.outputPath(`radio-christopher-${info.project.name}.png`) });
  expect(errors).toEqual([]);
});
