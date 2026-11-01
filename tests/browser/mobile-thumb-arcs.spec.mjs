import { test, expect } from '@playwright/test';

test.use({ hasTouch: true, isMobile: true });
const ids = [
  'podsTouch',
  'rollTouch',
  'robotTouch',
  'lockTouch',
  'bombTouch',
  'boostTouch',
  'fireTouch',
];
const overlaps = (a, b) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

test('ergonomic thumb arcs maintain 7 touch targets, safe areas and clear center', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => {
      document.body.classList.remove('menu');
      document.body.classList.add('in-mission');
      document.getElementById('lockTouch').hidden = false;
    });
    const state = await page.evaluate((buttons) => {
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        };
      };
      return {
        coarse: matchMedia('(pointer: coarse)').matches,
        stick: rect(document.querySelector('#stick')),
        controls: Object.fromEntries(
          buttons.map((id) => {
            const el = document.getElementById(id);
            const style = getComputedStyle(el);
            return [
              id,
              {
                rect: rect(el),
                opacity: Number(style.opacity),
                pointerEvents: style.pointerEvents,
                visible: style.display !== 'none',
              },
            ];
          }),
        ),
      };
    }, ids);
    expect(state.coarse).toBe(true);
    for (const id of ids) {
      const { rect, opacity, pointerEvents, visible } = state.controls[id];
      expect(visible, id + ' is visible').toBe(true);
      expect(pointerEvents, id + ' accepts a touch').toBe('auto');
      expect(rect.width, id + ' is easily tappable').toBeGreaterThanOrEqual(48);
      expect(rect.height, id + ' is easily tappable').toBeGreaterThanOrEqual(48);
      expect(rect.left, id + ' inside screen').toBeGreaterThanOrEqual(-1);
      expect(rect.right, id + ' inside screen').toBeLessThanOrEqual(viewport.width + 1);
      expect(rect.bottom, id + ' inside screen').toBeLessThanOrEqual(viewport.height + 1);
      expect(opacity, id + ' transparent but readable').toBeGreaterThan(0.35);
      expect(opacity).toBeLessThanOrEqual(id === 'boostTouch' ? 0.9 : 0.76);
      if (id === 'boostTouch') {
        expect(opacity).toBeGreaterThan(0.74);
        expect(rect.width).toBeGreaterThanOrEqual(60);
        expect(rect.height).toBeGreaterThanOrEqual(52);
      }
      for (const other of ids) {
        if (other <= id) continue;
        expect(
          overlaps(rect, state.controls[other].rect),
          id + ' must not overlap ' + other + ' on ' + viewport.width + 'px',
        ).toBe(0);
      }
      expect(overlaps(rect, state.stick), id + ' must not cover left thumb stick').toBe(0);
    }
    await page.screenshot({
      path: info.outputPath('thumb-arcs-' + viewport.width + 'x' + viewport.height + '.png'),
    });
  }
  expect(errors).toEqual([]);
});
