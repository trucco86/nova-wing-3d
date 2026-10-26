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
import { campaignMapSteps } from '../src/campaign-map.js';

test('campaign route shows ten real levels with completed/current/future progress', () => {
  const map = campaignMapSteps(SECTORS, 4);
  assert.equal(map.length, 10);
  assert.deepEqual(map.map((m) => m.status), [
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
  ]);
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
