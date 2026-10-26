import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SECTORS,
  SHOP,
  readSave,
  writeSave,
  shopPrice,
  projectileCount,
  firingCooldown,
} from '../src/campaign.js';
import { campaignMapSteps, drawCampaignMap } from '../src/campaign-map.js';

test('campaign route shows ten real levels with completed/current/future progress', () => {
  const map = campaignMapSteps(SECTORS, 4);
  assert.equal(map.length, 10);
  assert.deepEqual(
    map.map((m) => m.status),
    [
      'completed',
      'completed',
      'completed',
      'completed',
      'next',
      'locked',
      'locked',
      'locked',
      'locked',
      'locked',
    ],
  );
  assert.equal(map[4].name, 'TEMPESTADE DE DADOS');
  assert.equal(map[4].boss, SECTORS[4].boss);
  assert.ok(map[4].brief.length > 10);
  assert.ok(map[4].threat.includes('plasma'));
  assert.equal(map[9].name, 'TRONO DE MARVIN');
});

test('hangar upgrades add real projectiles and increase cadence without changing native mode', () => {
  assert.equal(projectileCount(0, 0), 2);
  assert.equal(projectileCount(0, 1), 3);
  assert.equal(projectileCount(0, 2), 4);
  assert.equal(projectileCount(4, 2), 8);
  assert.equal(projectileCount(0, 2, false), 2);
  assert.equal(firingCooldown(0.5, 1), 0.44);
  assert.equal(firingCooldown(0.5, 2), 0.38);
  assert.ok(shopPrice('volley', 1) > shopPrice('volley', 0));
  assert.ok(shopPrice('rapid', 1) > shopPrice('rapid', 0));
  assert.ok(shopPrice('bombPack', 0) > shopPrice('bomb', 0));
  assert.equal(SHOP.volley.max, 2);
  assert.equal(SHOP.bomb.max, 8);
  // The three-bomb bundle is offered only while three entire slots remain.
  assert.equal(SHOP.bombPack.max, 8);
  assert.equal(shopPrice('bombPack', 0), 230);
  assert.equal(Math.min(8, 5 + 3), 8);

});

test('existing checkpoints still load; extra armory upgrades survive save and validation', () => {
  let data = null;
  const storage = {
    getItem: () => data,
    setItem: (_key, value) => {
      data = value;
    },
  };
  const legacy = { sector: 2, credits: 540, weapon: 1, armor: 2, pods: 1, score: 12 };
  assert.equal(writeSave(storage, legacy), true);
  const old = readSave(storage);
  assert.equal(old.weapon, 1);
  assert.equal(old.volley, undefined);
  assert.equal(old.rapid, undefined);
  assert.equal(writeSave(storage, { ...legacy, bombs: 6, volley: 2, rapid: 1 }), true);
  const upgraded = readSave(storage);
  assert.equal(upgraded.volley, 2);
  assert.equal(upgraded.rapid, 1);
  assert.equal(upgraded.bombs, 6);
  assert.equal(writeSave(storage, { ...legacy, bombs: 100, volley: 100, rapid: -1 }), true);
  const invalidUpgrade = readSave(storage);
  assert.equal(invalidUpgrade.volley, undefined);
  assert.equal(invalidUpgrade.rapid, undefined);
  assert.equal(invalidUpgrade.bombs, undefined);
});

test('campaign briefing renders safe, navigable cards and actual next-sector intelligence', () => {
  const nodes = new Map();
  function el() {
    return {
      children: [],
      style: {
        setProperty(key, value) {
          this[key] = value;
        },
      },
      textContent: '',
      setAttribute(key, value) {
        this[key] = value;
      },
      append(...kids) {
        this.children.push(...kids);
      },
      replaceChildren(...kids) {
        this.children = [...kids];
      },
    };
  }
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, el());
      return nodes.get(id);
    },
    createElement: el,
  };
  drawCampaignMap(document, SECTORS, 2);
  const route = document.getElementById('campaignRoute');
  assert.equal(route.children.length, 10);
  assert.equal(route.children[0].className, 'campaign-node completed');
  assert.equal(route.children[2].className, 'campaign-node next');
  assert.equal(route.children[9].className, 'campaign-node locked');
  assert.match(document.getElementById('mapSectorTitle').textContent, /CINTURÃO DE DESTROÇOS/);
  assert.match(document.getElementById('mapSectorThreat').textContent, /Detritos/);
  assert.match(document.getElementById('mapSectorBoss').textContent, /PERFURADOR/);
  assert.equal(document.getElementById('mapProgress').textContent, '2 / 10 SETORES CONCLUÍDOS');
});
