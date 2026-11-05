import { test, expect } from '@playwright/test';

// All assertions run against the actual compiled game DOM/CSS. The only
// synthetic portion is forcing simultaneous notices to prove the presentation
// never stacks them. Damage, radar and boss AI are not mocked or changed.
const VIEWS = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
];

test('boss HUD and radio stay compact in actual Europa encounter on both phone orientations', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Use touch browser for phone framing');
  test.setTimeout(110000);
  for (const size of VIEWS) {
    await page.setViewportSize(size);
    await page.goto('/__dynamic.html?sector=5&qaBoss=5');
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#bossHUD')).toBeVisible();
    const snapshot = await page.evaluate(() => {
      window.fixture.advance(5.5);
      const boss = document.getElementById('bossState');
      const attack = document.getElementById('attackWarning');
      const radio = document.getElementById('message');
      const box = document.getElementById('hudNotices').getBoundingClientRect();
      const state = window.fixture.game.snapshot();
      return {
        boss: { text: boss.textContent, full: boss.getAttribute('aria-label') },
        attack: attack.textContent,
        radio: { text: radio.textContent, full: radio.getAttribute('aria-label') },
        notice: { height: box.height, width: box.width },
        arena: state.europaArena,
      };
    });
    expect(snapshot.arena.active).toBe(true);
    expect(snapshot.boss.text.length).toBeLessThanOrEqual(36);
    expect(snapshot.boss.full.length).toBeGreaterThanOrEqual(snapshot.boss.text.length);
    expect(snapshot.radio.text.length).toBeLessThanOrEqual(58);
    expect(snapshot.notice.height).toBeLessThanOrEqual(54);
    if (snapshot.attack) expect(snapshot.attack.length).toBeLessThanOrEqual(39);
    await page.screenshot({
      path: info.outputPath(
        'hud-single-priority-europa-' + size.width + 'x' + size.height + '.png',
      ),
    });
  }
});

test('priority rail shows only urgent event, then the next most important message', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/__dynamic.html?sector=5&qaBoss=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const result = await page.evaluate(() => {
    window.fixture.advance(4.5);
    const nodes = Object.fromEntries(
      [
        'criticalWarning',
        'launchBoostNotice',
        'attackWarning',
        'shieldWarning',
        'bossIncoming',
        'pickupFlash',
        'comms',
        'hitFeedback',
      ].map((id) => [id, document.getElementById(id)]),
    );
    const active = () =>
      Object.entries(nodes)
        .filter(([, node]) => getComputedStyle(node).display !== 'none' && !node.hidden)
        .map(([id]) => id);
    nodes.criticalWarning.hidden = false;
    nodes.launchBoostNotice.hidden = false;
    nodes.shieldWarning.hidden = false;
    nodes.bossIncoming.hidden = false;
    nodes.pickupFlash.hidden = false;
    nodes.hitFeedback.hidden = false;
    nodes.comms.classList.add('active');
    nodes.attackWarning.textContent = '⚠ VARREDURA · DESVIE';
    nodes.attackWarning.dataset.severity = 'danger';

    const critical = active();
    nodes.criticalWarning.hidden = true;
    const launch = active();
    nodes.launchBoostNotice.hidden = true;
    const attack = active();
    nodes.attackWarning.textContent = '';
    const shield = active();
    nodes.shieldWarning.hidden = true;
    const incoming = active();
    nodes.bossIncoming.hidden = true;
    const lowPriority = active();
    return { critical, launch, attack, shield, incoming, lowPriority };
  });
  expect(result.critical).toEqual(['criticalWarning']);
  expect(result.launch).toEqual(['launchBoostNotice']);
  expect(result.attack).toEqual(['attackWarning']);
  expect(result.shield).toEqual(['shieldWarning']);
  expect(result.incoming).toEqual(['bossIncoming']);
  expect(result.lowPriority).toEqual(['comms']);
});

test('survival text stays localized and full briefing remains available to assistive technology', async ({
  page,
}) => {
  await page.goto('/__dynamic.html?sector=5&qaBoss=5');
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true');
  const result = await page.evaluate(() => {
    const message = document.getElementById('message');
    return {
      short: message.textContent,
      full: message.getAttribute('aria-label'),
      title: message.title,
      shield: document.getElementById('shieldWarning').textContent,
      critical: document.getElementById('criticalWarning').textContent,
    };
  });
  expect(result.full).toBeTruthy();
  expect(result.short.length).toBeLessThanOrEqual(58);
  expect(result.full).toBe(result.title);
  expect(result.shield.length).toBeLessThan(23);
  expect(result.critical.length).toBeLessThan(23);
});
