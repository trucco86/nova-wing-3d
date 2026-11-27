import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { SECTORS } from '../../src/campaign.js';
import { combatDecision } from '../../tools/gameplay-boss-action-policy.mjs';
import { visibleAim, applyVisibleAim } from '../../tools/gameplay-boss-visible-aim.mjs';
import { equipmentDecision } from '../../tools/gameplay-boss-equipment-policy.mjs';
import { orbitalDecision } from '../../tools/gameplay-boss-orbit-policy.mjs';
import { campaignFlight } from '../../tools/gameplay-campaign-pilot.mjs';
import {
  dodgeDecision,
  dodgeKeys,
  dodgeTouchOffset,
} from '../../tools/gameplay-boss-dodge-policy.mjs';
import {
  summarizeEncounter,
  compareEncounters,
} from '../../tools/gameplay-boss-encounter-metrics.mjs';

async function runEncounter(
  page,
  info,
  sector,
  reactive,
  active = false,
  tactical = false,
  aimed = false,
  extended = false,
  orbital = false,
  reuseCampaign = false,
) {
  if (!reuseCampaign) await page.goto('/__dynamic.html?sector=' + sector + '&qaBoss=' + sector);
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#bossHUD')).toBeVisible();
  const samples = [];
  const specialEvents = [];
  const equipmentEvents = [];
  const utilityEvents = [];
  let orbitSteps = 0;
  let terminal = null;
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on('pageerror', onError);
  const mobile = info.project.name === 'mobile';
  const touch = mobile ? await page.context().newCDPSession(page) : null;
  const stick = mobile ? await page.locator('#stick').boundingBox() : null;
  let pressed = [];
  let touching = false;
  let firing = false;
  const fireButton = mobile && active ? await page.locator('#fireTouch').boundingBox() : null;
  const limit = extended ? 960 : active ? 240 : 120;
  try {
    if (mobile && !stick) throw new Error('Missing mobile joystick');
    if (mobile && active && !fireButton) throw new Error('Missing mobile fire control');
    // Separate fixture executions start at the same authored encounter.
    // Only the reactive route consumes the visible radar guide.
    for (let i = 0; i <= limit; i++) {
      const state = await page.evaluate(() => {
        const s = window.fixture.game.snapshot();
        const radar = document.getElementById('battleRadar');
        const guide = document.getElementById('radarGuide');
        const danger = guide.getAttribute('data-danger');
        const marker = (id) => {
          const node = document.getElementById(id);
          return {
            id,
            visible:
              !node.hidden &&
              node.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
            x: Number.parseFloat(node.style.left),
            y: Number.parseFloat(node.style.top),
            state: node.getAttribute('data-state'),
          };
        };
        const angle = (id) => {
          const node = document.getElementById(id);
          if (node.hidden || !node.checkVisibility({ visibilityProperty: true })) return null;
          const match = /^rotate\(([-.\d]+)rad\)$/.exec(node.style.transform);
          return match ? Number(match[1]) : null;
        };
        return {
          bossText: document.getElementById('bossState').textContent,
          coreVulnerable:
            s.bossParts === 0 &&
            document.getElementById('bossHUD').getAttribute('data-vulnerable') === 'true',
          lockReady: !document.getElementById('lockTouch').hidden,
          lockEnabled: s.mecha.lockEnabled,
          lockVisible: marker('mechaLockReticle').visible,
          playerAngle: angle('radarPlayer'),
          targetAngle: angle('radarWeak'),
          targetVisible: angle('radarWeak') !== null,
          scanReady: !document.getElementById('scanBoss').disabled,
          repairReady: !document.getElementById('repairPulse').disabled,
          precisionReady: !document.getElementById('precisionShot').disabled,
          tacticEnergy: s.tactics.energy,
          arcana: s.strategy.arcana,
          age: s.bossAge,
          energy: s.energy,
          pods: s.pods,
          podsDetached: s.podsDetached,
          robot: s.mecha.active,
          lives: s.lives,
          shield: s.shield,
          bossHp: s.bossHp,
          bossIntegrity: s.bossIntegrity,
          bossParts: s.bossParts,
          screen: {
            width: window.innerWidth,
            height: window.innerHeight,
            reticle: marker('aimReticle'),
            cues: [marker('weakCue0'), marker('weakCue1')],
          },
          shots: s.entities.shots,
          coreOpen: s.coreOpen,
          plasmaReady: !document.getElementById('plasmaTitan').disabled,
          overdriveReady: !document.getElementById('fiveCatsOverdrive').disabled,
          specialActive: (s.fiveCats?.plasmaTime ?? 0) > 0 || (s.fiveCats?.overdriveTime ?? 0) > 0,
          player: s.player,
          state: s.state,
          boss: s.boss,
          phase: s.tactics.state,
          cycle: s.tactics.cycle,
          kind: s.bossIntent?.kind ?? null,
          mode: radar.getAttribute('data-mode'),
          danger: danger === 'true' ? true : danger === 'false' ? false : null,
          guide: guide.hidden ? null : guide.textContent,
        };
      });
      terminal = state;
      if (!state.boss || state.state !== 'playing') break;
      let decision = active
        ? combatDecision(state, { tactical })
        : reactive
          ? dodgeDecision(state)
          : { x: 0, y: 0, reason: 'passive' };
      const aim = aimed ? visibleAim(state.screen) : null;
      if (aim) decision = applyVisibleAim(decision, aim);
      if (extended) {
        decision = equipmentDecision(
          state,
          decision,
          equipmentEvents.map((event) => event.control),
        );
      }
      if (orbital) decision = orbitalDecision(state, decision, samples[0]?.shield ?? state.shield);
      const keys = dodgeKeys(decision);
      samples.push({ ...state, aim, decision, input: keys });
      if (i === limit) break;
      if (active && firing && !decision.fire) {
        if (mobile) await page.mouse.up();
        else await page.keyboard.up('Space');
        firing = false;
      }
      if (touch) {
        if (touching) {
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          });
          touching = false;
        }
        if (keys.length) {
          const center = {
            x: stick.x + stick.width / 2,
            y: stick.y + stick.height / 2,
            id: 1,
          };
          const offset = dodgeTouchOffset(decision, Math.min(stick.width, stick.height) * 0.4);
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [center],
          });
          touching = true;
          await touch.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ ...center, x: center.x + offset.x, y: center.y + offset.y }],
          });
        }
      } else {
        for (const key of pressed.filter((key) => !keys.includes(key))) {
          await page.keyboard.up(key);
        }
        for (const key of keys.filter((key) => !pressed.includes(key))) {
          await page.keyboard.down(key);
        }
        pressed = keys;
      }
      if (decision.equipment) {
        if (mobile) {
          const button = page.locator(decision.equipment === 'pods' ? '#podsTouch' : '#robotTouch');
          await expect(button).toBeVisible();
          await button.tap();
        } else await page.keyboard.press(decision.equipment === 'pods' ? 'KeyV' : 'KeyT');
        const after = await page.evaluate(() => {
          const s = window.fixture.game.snapshot();
          return { robot: s.mecha.active, podsDetached: s.podsDetached, energy: s.energy };
        });
        equipmentEvents.push({ age: state.age, control: decision.equipment, ...after });
      }
      if (decision.utility === 'lock') {
        if (mobile) {
          await expect(page.locator('#lockTouch')).toBeVisible();
          await page.locator('#lockTouch').tap();
        } else await page.keyboard.press('KeyN');
        const enabled = await page.evaluate(() => window.fixture.game.snapshot().mecha.lockEnabled);
        utilityEvents.push({ action: 'lock', age: state.age, enabled });
      } else if (decision.utility) {
        const ids = { scan: 'scanBoss', repair: 'repairPulse', precision: 'precisionShot' };
        const shortcuts = { scan: 'KeyI', repair: 'KeyR', precision: 'KeyK' };
        if (mobile) {
          const drawer = page.locator('#strategyDrawer');
          if ((await drawer.getAttribute('open')) === null) await drawer.locator('summary').click();
          const category = page.locator('[data-rpg-category="utilities"]');
          if (await category.isVisible()) await category.click();
          const button = page.locator('#' + ids[decision.utility]);
          await expect(button).toBeVisible();
          await expect(button).toBeEnabled();
          await button.click();
          if ((await drawer.getAttribute('open')) !== null) await drawer.locator('summary').click();
        } else await page.keyboard.press(shortcuts[decision.utility]);
        const after = await page.evaluate(() => {
          const s = window.fixture.game.snapshot();
          return { shield: s.shield, arcana: s.strategy.arcana, tacticEnergy: s.tactics.energy };
        });
        utilityEvents.push({
          action: decision.utility,
          age: state.age,
          before: { shield: state.shield, arcana: state.arcana, tacticEnergy: state.tacticEnergy },
          after,
        });
      }
      if (decision.special) {
        const before = await page.evaluate(() => window.fixture.game.snapshot().strategy.arcana);
        if (mobile) {
          const drawer = page.locator('#strategyDrawer');
          if ((await drawer.getAttribute('open')) === null) await drawer.locator('summary').click();
          const category = page.locator('[data-rpg-category="specials"]');
          if (await category.isVisible()) await category.click();
          const power = page.locator(
            decision.special === 'plasma' ? '#plasmaTitan' : '#fiveCatsOverdrive',
          );
          await expect(power).toBeVisible();
          await expect(power).toBeEnabled();
          await power.click();
          if ((await drawer.getAttribute('open')) !== null) await drawer.locator('summary').click();
        } else await page.keyboard.press(decision.special === 'plasma' ? 'KeyY' : 'KeyO');
        const after = await page.evaluate(() => {
          const s = window.fixture.game.snapshot();
          return {
            arcana: s.strategy.arcana,
            plasma: s.fiveCats.plasmaTime,
            overdrive: s.fiveCats.overdriveTime,
          };
        });
        specialEvents.push({ age: state.age, special: decision.special, before, ...after });
      }
      if (active && decision.fire && !firing) {
        if (mobile) {
          await page.mouse.move(
            fireButton.x + fireButton.width / 2,
            fireButton.y + fireButton.height / 2,
          );
          await page.mouse.down();
        } else await page.keyboard.down('Space');
        firing = true;
      }
      if (decision.orbit) {
        const key = decision.orbit < 0 ? 'KeyJ' : 'KeyL';
        if (mobile) {
          const button = page.locator(decision.orbit < 0 ? '#orbitLeft' : '#orbitRight');
          await expect(button).toBeVisible();
          const bounds = await button.boundingBox();
          if (!bounds) throw new Error('Missing orbit control');
          await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
          await page.mouse.down();
          try {
            await page.evaluate(() => window.fixture.advance(0.25, { renderAfter: false }));
          } finally {
            await page.mouse.up();
          }
        } else {
          await page.keyboard.down(key);
          try {
            await page.evaluate(() => window.fixture.advance(0.25, { renderAfter: false }));
          } finally {
            await page.keyboard.up(key);
          }
        }
        orbitSteps++;
      } else await page.evaluate(() => window.fixture.advance(0.25, { renderAfter: false }));
    }
    await page.evaluate(() => window.fixture.advance(0));
    const label = extended
      ? aimed
        ? 'extended-aimed'
        : 'extended-tactical'
      : aimed
        ? 'aimed'
        : tactical
          ? 'tactical'
          : active
            ? 'active'
            : reactive
              ? 'reactive'
              : 'passive';
    const path = info.outputPath(label + '-boss.png');
    await page.screenshot({ path });
    await info.attach(label + '-checkpoint', { path, contentType: 'image/png' });
  } finally {
    if (firing) {
      if (mobile) await page.mouse.up();
      else await page.keyboard.up('Space');
    }
    for (const key of pressed) await page.keyboard.up(key);
    if (touch) {
      if (touching) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await touch.detach();
    }
    page.off('pageerror', onError);
  }
  return {
    samples,
    errors,
    specialEvents,
    equipmentEvents,
    utilityEvents,
    orbitSteps,
    terminal,
    metrics: summarizeEncounter(samples),
  };
}

for (const encounter of [
  { sector: 0, name: 'Rok' },
  { sector: 5, name: 'Colossus' },
]) {
  test('boss reactive probe: ' + encounter.name, async ({ page }, info) => {
    test.setTimeout(180000);
    const passive = await runEncounter(page, info, encounter.sector, false);
    const reactive = await runEncounter(page, info, encounter.sector, true);
    const comparison = compareEncounters(passive.metrics, reactive.metrics);
    const evidence = { encounter, project: info.project.name, passive, reactive, comparison };
    const path = info.outputPath('boss-comparison.json');
    await writeFile(path, JSON.stringify(evidence, null, 2) + '\n');
    await info.attach('boss-comparison.json', { path, contentType: 'application/json' });
    console.log(
      'BOSS_COMPARISON ' +
        JSON.stringify({
          encounter: encounter.name,
          project: info.project.name,
          ...comparison,
        }),
    );
    expect(passive.errors).toEqual([]);
    expect(reactive.errors).toEqual([]);
    expect(passive.metrics.attackWindows, 'passive physical warnings').toBeGreaterThan(0);
    expect(reactive.metrics.attackWindows, 'reactive physical warnings').toBeGreaterThan(0);
    // No arbitrary success assertion for shield loss; report differences for review.
    expect(comparison.releaseAuthorized).toBe(false);
  });
}

test('active Rok pilot alternates visible dodge cues and real fire input', async ({
  page,
}, info) => {
  test.setTimeout(180000);
  const run = await runEncounter(page, info, 0, true, true);
  const actions = run.samples.slice(0, -1).map((sample) => sample.decision.action);
  const observed = {
    project: info.project.name,
    actionCounts: Object.fromEntries(
      [...new Set(actions)].map((action) => [action, actions.filter((a) => a === action).length]),
    ),
    maxShots: Math.max(0, ...run.samples.map((sample) => sample.shots)),
    bossHpStart: run.samples[0]?.bossHp ?? null,
    bossHpEnd: run.samples.at(-1)?.bossHp ?? null,
    metrics: run.metrics,
    releaseAuthorized: false,
  };
  const path = info.outputPath('active-boss-pilot.json');
  await writeFile(path, JSON.stringify({ observed, samples: run.samples }, null, 2) + '\n');
  await info.attach('active-boss-pilot', { path, contentType: 'application/json' });
  console.log('ACTIVE_BOSS_PILOT ' + JSON.stringify(observed));
  expect(run.errors).toEqual([]);
  expect(observed.maxShots, 'real player projectiles').toBeGreaterThan(0);
  expect(actions).toContain('dodge');
  expect(actions).toContain('fire-recovery');
  expect(observed.releaseAuthorized).toBe(false);
});

test('Rok tactical pilot compares team specials with ordinary fire on the same build', async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const baseline = await runEncounter(page, info, 0, true, true);
  const tactical = await runEncounter(page, info, 0, true, true, true);
  const result = (run) => ({
    bossHpStart: run.samples[0]?.bossHp ?? null,
    bossHpEnd: run.samples.at(-1)?.bossHp ?? null,
    shieldLoss: run.metrics.shieldLoss,
    observedSeconds: run.metrics.observedSeconds,
    specialEvents: run.specialEvents,
  });
  const report = {
    project: info.project.name,
    baseline: result(baseline),
    tactical: result(tactical),
    releaseAuthorized: false,
  };
  const path = info.outputPath('tactical-boss-comparison.json');
  await writeFile(path, JSON.stringify({ report, baseline, tactical }, null, 2) + '\n');
  await info.attach('tactical-boss-comparison', { path, contentType: 'application/json' });
  console.log('TACTICAL_BOSS_COMPARISON ' + JSON.stringify(report));
  expect(baseline.errors).toEqual([]);
  expect(tactical.errors).toEqual([]);
  expect(baseline.specialEvents).toHaveLength(0);
  expect(tactical.specialEvents.length, 'real power activation').toBeGreaterThan(0);
  for (const event of tactical.specialEvents) {
    expect(event.arcana).toBeLessThan(event.before);
    expect(event.special === 'plasma' ? event.plasma : event.overdrive).toBeGreaterThan(0);
  }
  expect(report.releaseAuthorized).toBe(false);
});

test('Rok visible aim pilot compares targeting with ordinary fire', async ({ page }, info) => {
  test.setTimeout(240000);
  // Do not introduce special powers into this A/B: isolate the aim heuristic.
  const baseline = await runEncounter(page, info, 0, true, true);
  const aimed = await runEncounter(page, info, 0, true, true, false, true);
  const measure = (run) => ({
    seconds: run.metrics.observedSeconds,
    shieldLoss: run.metrics.shieldLoss,
    bossHpStart: run.samples[0]?.bossHp ?? null,
    bossHpEnd: run.samples.at(-1)?.bossHp ?? null,
    integrityStart: run.samples[0]?.bossIntegrity ?? null,
    integrityEnd: run.samples.at(-1)?.bossIntegrity ?? null,
    partsStart: run.samples[0]?.bossParts ?? null,
    partsEnd: run.samples.at(-1)?.bossParts ?? null,
    maxShots: Math.max(0, ...run.samples.map((sample) => sample.shots)),
    aimAdjustments: run.samples
      .slice(0, -1)
      .filter((sample) => sample.decision.action === 'aim-weakpoint').length,
    aligned: run.samples.filter((sample) => sample.aim?.status === 'aligned').length,
    observedTargets: run.samples.filter((sample) => sample.aim?.id).length,
  });
  const report = {
    project: info.project.name,
    baseline: measure(baseline),
    aimed: measure(aimed),
    releaseAuthorized: false,
  };
  const path = info.outputPath('visible-aim-comparison.json');
  await writeFile(path, JSON.stringify({ report, baseline, aimed }, null, 2) + '\n');
  await info.attach('visible-aim-comparison', { path, contentType: 'application/json' });
  console.log('VISIBLE_AIM_COMPARISON ' + JSON.stringify(report));
  expect(baseline.errors).toEqual([]);
  expect(aimed.errors).toEqual([]);
  expect(report.aimed.observedTargets, 'visible weakpoint coverage').toBeGreaterThan(0);
  expect(report.aimed.aimAdjustments, 'actual corrective steering').toBeGreaterThan(0);
  expect(report.aimed.maxShots, 'real projectiles fired').toBeGreaterThan(0);
  expect(report.releaseAuthorized).toBe(false);
});

test('Rok extended autonomous attempt compares tactical equipment with and without aim', async ({
  page,
}, info) => {
  test.setTimeout(720000);
  const tactical = await runEncounter(page, info, 0, true, true, true, false, true);
  const combined = await runEncounter(page, info, 0, true, true, true, true, true);
  const measure = (run) => {
    const final = run.terminal;
    const victory = final?.bossHp === 0 && ['collapsing', 'shop', 'won'].includes(final.state);
    return {
      outcome: victory
        ? 'BOSS_DEFEATED'
        : final?.state === 'playing'
          ? 'TIME_LIMIT'
          : 'INTERRUPTED',
      finalState: final?.state ?? null,
      bossHp: final?.bossHp ?? null,
      bossParts: final?.bossParts ?? null,
      shield: final?.shield ?? null,
      lives: final?.lives ?? null,
      seconds: run.metrics.observedSeconds,
      initialLoadout: {
        pods: run.samples[0]?.pods,
        shield: run.samples[0]?.shield,
        lives: run.samples[0]?.lives,
      },
      equipmentEvents: run.equipmentEvents,
      specialEvents: run.specialEvents,
      attackPatterns: run.metrics.patterns,
    };
  };
  const report = {
    project: info.project.name,
    tactical: measure(tactical),
    combined: measure(combined),
    releaseAuthorized: false,
  };
  const path = info.outputPath('extended-rok-comparison.json');
  await writeFile(path, JSON.stringify({ report, tactical, combined }, null, 2) + '\n');
  await info.attach('extended-rok-comparison', { path, contentType: 'application/json' });
  console.log('EXTENDED_ROK_COMPARISON ' + JSON.stringify(report));
  for (const run of [tactical, combined]) {
    expect(run.errors).toEqual([]);
    expect(run.specialEvents.length).toBeGreaterThan(0);
    expect(
      run.equipmentEvents.some((event) => event.control === 'pods' && event.podsDetached),
    ).toBe(true);
    expect(run.equipmentEvents.some((event) => event.control === 'robot' && event.robot)).toBe(
      true,
    );
    expect(run.terminal).not.toBeNull();
  }
  // Rok is a proven regression contract for this isolated QA loadout.
  expect(report.tactical.outcome).toBe('BOSS_DEFEATED');
  expect(report.combined.outcome).toBe('BOSS_DEFEATED');
  expect(report.releaseAuthorized).toBe(false);
});

// Opt-in exploratory matrix. A non-victory is reported, not mistaken for
// a regression pass or a release authorization. No production gate expansion.
const matrixSector = process.env.NOVA_QA_BOSS_SECTOR;
if (/^[1-9]$/.test(matrixSector ?? '')) {
  const sector = Number(matrixSector);
  test('autonomous matrix: ' + SECTORS[sector].boss, async ({ page }, info) => {
    test.setTimeout(720000);
    const run = await runEncounter(page, info, sector, true, true, true, true, true, true);
    const final = run.terminal;
    const victory = final?.bossHp === 0 && ['collapsing', 'shop', 'won'].includes(final.state);
    const report = {
      sector: sector + 1,
      boss: SECTORS[sector].boss,
      project: info.project.name,
      outcome: victory
        ? 'BOSS_DEFEATED'
        : final?.state === 'playing'
          ? 'TIME_LIMIT'
          : 'INTERRUPTED',
      initial: {
        bossHp: run.samples[0]?.bossHp ?? null,
        shield: run.samples[0]?.shield ?? null,
        pods: run.samples[0]?.pods ?? null,
        lives: run.samples[0]?.lives ?? null,
      },
      final: {
        state: final?.state ?? null,
        bossHp: final?.bossHp ?? null,
        bossParts: final?.bossParts ?? null,
        integrity: final?.bossIntegrity ?? null,
        shield: final?.shield ?? null,
        lives: final?.lives ?? null,
      },
      seconds: run.metrics.observedSeconds,
      specialEvents: run.specialEvents,
      equipmentEvents: run.equipmentEvents,
      utilityEvents: run.utilityEvents,
      orbitSteps: run.orbitSteps,
      attackPatterns: run.metrics.patterns,
      errors: run.errors,
      humanApproval: 'PENDING',
      releaseAuthorized: false,
    };
    const path = info.outputPath('autonomous-matrix-result.json');
    await writeFile(path, JSON.stringify({ report, run }, null, 2) + '\n');
    await info.attach('autonomous-matrix-result', { path, contentType: 'application/json' });
    console.log('AUTONOMOUS_MATRIX ' + JSON.stringify(report));
    expect(run.samples.length, 'real encounter exposure').toBeGreaterThan(0);
    expect(run.terminal).not.toBeNull();
    expect(run.errors).toEqual([]);
    // Previously defeated bosses are hard regression contracts in this matrix.
    // Unproven bosses remain exploratory until a real victory is observed.
    if ([1, 2, 3].includes(sector)) {
      expect(report.outcome).toBe('BOSS_DEFEATED');
      expect(report.final.bossParts).toBe(0);
      expect(report.final.lives).toBe(report.initial.lives);
    }
  });
}

if (process.env.NOVA_QA_CAMPAIGN === '1') {
  test('fresh campaign pilot: city to Rok without boss skip', async ({ page }, info) => {
    test.setTimeout(720000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/__dynamic.html?sector=0&freshCampaign=1&intro=1&encounters=1');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    const snapshot = () =>
      page.evaluate(() => {
        const game = window.fixture.game.snapshot();
        return {
          ...game,
          launchCinematic: document.body.classList.contains('launch-cinematic'),
          repairReady: !document.getElementById('repairPulse').disabled,
        };
      });
    const initial = await snapshot();
    expect(initial.developerSession).toBe(false);
    expect(initial.weapon).toBe(1);
    expect(initial.pods).toBe(0);
    expect(initial.credits).toBe(0);
    const launchButton = page.locator('#launchSkip');
    const launchSkipped = await launchButton.isVisible();
    if (launchSkipped) await launchButton.click();
    await page.locator('body.in-mission:not(.launch-cinematic)').waitFor({ state: 'attached' });
    expect(
      await page.locator('body').evaluate((body) => body.classList.contains('launch-cinematic')),
    ).toBe(false);
    const mobile = info.project.name === 'mobile';
    const touch = mobile ? await page.context().newCDPSession(page) : null;
    const center = async (id) => {
      const bounds = await page.locator(id).boundingBox();
      if (!bounds) throw new Error('Missing control ' + id);
      return {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
        radius: Math.min(bounds.width, bounds.height) * 0.4,
      };
    };
    const phases = new Set();
    const stages = [];
    const collisionEvents = [];
    const damageEvents = [];
    const pressed = new Set();
    const specialUsed = new Set();
    const transformEvents = [];
    const bombEvents = [];
    const specialEvents = [];
    const repairEvents = [];
    const multiLockEvents = [];
    let previous = null;
    let touching = false;
    let robotUsed = false;
    let bombUsed = false;
    let lockUsed = false;

    try {
      for (let i = 0; i < 2400; i++) {
        const current = { ...(await snapshot()), initialShield: initial.shield };
        if (current.state !== 'playing' || current.boss) break;
        const action = campaignFlight(current, previous);
        const shieldDamage =
          previous && Number.isFinite(previous.shield) && current.shield < previous.shield
            ? previous.shield - current.shield
            : 0;
        if (shieldDamage > 0) {
          damageEvents.push({
            seconds: current.seconds,
            damage: shieldDamage,
            player: current.player,
            hostilePositions: (current.hostilePositions ?? []).map((point) => [...point]),
            targets: (current.targets ?? []).map((target) => ({
              kind: target.kind,
              x: target.x,
              y: target.y,
              z: target.z,
              charging: target.charging,
            })),
          });
        }
        const impactDelta = (current.cityImpactCount ?? 0) - (previous?.cityImpactCount ?? 0);
        if (impactDelta > 0) {
          const event = {
            seconds: current.seconds,
            delta: impactDelta,
            player: current.player,
            hazards: (current.cityHazardSolids ?? []).map((solid) => ({
              kind: solid.kind,
              x: solid.x,
              y: solid.y,
              z: solid.z,
              halfX: solid.halfX,
              halfY: solid.halfY,
              halfZ: solid.halfZ,
            })),
          };
          collisionEvents.push(event);
          if (collisionEvents.length <= 4) {
            await page.screenshot({
              path: info.outputPath('city-impact-' + collisionEvents.length + '.png'),
            });
          }
        }
        const phase = current.orbitalLaunch?.phase ?? 'city';
        if (!phases.has(phase)) {
          phases.add(phase);
          await page.screenshot({ path: info.outputPath('campaign-' + phase + '.png') });
        }
        if (i % 20 === 0) {
          stages.push({
            seconds: current.seconds,
            phase,
            shield: current.shield,
            lives: current.lives,
            credits: current.credits,
            weapon: current.weapon,
            bombs: current.bombs,
            energy: current.energy,
            player: current.player,
            cityImpactCount: current.cityImpactCount,
            activeCitySolids:
              current.cityPhysicalSolids?.filter((solid) => solid.active).length ?? 0,
            activeCityHazards: current.cityHazardSolids?.length ?? 0,
            hostileProjectiles: current.hostilePositions?.length ?? 0,
            targets: current.targets?.length ?? 0,
            action,
          });
        }

        if (touch && touching) {
          await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          touching = false;
        }

        if (action.repair) {
          const before = current.shield;
          if (mobile) {
            const drawer = page.locator('#strategyDrawer');
            if ((await drawer.getAttribute('open')) === null)
              await drawer.locator('summary').click();
            const category = page.locator('[data-rpg-category="utilities"]');
            if (await category.isVisible()) await category.click();
            const button = page.locator('#repairPulse');
            await expect(button).toBeVisible();
            await expect(button).toBeEnabled();
            await button.click();
            if ((await drawer.getAttribute('open')) !== null)
              await drawer.locator('summary').click();
          } else {
            await page.keyboard.press('KeyR');
          }
          const after = await page.evaluate(() => window.fixture.game.snapshot().shield);
          repairEvents.push({ seconds: current.seconds, before, after });
        }

        if (action.bomb && !bombUsed) {
          if (mobile) await page.locator('#bombTouch').tap();
          else await page.keyboard.press('KeyX');
          bombUsed = true;
          bombEvents.push({ seconds: current.seconds, remaining: current.bombs - 1 });
        }

        if (action.transform === 'robot' && !robotUsed) {
          if (mobile) await page.locator('#robotTouch').tap();
          else await page.keyboard.press('KeyT');
          robotUsed = true;
          transformEvents.push({ seconds: current.seconds, mode: 'robot' });
        } else if (action.transform === 'ship' && robotUsed) {
          if (mobile) await page.locator('#robotTouch').tap();
          else await page.keyboard.press('KeyT');
          robotUsed = false;
          transformEvents.push({ seconds: current.seconds, mode: 'ship' });
        }

        if (action.special && !specialUsed.has(action.special)) {
          if (mobile) {
            const drawer = page.locator('#strategyDrawer');
            if ((await drawer.getAttribute('open')) === null)
              await drawer.locator('summary').click();
            const category = page.locator('[data-rpg-category="specials"]');
            if (await category.isVisible()) await category.click();
            const id = action.special === 'plasma' ? '#plasmaTitan' : '#fiveCatsOverdrive';
            const button = page.locator(id);
            if (await button.isEnabled()) {
              await button.click();
              specialUsed.add(action.special);
              specialEvents.push({ seconds: current.seconds, special: action.special });
            }
            if ((await drawer.getAttribute('open')) !== null)
              await drawer.locator('summary').click();
          } else {
            await page.keyboard.press(action.special === 'plasma' ? 'KeyY' : 'KeyO');
            specialUsed.add(action.special);
            specialEvents.push({ seconds: current.seconds, special: action.special });
          }
        }

        if (action.multiLock && !lockUsed) {
          if (mobile) {
            const lock = await center('#lockTouch');
            await touch.send('Input.dispatchTouchEvent', {
              type: 'touchStart',
              touchPoints: [{ x: lock.x, y: lock.y, id: 4 }],
            });
            await page.evaluate(() => window.fixture.advance(0.3, { renderAfter: false }));
            await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          } else {
            await page.keyboard.down('KeyN');
            await page.evaluate(() => window.fixture.advance(0.3, { renderAfter: false }));
            await page.keyboard.up('KeyN');
          }
          lockUsed = true;
          multiLockEvents.push({ seconds: current.seconds, heldSeconds: 0.3 });
        }

        const keys = [...dodgeKeys(action)];
        if (action.fire) keys.push('Space');
        if (action.boost) keys.push('ShiftLeft');
        if (touch) {
          const points = [];
          if (action.fire) {
            const fire = await center('#fireTouch');
            points.push({ x: fire.x, y: fire.y, id: 2 });
          }
          if (action.boost) {
            const boost = await center('#boostTouch');
            points.push({ x: boost.x, y: boost.y, id: 3 });
          }
          if (action.x || action.y) {
            const stick = await center('#stick');
            points.push({ x: stick.x, y: stick.y, id: 1 });
            const offset = dodgeTouchOffset(action, stick.radius);
            await touch.send('Input.dispatchTouchEvent', {
              type: 'touchStart',
              touchPoints: points,
            });
            touching = true;
            await touch.send('Input.dispatchTouchEvent', {
              type: 'touchMove',
              touchPoints: points.map((point) =>
                point.id === 1 ? { ...point, x: point.x + offset.x, y: point.y + offset.y } : point,
              ),
            });
          } else if (points.length) {
            await touch.send('Input.dispatchTouchEvent', {
              type: 'touchStart',
              touchPoints: points,
            });
            touching = true;
          }
        } else {
          for (const key of [...pressed]) {
            if (!keys.includes(key)) {
              await page.keyboard.up(key);
              pressed.delete(key);
            }
          }
          for (const key of keys) {
            if (!pressed.has(key)) {
              await page.keyboard.down(key);
              pressed.add(key);
            }
          }
        }
        await page.evaluate(() => window.fixture.advance(0.15, { renderAfter: false }));
        previous = { ...current, pilotTarget: action.target };
      }
    } finally {
      for (const key of pressed) await page.keyboard.up(key);
      if (touching)
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      if (touch) await touch.detach();
    }

    const encounterStart = await snapshot();
    let combat = null;
    if (encounterStart.boss && encounterStart.state === 'playing') {
      combat = await runEncounter(page, info, 0, true, true, true, true, true, true, true);
      if (combat.terminal?.state === 'collapsing') {
        await page.evaluate(() => window.fixture.advance(25));
      }
    }
    const final = await snapshot();
    await page.evaluate(() => window.fixture.advance(0));
    await page.screenshot({ path: info.outputPath('campaign-final.png') });
    const report = {
      project: info.project.name,
      outcome:
        final.state === 'shop'
          ? 'STAGE_CLEARED'
          : combat
            ? 'BOSS_REACHED'
            : final.state === 'respawning'
              ? 'LIFE_LOST'
              : 'APPROACH_INCOMPLETE',
      initial: {
        credits: initial.credits,
        weapon: initial.weapon,
        pods: initial.pods,
        bombs: initial.bombs,
        shield: initial.shield,
      },
      final: {
        state: final.state,
        seconds: final.seconds,
        shield: final.shield,
        lives: final.lives,
        credits: final.credits,
        weapon: final.weapon,
        bombs: final.bombs,
        bossHp: final.bossHp,
        cityImpactCount: final.cityImpactCount,
      },
      phases: [...phases],
      launchSkipped,
      stages,
      collisionEvents,
      damageEvents,
      combat: combat
        ? {
            outcome: combat.terminal?.state,
            bossHp: combat.terminal?.bossHp,
            metrics: combat.metrics,
            utilityEvents: combat.utilityEvents,
            specialEvents: combat.specialEvents,
            equipmentEvents: combat.equipmentEvents,
          }
        : null,
      bombEvents,
      transformEvents,
      specialEvents,
      repairEvents,
      multiLockEvents,
      errors,
      releaseAuthorized: false,
    };
    const path = info.outputPath('campaign-first-stage.json');
    await writeFile(path, JSON.stringify(report, null, 2) + '\n');
    await info.attach('campaign-first-stage', { path, contentType: 'application/json' });
    console.log('CAMPAIGN_FIRST_STAGE ' + JSON.stringify(report));
    expect(errors).toEqual([]);
    expect(combat?.errors ?? []).toEqual([]);
    expect(report.outcome).toBe('STAGE_CLEARED');
    expect(report.releaseAuthorized).toBe(false);
  });
}
