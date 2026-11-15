import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { installMobileRpgAccordion } from '../src/mobile-rpg.js';

function fixture() {
  const listeners = new Map();
  const drawer = {
    open: false,
    contains(node) {
      return node?.insideDrawer === true;
    },
  };
  const document = {
    getElementById(id) {
      return id === 'strategyDrawer' ? drawer : null;
    },
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    removeEventListener(type, fn) {
      if (listeners.get(type) === fn) listeners.delete(type);
    },
  };
  const button = (id, disabled = false, insideDrawer = true) => ({
    id,
    disabled,
    insideDrawer,
    closest(selector) {
      return selector === 'button' ? this : null;
    },
  });
  const dispatch = (type, target, extra = {}) => listeners.get(type)?.({ target, ...extra });
  return { drawer, document, button, dispatch, listeners };
}

test('RPG starts folded and casting one ability folds the drawer', () => {
  const f = fixture();
  f.drawer.open = true;
  const instance = installMobileRpgAccordion({ document: f.document });
  assert.equal(f.drawer.open, false, 'the disclosure must not start expanded');
  f.drawer.open = true;
  f.dispatch('click', f.button('specialCast'));
  assert.equal(f.drawer.open, false, 'gameplay must reappear after cast');
  instance.destroy();
  assert.equal(f.listeners.size, 0);
});

test('changing weapon or special keeps the accordion open for multiple choices', () => {
  const f = fixture();
  installMobileRpgAccordion({ document: f.document });
  f.drawer.open = true;
  f.dispatch('click', f.button('arsenalSwitch'));
  f.dispatch('click', f.button('specialSwitch'));
  assert.equal(f.drawer.open, true);
  f.dispatch('click', f.button('plasmaTitan', true));
  assert.equal(f.drawer.open, true, 'disabled powers do not dismiss selection');
  f.dispatch('click', f.button('fiveCatsOverdrive'));
  assert.equal(f.drawer.open, false);
});

test('touching flight controls, outside region or Escape never blocks gameplay input', () => {
  const f = fixture();
  installMobileRpgAccordion({ document: f.document });
  f.drawer.open = true;
  let prevented = false;
  f.dispatch(
    'pointerdown',
    { insideDrawer: false },
    {
      preventDefault() {
        prevented = true;
      },
    },
  );
  assert.equal(f.drawer.open, false);
  assert.equal(prevented, false, 'pointer capture is owned by the game');
  f.drawer.open = true;
  f.dispatch('pointerdown', { insideDrawer: true });
  assert.equal(f.drawer.open, true);
  f.dispatch('keydown', null, { key: 'Escape' });
  assert.equal(f.drawer.open, false);
  f.drawer.open = true;
  f.dispatch('click', f.button('pause', false, false));
  assert.equal(f.drawer.open, false);
});

test('mobile RPG markup and styles put every command behind one disclosure', () => {
  const html = readFileSync(new URL('../src/shell.html', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  const begin = html.indexOf('<details id="strategyDrawer">');
  const end = html.indexOf('</details>', begin);
  assert.ok(begin >= 0 && end > begin);
  const panel = html.slice(begin, end);
  assert.match(panel, /id="quickRpg"/);
  assert.match(panel, /id="qaBerserkDock"/);
  for (const id of [
    'arsenalSwitch',
    'specialSwitch',
    'specialCast',
    'scanBoss',
    'precisionShot',
    'repairPulse',
    'homingBarrage',
    'plasmaTitan',
    'fiveCatsOverdrive',
    'qaBerserkAction',
  ])
    assert.ok(panel.includes('id="' + id + '"'), id + ' must fold with RPG');
  const qa137 = css.slice(css.indexOf('/* QA137: one compact, opt-in RPG drawer'));
  assert.match(qa137, /#strategyDrawer\[open\] > \.rpgDrawerBody/);
  assert.match(qa137, /background: rgb\(5 23 35 \/ 79%\)/);
  assert.match(qa137, /max-height: min\(41dvh, 300px\)/);
  assert.match(qa137, /#hudNotices/);
  assert.match(qa137, /#bossHUD:not\(\[hidden\]\)/);
});
