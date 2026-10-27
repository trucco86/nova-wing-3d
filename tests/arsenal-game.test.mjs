import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { readSave } from '../src/campaign.js';
import { reachSectorBoss } from './mission-scenarios.mjs';
import { defeatBoss } from './combat-helper.mjs';

function setup(t, { nativeLifecycle = false, ...saved } = {}) {
  let data = JSON.stringify({
    version: 1,
    sector: 1,
    credits: 5000,
    weapon: 0,
    armor: 0,
    pods: 0,
    ...saved,
  });
  const storage = {
    getItem: () => data,
    setItem: (_key, value) => {
      data = value;
    },
  };
  const h = harness({ storage, nativeLifecycle });
  t.after(() => h.close());
  h.game.start(true);
  return { ...h, storage };
}

test('saved bombs restore exactly and repeated resume does not grant free supplies', (t) => {
  const h = setup(t, { bombs: 4, volley: 2, rapid: 1 });
  assert.equal(h.game.snapshot().bombs, 4);
  h.game.start(true);
  assert.equal(h.game.snapshot().bombs, 4);
  assert.equal(h.game.snapshot().volley, 2);
  assert.equal(h.game.snapshot().rapid, 1);
  h.game.pause();
  assert.equal(h.game.buy('volley'), false);
  h.game.start();
  assert.equal(h.game.snapshot().bombs, 3);
  assert.equal(h.game.snapshot().volley, 0);
  assert.equal(h.game.snapshot().rapid, 0);
});

test('multishot and rapid upgrades affect actual shots, with native fire preserved', (t) => {
  const base = setup(t);
  const upgraded = setup(t, { volley: 2, rapid: 2 });
  const native = setup(t, { volley: 2, rapid: 2, nativeLifecycle: true });
  for (const h of [base, upgraded, native]) h.game.fire();
  assert.equal(base.game.snapshot().entities.shots, 2);
  assert.equal(upgraded.game.snapshot().entities.shots, 4);
  assert.equal(native.game.snapshot().entities.shots, 2);
  assert.equal(native.elements.get('nextSector').textContent, 'SALTAR PARA O PRÓXIMO SETOR ↗');
  base.advance(0.11);
  upgraded.advance(0.11);
  base.game.fire();
  upgraded.game.fire();
  assert.equal(base.game.snapshot().entities.shots, 2);
  assert.equal(upgraded.game.snapshot().entities.shots, 8);
});

test('hangar validates funds, upgrade caps and complete bomb packs; map freezes combat and persists launch supplies', (t) => {
  const h = setup(t, { bombs: 2 });
  reachSectorBoss(h, { bossAge: 0.15, dt: 0.1 });
  defeatBoss(h);
  assert.equal(h.game.snapshot().state, 'shop');
  for (const item of ['volley', 'rapid']) {
    assert.equal(h.game.buy(item), true);
    assert.equal(h.game.buy(item), true);
    const credits = h.game.snapshot().credits;
    assert.equal(h.game.buy(item), false);
    assert.equal(h.game.snapshot().credits, credits);
  }
  assert.equal(h.game.buy('bombPack'), true);
  assert.equal(h.game.snapshot().bombs, 5);
  assert.equal(h.game.buy('bombPack'), true);
  assert.equal(h.game.snapshot().bombs, 8);
  const credits = h.game.snapshot().credits;
  assert.equal(h.game.buy('bombPack'), false);
  assert.equal(h.game.buy('bomb'), false);
  assert.equal(h.game.snapshot().credits, credits);
  h.elements.get('nextSector').onclick();
  assert.equal(h.game.snapshot().state, 'map');
  const time = h.game.snapshot().seconds;
  h.advance(5);
  assert.equal(h.game.snapshot().seconds, time);
  assert.equal(h.game.buy('repair'), false);
  h.elements.get('mapBack').onclick();
  assert.equal(h.game.snapshot().state, 'shop');
  h.elements.get('nextSector').onclick();
  h.elements.get('mapLaunch').onclick();
  assert.equal(h.game.snapshot().sector, 3);
  assert.equal(h.game.snapshot().bombs, 8);
  assert.equal(h.elements.get('campaignMap').hidden, true);
  const checkpoint = readSave(h.storage);
  assert.equal(checkpoint.volley, 2);
  assert.equal(checkpoint.rapid, 2);
  assert.equal(checkpoint.bombs, 8);
  h.game.start(true);
  assert.equal(h.game.snapshot().bombs, 8);
  h.game.pause();
  h.elements.get('pauseRestart').onclick();
  h.elements.get('pauseConfirmOk').onclick();
  assert.equal(h.game.snapshot().volley, 2);
  assert.equal(h.game.snapshot().rapid, 2);
  assert.equal(h.game.snapshot().bombs, 8);
});

test('insufficient credits reject purchases without altering upgrades or inventory', (t) => {
  const h = setup(t, { credits: 0 });
  reachSectorBoss(h, { bossAge: 0.15, dt: 0.1 });
  defeatBoss(h);
  // Spend the earned sector reward before testing an unaffordable tier.
  while (h.game.buy('volley')) {
    /* buy until cap or insufficient funds */
  }
  const before = h.game.snapshot();
  assert.equal(h.game.buy('rapid'), false);
  assert.equal(h.game.snapshot().credits, before.credits);
  assert.equal(h.game.snapshot().rapid, before.rapid);
});
