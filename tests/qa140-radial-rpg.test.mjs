import assert from 'node:assert/strict';
import test from 'node:test';
import { harness } from './harness.mjs';
import { installMobileRpgAccordion } from '../src/mobile-rpg.js';

test('QA140 tactical RPG pause freezes combat, projectiles and phase timers', (t) => {
  const h = harness({
    coarsePointer: true,
    spawnEncounters: false,
    hostname: 'dev.nova-wing-preview.pages.dev',
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(1, 'boss'), true);
  h.advance(5, 0.1);
  const before = h.game.snapshot();
  assert.equal(before.state, 'playing');
  assert.equal(h.game.setRpgTacticalPaused(true), true);
  h.advance(7, 0.1);
  const frozen = h.game.snapshot();
  assert.equal(frozen.rpgTacticalPaused, true);
  assert.equal(frozen.seconds, before.seconds);
  assert.equal(frozen.bossHp, before.bossHp);
  assert.equal(frozen.bossAge, before.bossAge);
  assert.equal(frozen.shield, before.shield);
  assert.deepEqual(frozen.hostilePositions, before.hostilePositions);
  assert.equal(h.game.setRpgTacticalPaused(false), false);
  h.advance(0.3, 0.1);
  assert.ok(h.game.snapshot().seconds > before.seconds);
});

test('QA140 closing RPG never switches on the ordinary pause dialog', (t) => {
  const h = harness({ coarsePointer: true, spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  h.advance(0.1);
  assert.equal(h.game.setRpgTacticalPaused(true), true);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().pauseDialog, false);
  h.game.setRpgTacticalPaused(false);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().pauseDialog, false);
  h.game.pause();
  assert.equal(h.game.snapshot().state, 'paused');
  assert.equal(h.game.snapshot().pauseDialog, true);
});

test('QA140 changing RPG weapon and spell refreshes labels while the battle clock is frozen', (t) => {
  const storage = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        sector: 0,
        credits: 0,
        weapon: 0,
        armor: 0,
        pods: 0,
        strategy: { xp: 160, arsenal: 0, special: 0 },
      }),
    setItem() {},
  };
  const h = harness({ coarsePointer: true, storage, spawnEncounters: false });
  t.after(() => h.close());
  // Headless harness defaults to 1280px; test the real mobile label contract.
  h.window.innerWidth = 390;
  h.window.innerHeight = 844;
  h.game.start(true);
  h.advance(0.1);
  const before = h.game.snapshot();
  assert.equal(h.game.setRpgTacticalPaused(true), true);
  h.game.cycleArsenal();
  assert.equal(h.game.snapshot().strategy.arsenal, 1);
  assert.equal(h.elements.get('arsenalSwitch').textContent, 'ARMA GEADA');
  h.game.cycleSpecial();
  assert.equal(h.game.snapshot().strategy.special, 1);
  assert.equal(h.elements.get('specialSwitch').textContent, 'RPG NOVA');
  assert.equal(h.elements.get('specialCast').disabled, false);
  h.advance(1);
  assert.equal(h.game.snapshot().seconds, before.seconds);
  h.game.setRpgTacticalPaused(false);
});

function ui() {
  const listeners = new Map();
  const body = {
    classList: {
      contains(key) {
        return key === 'in-mission';
      },
    },
  };
  function node(id) {
    const handlers = new Map();
    return {
      id,
      hidden: false,
      open: false,
      disabled: false,
      dataset: {},
      textContent: '',
      handlers,
      addEventListener(type, fn) {
        handlers.set(type, fn);
      },
      removeEventListener(type, fn) {
        if (handlers.get(type) === fn) handlers.delete(type);
      },
      setAttribute(name, value) {
        this[name] = value;
      },
      focus() {},
      querySelector() {
        return node('dialog');
      },
      contains(el) {
        return el === this || !!el?.inside;
      },
    };
  }
  const elements = new Map(
    [
      'strategyDrawer',
      'rpgCategoryPanel',
      'rpgRadialMenu',
      'rpgCategoryTitle',
      'rpgCategoryBack',
    ].map((x) => [x, node(x)]),
  );
  const document = {
    body,
    getElementById(id) {
      return elements.get(id) ?? null;
    },
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
  };
  const events = [];
  const game = {
    setRpgTacticalPaused(enabled) {
      events.push(enabled);
      return !!enabled;
    },
  };
  return {
    elements,
    document,
    events,
    game,
    window: {
      matchMedia() {
        return { matches: true };
      },
    },
    toggle() {
      elements.get('strategyDrawer').handlers.get('toggle')?.();
    },
    click(button) {
      listeners.get('click')?.({ target: button });
    },
    button(id, extra = {}) {
      return {
        id,
        inside: true,
        disabled: false,
        dataset: {},
        closest: () => ({ id, inside: true, disabled: false, dataset: {}, ...extra }),
        ...extra,
      };
    },
  };
}

test('QA140 empty radial wheel tap dismisses tactical pause without casting', () => {
  const f = ui();
  const inst = installMobileRpgAccordion({
    document: f.document,
    window: f.window,
    game: f.game,
  });
  const drawer = f.elements.get('strategyDrawer');
  drawer.open = true;
  f.toggle();
  assert.equal(f.events.at(-1), true);
  assert.equal(f.elements.get('rpgRadialMenu').hidden, false);
  f.click(f.elements.get('rpgRadialMenu'));
  assert.equal(drawer.open, false);
  assert.equal(f.events.at(-1), false);
  assert.equal(f.elements.get('rpgCategoryPanel').hidden, true);
  inst.destroy();
});

test('QA140 touch categories keep the fight frozen until cast or close', () => {
  const f = ui();
  const inst = installMobileRpgAccordion({ document: f.document, window: f.window, game: f.game });
  const drawer = f.elements.get('strategyDrawer');
  const wheel = f.elements.get('rpgRadialMenu');
  const panel = f.elements.get('rpgCategoryPanel');
  assert.equal(drawer.open, false);
  drawer.open = true;
  f.toggle();
  assert.equal(f.events.at(-1), true);
  assert.equal(wheel.hidden, false);
  assert.equal(panel.hidden, true);
  f.click(f.button('category', { dataset: { rpgCategory: 'weapons' } }));
  assert.equal(panel.dataset.category, 'weapons');
  assert.equal(panel.hidden, false);
  assert.equal(wheel.hidden, true);
  f.click(f.button('rpgCategoryBack'));
  assert.equal(panel.hidden, true);
  f.click(f.button('category', { dataset: { rpgCategory: 'specials' } }));
  f.click(f.button('specialCast'));
  assert.equal(drawer.open, false);
  assert.equal(f.events.at(-1), false);
  inst.destroy();
});
