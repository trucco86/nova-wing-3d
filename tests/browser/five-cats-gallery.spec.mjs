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
  // Rank titles are localized in title case. The badge identity, not casing,
  // is what the user sees and what this test must verify.
  await expect(page.locator('#pilotRankInsignia')).toContainText(/recruta|cadete|aspirante/i);
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

test('Marvin has a dedicated illustration in the Central, not a playable pilot slot', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  await openMenu(page, 'central');
  const dossier = page.locator('#marvinDossier');
  await expect(dossier).toBeVisible();
  await dossier.locator('summary').click();
  const portrait = dossier.locator('img');
  await expect(portrait).toBeVisible();
  await expect(portrait).toHaveAttribute('src', 'src/assets/marvin-spotlight.webp');
  const response = await page.request.get('/src/assets/marvin-spotlight.webp');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('image/webp');
  await expect(page.locator('#pilot-marvin')).toHaveCount(0);
});

test('per-cat face crop keeps the five portraits identifiable in hangar, roster and profile', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/');
  await openMenu(page, 'hangar');
  await page.locator('#hangarArt').click();
  const focalPoints = {
    bia: { avatar: '70% 0%', profile: '65% 0%', hero: '85% 4%' },
    bob: { avatar: '50% 0%', profile: '50% 0%', hero: '50% 7%' },
    christopher: { avatar: '40% 0%', profile: '40% 0%', hero: '28% 3%' },
    calvin: { avatar: '72% 0%', profile: '65% 5%', hero: '90% 10%' },
    jenifer: { avatar: '35% 3%', profile: '38% 8%', hero: '18% 14%' },
  };
  for (const [pilot, expected] of Object.entries(focalPoints)) {
    await page.locator('#pilot-' + pilot).click();
    await expect(page.locator('#squadSelection')).toHaveAttribute('data-pilot', pilot);
    const actual = await page.evaluate((id) => {
      const style = (selector) => {
        const css = getComputedStyle(document.querySelector(selector));
        return {
          image: css.backgroundImage,
          position: css.backgroundPosition,
          size: css.backgroundSize,
        };
      };
      return {
        avatar: style('#pilot-' + id + ' .cat-avatar'),
        profile: style('#squadSelection .profile-portrait'),
        hero: style('#hangarArtImage'),
      };
    }, pilot);
    for (const surface of ['avatar', 'profile', 'hero']) {
      expect(actual[surface].image).toContain(pilot + '-spotlight.webp');
      expect(actual[surface].position).toBe(expected[surface]);
    }
    expect(actual.avatar.size).toBe('175% auto');
    expect(actual.profile.size).toBe('auto 155%');
    expect(actual.hero.size).toBe('128% auto');
    await expect(page.locator('#hangarArtImage')).toBeVisible();
    await page.screenshot({
      path: info.outputPath('portrait-crop-' + pilot + '-' + info.project.name + '.png'),
    });
  }
});
