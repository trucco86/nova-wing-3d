import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { inspectHudOverlap } from '../../tools/gameplay-hud-overlap.mjs';

test('reactor orbit HUD label overlap advisory', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/__dynamic.html?sector=3&qaBoss=3');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(4.2));
  const samples = [];
  await page.evaluate(() => window.fixture.game.orbit(1));
  try {
    for (let i = 0; i < 36; i++) {
      const sample = await page.evaluate(() => {
        const { game, advance } = window.fixture;
        advance(0.15);
        const ids = ['weakCue0', 'weakCue1', 'attackWarning', 'bossName', 'bossState'];
        return {
          seconds: game.snapshot().seconds,
          labels: ids.map((id) => {
            const node = document.getElementById(id);
            if (!node) throw new Error('Missing HUD label ' + id);
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            return {
              id,
              text: node.textContent,
              visible:
                !!node.textContent.trim() &&
                !node.hidden &&
                node.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              opacity: style.opacity,
            };
          }),
        };
      });
      samples.push(sample);
      const result = inspectHudOverlap(samples);
      if (result.findings.some((finding) => finding.seconds === sample.seconds)) {
        const path = info.outputPath('hud-overlap-' + i + '.png');
        await page.screenshot({ path });
        await info.attach('candidate-overlap', { path, contentType: 'image/png' });
      }
    }
  } finally {
    await page.evaluate(() => {
      window.fixture.game.orbit(0);
      window.fixture.advance(0);
    });
  }
  const result = inspectHudOverlap(samples);
  const path = info.outputPath('hud-overlap.json');
  await writeFile(path, JSON.stringify({ project: info.project.name, result, samples }, null, 2));
  await info.attach('hud-overlap.json', { path, contentType: 'application/json' });
  console.log('HUD_OVERLAP ' + JSON.stringify({ project: info.project.name, ...result }));
  expect(errors).toEqual([]);
  expect(result.status).not.toBe('BLOCKED');
});
