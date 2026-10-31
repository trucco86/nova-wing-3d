import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('Options is one compact screen with immediately visible language selector', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  test.setTimeout(120000);
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/');
    await openMenu(page, 'central');
    await page.locator('#optionsFromMenu').click();
    await expect(page.locator('#settingsMenu')).toBeVisible();
    await expect(page.locator('#settingLanguage')).toBeVisible();
    await expect(page.locator('#settingLanguage')).toHaveValue('pt');
    const bounds = await page.evaluate(() => {
      const card = document.querySelector('#settingsMenu .nw-settings-card');
      const r = card.getBoundingClientRect();
      const menu = document.getElementById('settingsMenu');
      const select = document.getElementById('settingLanguage').getBoundingClientRect();
      const close = document.getElementById('settingsClose').getBoundingClientRect();
      return {
        height: r.height,
        scroll: card.scrollHeight - card.clientHeight,
        modalScroll: menu.scrollHeight - menu.clientHeight,
        top: r.top,
        bottom: r.bottom,
        languageVisible: select.top >= r.top,
        closeVisible: close.bottom <= r.bottom + 1,
      };
    });
    expect(
      bounds.scroll,
      'no internal scroll at ' + size.width + 'x' + size.height,
    ).toBeLessThanOrEqual(1);
    expect(bounds.modalScroll).toBeLessThanOrEqual(1);
    expect(bounds.top).toBeGreaterThanOrEqual(-1);
    expect(bounds.bottom).toBeLessThanOrEqual(size.height + 1);
    expect(bounds.languageVisible).toBe(true);
    expect(bounds.closeVisible).toBe(true);
    await page.screenshot({
      path: info.outputPath('compact-options-' + size.width + 'x' + size.height + '.png'),
    });
  }
});

test('mobile BOOST always sits above HUD and receives touch with LOCK in the arc', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile');
  test.setTimeout(120000);
  for (const size of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => {
      document.body.classList.remove('menu');
      document.body.classList.add('in-mission');
      document.getElementById('lockTouch').hidden = false;
    });
    const state = await page.evaluate(() => {
      const el = document.getElementById('boostTouch');
      const r = el.getBoundingClientRect();
      const visible = getComputedStyle(el);
      const center = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        w: r.width,
        h: r.height,
        right: r.right,
        bottom: r.bottom,
        display: visible.display,
        visibility: visible.visibility,
        opacity: visible.opacity,
        hit: center === el || el.contains(center),
      };
    });
    expect(state.display).not.toBe('none');
    expect(state.visibility).toBe('visible');
    expect(state.w).toBeGreaterThanOrEqual(52);
    expect(state.h).toBeGreaterThanOrEqual(52);
    expect(state.right).toBeLessThanOrEqual(size.width + 1);
    expect(state.bottom).toBeLessThanOrEqual(size.height + 1);
    expect(Number(state.opacity)).toBeGreaterThan(0.7);
    expect(state.hit, 'BOOST center must actually receive pointer events').toBe(true);
    await page.screenshot({
      path: info.outputPath('boost-lock-' + size.width + 'x' + size.height + '.png'),
    });
  }
});
