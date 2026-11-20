import { test, expect } from '@playwright/test';
import { openMenu } from './menu-navigation.mjs';

test('new Bob art is visible from the real hangar, while the selected 3D ship and color persist', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await openMenu(page, 'hangar');
  await page.locator('#pilot-bob').click();
  await expect(page.locator('#profileName')).toHaveText('BOB');
  await expect(page.locator('#squadSelection')).toHaveAttribute('data-pilot', 'bob');
  await page.locator('#hangarArt').click();
  await expect(page.locator('#hangarArtImage')).toBeVisible();
  await expect(page.locator('#hangarCanvas')).toBeHidden();
  await expect(page.locator('#hangarArtImage')).toHaveAttribute('aria-label', /BOB/);
  expect(
    await page
      .locator('#hangarArtImage')
      .evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toContain('bob-spotlight.webp');
  const bobArt = await page.request.get('/src/assets/bob-spotlight.webp');
  expect(bobArt.ok()).toBeTruthy();
  await page.screenshot({ path: info.outputPath('new-bob-art-preview.png') });
  await page.locator('#hangarShip').click();
  await expect(page.locator('#hangarCanvas')).toBeVisible();
  await page.locator('#hangarTabShips').click();
  await page.locator('#ship-specter').click();
  await page.locator('#ship-color-gold').click();
  await expect(page.locator('#squadSelection')).toHaveAttribute('data-ship', 'specter');
  await expect(page.locator('#squadSelection')).toHaveAttribute('data-ship-color', 'gold');
  await expect(page.locator('#fleetConceptPreview')).toBeVisible();
  const art = await page.request.get('/src/assets/five-cats-ships-concept.webp');
  expect(art.ok()).toBeTruthy();
  await page.locator('#hangarTabArsenal').click();
  await expect(page.locator('.nova-art-arsenal')).toBeVisible();
  await page.locator('.nova-art-arsenal summary').click();
  await expect(page.locator('.nova-art-arsenal img')).toHaveCount(2);
});

test('pilot portraits and insignia artwork work on mobile without obscuring the roster', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await openMenu(page, 'hangar');
  await expect(page.locator('#pilot-bia .cat-avatar')).toBeVisible();
  await expect(page.locator('#pilot-bob .cat-avatar')).toBeVisible();
  await page.locator('#pilot-bob').click();
  await expect(page.locator('#pilotRankInsignia')).toContainText(/RECRUTA|CADETE|ASPIRANTE/i);
  expect(
    await page
      .locator('#pilotRankInsignia')
      .evaluate((node) => getComputedStyle(node, '::before').backgroundImage),
  ).toContain('five-cats-rank-emblems.webp');
  await page.screenshot({ path: info.outputPath('five-cats-art-mobile.png') });
});

test('every Five Cats pilot uses their dedicated illustrated highlight, not the low-res collage', async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto('/');
  await openMenu(page, 'hangar');
  await page.locator('#hangarArt').click();
  for (const id of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    await page.locator('#pilot-' + id).click();
    await expect(page.locator('#squadSelection')).toHaveAttribute('data-pilot', id);
    const image = await page
      .locator('#hangarArtImage')
      .evaluate((element) => getComputedStyle(element).backgroundImage);
    expect(image).toContain(id + '-spotlight.webp');
    const response = await page.request.get('/src/assets/' + id + '-spotlight.webp');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('image/webp');
  }
});
