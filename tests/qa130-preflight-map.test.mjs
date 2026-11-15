import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { writeSave, readSave } from '../src/campaign.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}

test('new campaign opens galaxy map before first flight and launches sector 01 without skipping', (t) => {
  const h = harness({ preflightMap: true, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  let current = h.game.snapshot();
  assert.equal(current.state, 'map');
  assert.equal(current.sector, 1);
  assert.equal(h.elements.get('campaignMap').hidden, false);
  assert.equal(h.elements.get('shop').hidden, true);
  assert.equal(h.elements.get('mapProgress').textContent, '0 / 10 SETORES CONCLUÍDOS');
  assert.match(h.elements.get('mapSectorTitle').textContent, /01.*CIDADE DAS MÁQUINAS/);
  assert.equal(h.elements.get('mapBack').textContent, 'VOLTAR AO MENU');
  assert.equal(h.elements.get('mapLaunch').textContent, 'INICIAR MISSÃO ↗');
  assert.equal(
    h.elements.get('hud').inert,
    true,
    'gameplay inputs must remain inert during briefing',
  );
  h.advance(2);
  assert.equal(h.game.snapshot().seconds, 0, 'time and enemy spawns must not progress in map mode');

  h.elements.get('mapLaunch').onclick();
  current = h.game.snapshot();
  assert.equal(current.state, 'playing');
  assert.equal(current.sector, 1);
  assert.equal(h.elements.get('campaignMap').hidden, true);
  assert.equal(h.elements.get('hud').inert, false);
  assert.equal(h.elements.get('stage').textContent, 'CIDADE DAS MÁQUINAS');
  assert.ok(current.stageTitleVisible);
});

test('preflight back returns to menu; a fresh launch still opens the first mission map', (t) => {
  const h = harness({ preflightMap: true });
  t.after(() => h.close());
  h.game.start();
  h.elements.get('mapBack').onclick();
  assert.equal(h.game.snapshot().state, 'menu');
  assert.equal(h.elements.get('menu').hidden, false);
  assert.equal(h.elements.get('campaignMap').hidden, true);
  assert.equal(h.elements.get('hud').inert, false);
  h.game.start();
  assert.equal(h.game.snapshot().state, 'map');
  assert.equal(h.elements.get('mapProgress').textContent, '0 / 10 SETORES CONCLUÍDOS');
});

test('continue checkpoint starts with current sector briefing and does not increase sector index', (t) => {
  const storage = memoryStorage();
  assert.equal(
    writeSave(storage, { sector: 2, credits: 490, weapon: 1, armor: 0, pods: 1, score: 30 }),
    true,
  );
  const h = harness({ preflightMap: true, storage });
  t.after(() => h.close());
  h.game.start(true);
  assert.equal(h.game.snapshot().state, 'map');
  assert.equal(h.game.snapshot().sector, 3);
  assert.equal(h.elements.get('mapProgress').textContent, '2 / 10 SETORES CONCLUÍDOS');
  assert.match(h.elements.get('mapSectorTitle').textContent, /CINTURÃO DE DESTROÇOS/);
  const sectorCards = h.elements.get('campaignRoute').children.slice(1);
  assert.equal(sectorCards.length, 10);
  sectorCards[9].emit('click'); // Future sector can be inspected but cannot be launched.
  assert.match(h.elements.get('mapSectorTitle').textContent, /MARVIN/);
  h.elements.get('mapLaunch').onclick();
  const current = h.game.snapshot();
  assert.equal(current.state, 'playing');
  assert.equal(current.sector, 3);
  assert.equal(current.credits, 490);
  assert.equal(readSave(storage).sector, 2, 'preflight never advances or overwrites a checkpoint');
});

test('continue checkpoint can return to menu without modifying saved progression', (t) => {
  const storage = memoryStorage();
  writeSave(storage, { sector: 1, credits: 750, weapon: 0, armor: 0, pods: 0 });
  const h = harness({ preflightMap: true, storage });
  t.after(() => h.close());
  h.game.start(true);
  assert.equal(h.elements.get('mapProgress').textContent, '1 / 10 SETORES CONCLUÍDOS');
  h.elements.get('mapBack').onclick();
  assert.equal(h.game.snapshot().state, 'menu');
  assert.equal(readSave(storage).sector, 1);
  assert.equal(h.elements.get('continue').hidden, false);
});

test('headless harness preserves direct-flight behavior unless preflight is explicitly enabled', (t) => {
  const h = harness({ enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.elements.get('campaignMap').hidden, true);
});
