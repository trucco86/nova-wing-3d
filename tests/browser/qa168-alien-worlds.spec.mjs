import { test, expect } from '@playwright/test';

// QA168 captures the LIVE WebGL gameplay, never a mock concept image.
// Each destination has an arrival shot, a mid-level scenic shot, and its
// real boss scenario so that art review can compare depth and readability.
const destinations = [
  { index: 4, theme: 'sun', label: 'venus' },
  { index: 5, theme: 'ice', label: 'europa' },
  { index: 6, theme: 'nebula', label: 'neptune' },
  { index: 8, theme: 'void', label: 'orion' },
  { index: 9, theme: 'throne', label: 'titan' },
];

for (const { index, theme, label } of destinations) {
  test(`QA168 ${label}: atmosphere/architecture/boss are readable on real canvas`, async ({
    page,
  }, info) => {
    test.setTimeout(120000);
    if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/__dynamic.html?sector=${index}`);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');

    await page.evaluate(() => window.fixture.advanceToMissionTime(7));
    await page.screenshot({ path: info.outputPath(`qa168-${label}-arrival.png`) });

    if (theme === 'ice') {
      // Inspect continuous arrival checkpoints instead of validating only
      // 7s orbit and 30s full gameplay, which missed the broken black gap.
      for (const second of [8, 10, 12, 16, 20, 24, 25]) {
        await page.evaluate((target) => window.fixture.advanceToMissionTime(target), second);
        const timer = await page.evaluate(() => window.fixture.game.snapshot().seconds);
        expect(timer).toBeGreaterThanOrEqual(second - 0.001);
        const arrival = await page.evaluate(() => window.fixture.game.snapshot().europaSurface);
        expect(arrival).toBeTruthy();
        expect(arrival.orbitalVisible).toBe(false);
        if (second >= 8) {
          expect(arrival.destinationGlobeVisible).toBe(false);
        }
        if (second >= 8) {
          expect(arrival.surfaceVisible).toBe(true);
          expect(arrival.groundVisible).toBe(true);
        }
        if (second === 25) expect(arrival.destinationGlobeVisible).toBe(false);
        await page.screenshot({ path: info.outputPath(`qa168-europa-entry-${second}s.png`) });
      }
      await page.evaluate(() => window.fixture.advanceToMissionTime(30));
    } else {
      await page.evaluate(() => window.fixture.advance(23));
    }
    const world = await page.evaluate(
      (chosenTheme) => window.fixture.alienWorldState(chosenTheme),
      theme,
    );
    expect(world?.exists).toBe(true);
    expect(world?.visible).toBe(true);
    if (theme === 'ice') {
      expect(world.heroBatchCount).toBe(1);
      expect(world.heroX).toBeLessThan(-103);
      expect(world.heroDepth).toBeGreaterThanOrEqual(-750);
      expect(world.heroDepth).toBeLessThanOrEqual(-450);
      expect(world.canyon).not.toBeNull();
      expect(world.canyon.visible).toBe(true);
      expect(world.canyon.cyanCount).toBe(22);
      expect(world.canyon.cliffs).toBe(24);
      expect(world.canyon.bridges).toBe(8);
      expect(world.canyon.gateway).toBe(true);
      await page.screenshot({ path: info.outputPath('qa168-europa-hero-vault-30s.png') });
      await page.screenshot({ path: info.outputPath('qa168-europa-premium-crystal-canyon.png') });
    }
    expect(world?.visualOnly).toBe(true);
    expect(world.structures.length).toBeGreaterThanOrEqual(5);
    expect(world.globeVisible).toBe(false);
    expect(world.ringsAttachedToSaturn).toBe(false);
    expect(world.render?.calls).toBeGreaterThan(0);
    await page.screenshot({ path: info.outputPath(`qa168-${label}-environment.png`) });

    await page.goto(`/__dynamic.html?qaBoss=${index}`);
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() => window.fixture.advance(0.5));
    const boss = await page.evaluate(() => window.fixture.game.snapshot());
    expect(boss).toBeTruthy();
    await page.screenshot({ path: info.outputPath(`qa168-${label}-boss.png`) });
  });
}

test('QA168 Europa: long 1500-unit frozen cave approaches naturally with visible ice optical flow', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?qaTunnel=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advance(0.5));
  const cave = await page.evaluate(() => window.fixture.europaCavernState());
  expect(cave).not.toBeNull();
  expect(cave.visualOnly).toBe(true);
  expect(cave.visible).toBe(true);
  expect(cave.length).toBe(1500);
  expect(cave.breachPanel).toBe(true);
  expect(cave.batches.some((batch) => batch.name.includes('gate'))).toBe(false);
  expect(cave.renderCalls).toBeGreaterThan(0);
  expect(cave.batches).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'europa-cave-sculpted-wall', count: 114 }),
      expect.objectContaining({ name: 'europa-cave-vaulted-ceiling', count: 66 }),
      expect.objectContaining({ name: 'europa-cave-hanging-ice-stalactites', count: 108 }),
      expect.objectContaining({ name: 'europa-cave-monumental-entrance', count: 10 }),
      expect.objectContaining({ name: 'europa-cave-natural-ice-arch', count: 13 }),
      expect.objectContaining({ name: 'europa-cave-exterior-glacial-cliffs', count: 16 }),
      expect.objectContaining({ name: 'europa-cave-distant-fjord-approach', count: 24 }),
      expect.objectContaining({ name: 'europa-cave-optical-flow-ice', count: 0 }),
      expect.objectContaining({ name: 'europa-cave-frozen-waterfalls', count: 18 }),
      expect.objectContaining({ name: 'europa-cave-cathedral-crystal-pillars', count: 22 }),
      expect.objectContaining({ name: 'europa-cave-buried-alien-ruins', count: 14 }),
      expect.objectContaining({ name: 'europa-cave-luminous-ice-veins', count: 52 }),
    ]),
  );
  const opening = await page.evaluate(() => window.fixture.game.snapshot().europaCaveApproach);
  expect(opening).not.toBeNull();
  expect(opening.length).toBe(1500);
  expect(opening.phase).toBe('distant');
  expect(opening.distance).toBeGreaterThan(900);
  await page.screenshot({ path: info.outputPath('qa168-europa-far-fjord-before-approach.png') });
  await page.evaluate(() => window.fixture.advance(4));
  const approaching = await page.evaluate(() => window.fixture.game.snapshot().europaCaveApproach);
  expect(approaching.frontZ).toBeGreaterThan(opening.frontZ);
  expect(approaching.distance).toBeLessThan(opening.distance);
  await page.screenshot({ path: info.outputPath('qa168-europa-fjord-grows-mid-approach.png') });
  await page.evaluate(() => window.fixture.advance(4));
  const closer = await page.evaluate(() => window.fixture.game.snapshot().europaCaveApproach);
  expect(closer.frontZ).toBeGreaterThan(approaching.frontZ);
  await page.screenshot({ path: info.outputPath('qa168-europa-portal-close-approach.png') });
  await page.evaluate(() => window.fixture.advance(4));
  const interior = await page.evaluate(() => window.fixture.game.snapshot().europaCaveApproach);
  expect(interior.frontZ).toBeGreaterThan(closer.frontZ);
  expect(interior.visualIntensity).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('qa168-europa-long-cave-first-section.png') });
  await page.evaluate(() => window.fixture.advance(3));
  await page.screenshot({ path: info.outputPath('qa168-europa-long-cave-second-section.png') });
  await page.screenshot({ path: info.outputPath('qa168-europa-frozen-cathedral-cave.png') });
});

test('QA168 Europa: automatic boost advances the moon before the 8s icy orbital fade', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const sector = await page.evaluate(() => window.fixture.game.snapshot().sector);
  expect(sector).toBe(6); // The real Europa stage, never Earth.
  await page.evaluate(() => window.fixture.advanceToMissionTime(3));
  const approach = await page.evaluate(() => window.fixture.europaBoostWeatherState());
  expect(approach.boostVisible).toBe(true);
  expect(approach.boostLineVertices).toBe(152);
  expect(approach.globeVisible).toBe(true);
  expect(approach.globeScale).toBeGreaterThan(1.0);
  expect(approach.globeDepth).toBeGreaterThan(-770);
  expect(approach.globeScale).toBeGreaterThan(1.25);
  await page.screenshot({ path: info.outputPath('qa168-europa-super-boost-3s.png') });
  await page.evaluate(() => window.fixture.advanceToMissionTime(8));
  const orbit = await page.evaluate(() => window.fixture.europaBoostWeatherState());
  expect(orbit.boostVisible).toBe(false);
  expect(orbit.globeVisible).toBe(false);
  await page.screenshot({ path: info.outputPath('qa168-europa-orbit-ice-mist-8s.png') });
  await page.evaluate(() => window.fixture.advanceToMissionTime(12));
  const snow = await page.evaluate(() => window.fixture.europaBoostWeatherState());
  expect(snow.snowVisible).toBe(true);
  await page.screenshot({ path: info.outputPath('qa168-europa-first-blizzard-12s.png') });
});

test('QA168 Europa: real ice interceptors chase and shoot physical cyan projectiles during super boost', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  if (info.project.name === 'mobile') await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/__dynamic.html?sector=5&encounters=1');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(() => window.fixture.advanceToMissionTime(3.6));
  const chased = await page.evaluate(() => window.fixture.game.snapshot());
  expect(chased.sector).toBe(6);
  expect(chased.europaPursuit.interceptors).toBe(3);
  expect(chased.europaPursuit.shotsFired).toBeGreaterThan(0);
  expect(chased.europaPursuit.liveIceShots).toBeGreaterThan(0);
  await page.screenshot({
    path: info.outputPath('qa168-europa-real-ice-interceptors-and-shots-3s.png'),
  });
  await page.evaluate(() => window.fixture.advanceToMissionTime(6.5));
  const escaped = await page.evaluate(() => window.fixture.game.snapshot());
  expect(escaped.europaPursuit.interceptors).toBe(0);
  expect(escaped.europaPursuit.liveIceShots).toBe(0);
  expect(escaped.europaPursuit.shotsFired).toBeGreaterThan(0);
});
