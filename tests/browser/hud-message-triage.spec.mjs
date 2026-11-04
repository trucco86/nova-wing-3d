import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 320, height: 568 },
]) {
  test(
    'combat notifications use one compact priority rail at ' +
      viewport.width +
      'x' +
      viewport.height,
    async ({ page }, info) => {
      test.setTimeout(85000);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.goto('/__dynamic.html?sector=5&qaBoss=5');
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
      await expect(page.locator('#bossHUD')).toBeVisible();
      const stats = await page.evaluate(() => {
        const $ = (id) => document.getElementById(id);
        const alerts = [
          $('criticalWarning'),
          $('shieldWarning'),
          $('bossIncoming'),
          $('attackWarning'),
          $('pickupFlash'),
          $('comms'),
        ];
        const visible = (element) =>
          !element.hidden &&
          getComputedStyle(element).display !== 'none' &&
          getComputedStyle(element).visibility !== 'hidden';
        // Simulate simultaneous real alerts: text/ARIA must survive arbitration.
        document.body.classList.remove('stage-intro');
        $('bossIncoming').hidden = true;
        $('comms').classList.add('active');
        $('message').textContent = 'BOB · FORMATO DE RÁDIO MAIS CURTO';
        $('attackWarning').textContent = '⚠ HIDRA · FOGO CRUZADO · SIGA A ZONA VERDE DO RADAR';
        $('attackWarning').dataset.severity = 'danger';
        $('shieldWarning').hidden = false;
        $('criticalWarning').hidden = false;
        const critical = alerts.filter(visible).map((element) => element.id);
        $('criticalWarning').hidden = true;
        const attack = alerts.filter(visible).map((element) => element.id);
        $('attackWarning').textContent = '';
        $('shieldWarning').hidden = true;
        $('pickupFlash').hidden = false;
        const pickup = alerts.filter(visible).map((element) => element.id);
        $('pickupFlash').hidden = true;
        const radio = alerts.filter(visible).map((element) => element.id);
        const rect = $('comms').getBoundingClientRect();
        const info = {
          radioHeight: rect.height,
          radioWidth: rect.width,
          text: $('message').textContent,
          fullAlert: '⚠ HIDRA · FOGO CRUZADO · SIGA A ZONA VERDE DO RADAR',
          control: getComputedStyle($('strategyControls')).pointerEvents,
        };
        $('comms').classList.remove('active');
        return { critical, attack, pickup, radio, info };
      });
      expect(stats.critical).toContain('criticalWarning');
      expect(stats.critical).not.toContain('attackWarning');
      expect(stats.critical).not.toContain('comms');
      expect(stats.attack).toContain('attackWarning');
      expect(stats.attack).not.toContain('comms');
      expect(stats.attack).not.toContain('shieldWarning');
      expect(stats.pickup).toContain('pickupFlash');
      expect(stats.pickup).not.toContain('comms');
      expect(stats.radio).toContain('comms');
      expect(stats.info.radioHeight).toBeLessThanOrEqual(75);
      expect(stats.info.radioWidth).toBeLessThanOrEqual(360);
      expect(errors).toEqual([]);
      await page.screenshot({
        path: info.outputPath('message-triage-' + viewport.width + 'x' + viewport.height + '.png'),
      });
    },
  );
}
