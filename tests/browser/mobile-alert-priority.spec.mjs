import { test, expect } from '@playwright/test';
import { reachBrowserBoss } from './orbital-journey.mjs';

const CASES = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
];

test('P0: critical, danger and boss warnings have one visible mobile priority lane', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Requires coarse pointer mobile layout');
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  for (const viewport of CASES) {
    await page.setViewportSize(viewport);
    await page.goto('/__dynamic.html?sector=0');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await reachBrowserBoss(page, { bossAge: 4 });
    const critical = page.locator('#criticalWarning');
    const shield = page.locator('#shieldWarning');
    const attack = page.locator('#attackWarning');
    const incoming = page.locator('#bossIncoming');
    const pickup = page.locator('#pickupFlash');
    const comms = page.locator('#comms');

    // Inject competing HUD events without affecting the actual game state.
    await page.evaluate(() => {
      document.querySelector('#criticalWarning').hidden = false;
      document.querySelector('#shieldWarning').hidden = false;
      document.querySelector('#attackWarning').textContent = 'ATAQUE INIMIGO IMINENTE';
      document.querySelector('#attackWarning').dataset.severity = 'danger';
      document.querySelector('#bossIncoming').hidden = false;
      document.querySelector('#bossIncoming').textContent = 'CHEFE A CAMINHO';
      document.querySelector('#pickupFlash').hidden = false;
      document.querySelector('#pickupFlash').textContent = 'ITEM COLETADO';
      document.querySelector('#comms').classList.add('active');
    });
    await expect(critical).toBeVisible();
    for (const lower of [shield, attack, incoming, pickup, comms]) {
      await expect(lower, 'critical danger preempts lower-priority message').toBeHidden();
    }

    const geometry = await page.evaluate(() => {
      const bounds = (selector) => {
        const element = document.querySelector(selector);
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      const targets = ['fireTouch', 'boostTouch', 'bombTouch', 'robotTouch'].map((id) => {
        const b = bounds('#' + id);
        const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return { id, target: top?.closest('button')?.id };
      });
      return {
        rail: bounds('#hudNotices'),
        critical: bounds('#criticalWarning'),
        reticle: bounds('#aimReticle'),
        targets,
      };
    });
    expect(geometry.critical.y).toBeGreaterThanOrEqual(geometry.rail.y);
    expect(geometry.critical.y + geometry.critical.height).toBeLessThanOrEqual(
      geometry.rail.y + geometry.rail.height + 1,
    );
    expect(
      geometry.rail.y + geometry.rail.height,
      'emergency alert must stay outside the central gameplay corridor',
    ).toBeLessThan(viewport.height * 0.5);
    for (const target of geometry.targets) {
      expect(target.target, target.id + ' stays tappable during an alert').toBe(target.id);
    }
    await page.screenshot({
      path: info.outputPath('priority-critical-' + viewport.width + 'x' + viewport.height + '.png'),
    });

    // Once critical clears, red attack takes the only visible warning lane.
    await page.evaluate(() => (document.querySelector('#criticalWarning').hidden = true));
    await expect(attack).toBeVisible();
    await expect(shield).toBeHidden();
    await expect(incoming).toBeHidden();

    // Yellow warning is restored without losing its state when the attack ends.
    await page.evaluate(() => {
      const attack = document.querySelector('#attackWarning');
      attack.textContent = 'CONSELHO DE VOO';
      attack.dataset.severity = 'info';
    });
    await expect(shield).toBeVisible();
    await expect(attack).toBeHidden();

    // The incoming boss now takes precedence over informational messages.
    await page.evaluate(() => (document.querySelector('#shieldWarning').hidden = true));
    await expect(incoming).toBeVisible();
    await expect(attack).toBeHidden();
    await expect(pickup).toBeHidden();
  }
  expect(errors).toEqual([]);
});
