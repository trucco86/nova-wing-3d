import { test, expect } from '@playwright/test';

test('guest ranking shows victories and defeats locally without showing over gameplay', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const history = [
      {
        id: 'defeated-run',
        sector: 3,
        points: 16,
        durationMs: 54000,
        outcome: 'defeated',
        completedAt: '2026-10-27T18:20:00.000Z',
      },
      {
        id: 'cleared-run',
        sector: 2,
        points: 42,
        durationMs: 61000,
        outcome: 'cleared',
        completedAt: '2026-10-27T18:10:00.000Z',
      },
    ];
    localStorage.setItem('nova-wing-score-history-v1', JSON.stringify(history));
  });
  await page.goto('/');
  const ranking = page.locator('#novaRanking');
  await expect(ranking.locator('summary')).toBeVisible();
  await ranking.locator('summary').click();
  await expect(ranking.locator('[data-rank-summary]')).toContainText('2 partidas');
  const rows = ranking.locator('[data-rank-local] li');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('DERROTA');
  await expect(rows.nth(1)).toContainText('CONCLUÍDO');
  await expect(ranking.locator('[data-rank-global]')).toContainText('Ranking online indisponível');
  await expect(page.locator('#novaAuth')).toBeHidden();
  await page.screenshot({ path: info.outputPath('guest-historical-rank.png') });

  // The expanded ranking panel is an interactive menu surface. Dismiss it
  // before starting gameplay, then assert that live combat hides all account UI.
  await ranking.locator('summary').click();
  await expect(ranking).not.toHaveAttribute('open', '');
  await page.locator('#start').click();
  await page.locator('#cinematicSkip').click();
  await expect(ranking).toBeHidden();
  expect(errors).toEqual([]);
});
