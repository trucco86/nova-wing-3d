import { test, expect } from '@playwright/test';

const overlaps = (a, b) =>
  Boolean(a && b) &&
  a.x < b.x + b.width - 2 &&
  b.x < a.x + a.width - 2 &&
  a.y < b.y + b.height - 2 &&
  b.y < a.y + a.height - 2;

test('QA154 cockpit HUD clears the touch island and time precedes score', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Requires mobile touch layout');
  test.setTimeout(120000);
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0&xp=740');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.advance(3.2));
    await page.keyboard.press('KeyC');
    await page.evaluate(() => window.fixture.advance(0.1));
    const geometry = await page.evaluate(() => {
      const box = (id) => {
        const el = document.querySelector(id);
        if (!el || el.hidden || getComputedStyle(el).display === 'none') return null;
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        cockpit: box('#cockpitPanel'),
        actions: box('#touch .actions'),
        clock: box('#stageClock'),
        points: box('#score'),
        status: box('#hud .status'),
        buttons: [
          'fireTouch',
          'boostTouch',
          'bombTouch',
          'podsTouch',
          'robotTouch',
          'rollTouch',
        ].map((id) => [id, box('#' + id)]),
        clockFont: parseFloat(getComputedStyle(document.querySelector('#stageClock')).fontSize),
      };
    });
    expect(geometry.clock, 'phase clock remains visible').not.toBeNull();
    expect(geometry.points, 'points remain visible').not.toBeNull();
    expect(geometry.clock.y + geometry.clock.height).toBeLessThanOrEqual(geometry.points.y + 2);
    expect(geometry.clockFont).toBeGreaterThanOrEqual(11);
    expect(overlaps(geometry.status, geometry.clock), 'shield and clock must not collide').toBe(
      false,
    );
    expect(geometry.cockpit, 'cockpit readout stays visible in both orientations').not.toBeNull();
    expect(
      overlaps(geometry.cockpit, geometry.actions),
      'cockpit vs actions ' +
        JSON.stringify({ viewport, cockpit: geometry.cockpit, actions: geometry.actions }),
    ).toBe(false);
    expect(
      geometry.cockpit.x <= viewport.width / 2 &&
        geometry.cockpit.x + geometry.cockpit.width >= viewport.width / 2 &&
        geometry.cockpit.y <= viewport.height / 2 &&
        geometry.cockpit.y + geometry.cockpit.height >= viewport.height / 2,
      'cockpit instruments must leave the center targeting corridor free',
    ).toBe(false);
    if (viewport.width > 550) {
      await expect(page.locator('#cockpitMap')).toBeVisible();
    }
    for (const [id, target] of geometry.buttons) {
      expect(target, id).not.toBeNull();
      expect(target.width, id).toBeGreaterThanOrEqual(60);
      expect(target.height, id).toBeGreaterThanOrEqual(60);
      expect(overlaps(geometry.cockpit, target), 'cockpit vs ' + id).toBe(false);
    }
    await page.screenshot({
      path: info.outputPath('qa154-cockpit-' + viewport.width + 'x' + viewport.height + '.png'),
    });
  }
});

test('QA154 radio uses one box and preserves dangerous-alert precedence', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Requires mobile touch layout');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=0');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  // Complete the introductory briefing before taking ownership of the radio lane.
  await page.evaluate(() => window.fixture.advance(3.3));
  await expect(page.locator('body')).not.toHaveClass(/stage-intro/);
  await page.evaluate(() => {
    const byId = (id) => document.getElementById(id);
    byId('criticalWarning').hidden = true;
    byId('shieldWarning').hidden = true;
    byId('bossIncoming').hidden = true;
    byId('comms').classList.add('active');
    byId('message').textContent = 'FIVE CATS EM FORMAÇÃO, PREPARAR SALTO DE LUZ';
    byId('pickupFlash').hidden = false;
    byId('pickupFlash').textContent = 'ITEM COLETADO';
    byId('attackWarning').dataset.severity = 'info';
    byId('attackWarning').textContent = 'INFORMAÇÃO DE VOO';
  });
  await expect(page.locator('#comms')).toBeVisible();
  await expect(page.locator('#pickupFlash')).toBeHidden();
  await expect(page.locator('#attackWarning')).toBeHidden();
  const radio = await page.locator('#comms').boundingBox();
  const rail = await page.locator('#hudNotices').boundingBox();
  expect(radio.height).toBeLessThanOrEqual(rail.height + 1);
  await page.evaluate(() => {
    document.getElementById('attackWarning').dataset.severity = 'danger';
    document.getElementById('attackWarning').textContent = 'ATAQUE CRÍTICO';
  });
  await expect(page.locator('#comms')).toBeHidden();
  await expect(page.locator('#attackWarning')).toBeVisible();
  await page.screenshot({ path: info.outputPath('qa154-priority-radio.png') });
});

test('QA154 hangar route action is reachable without scrolling at compact sizes', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Requires touch viewport layout');
  test.setTimeout(120000);
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0&xp=740');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.hangar());
    await expect(page.locator('#shop')).toBeVisible();
    const bounds = await page.evaluate(() => {
      const box = (selector) => {
        const node = document.querySelector(selector);
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      };
      const card = document.querySelector('#shop .hangar-card');
      return {
        next: box('#nextSector'),
        credits: box('#shopCredits'),
        card: box('#shop .hangar-card'),
        scrollTop: card.scrollTop,
      };
    });
    expect(bounds.scrollTop, 'hangar begins at top of the card').toBe(0);
    expect(bounds.next.x, 'launch is horizontally within screen').toBeGreaterThanOrEqual(0);
    expect(bounds.next.x + bounds.next.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(bounds.next.y, 'map action visible without scrolling').toBeGreaterThanOrEqual(0);
    expect(bounds.next.y + bounds.next.height, 'map action fits in initial viewport').toBeLessThanOrEqual(
      viewport.height,
    );
    expect(bounds.credits.y + bounds.credits.height).toBeLessThanOrEqual(bounds.next.y + 2);
    await page.screenshot({
      path: info.outputPath('qa154-hangar-first-view-' + viewport.width + '.png'),
    });
    await page.locator('#nextSector').click();
    await expect(page.locator('#campaignMap')).toBeVisible();
    await expect(page.locator('#shop')).toBeHidden();
  }
});
