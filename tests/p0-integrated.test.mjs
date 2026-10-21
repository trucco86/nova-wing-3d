import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { readSave, writeSave } from '../src/campaign.js';

test('pet care pickups update score, HUD and a compatible checkpoint', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.game.collect('pet:can');
  h.game.collect('pet:toy');
  const snap = h.game.snapshot();
  assert.equal(snap.petCare.can, 1);
  assert.equal(snap.petCare.toy, 1);
  assert.equal(snap.hits, 35);
  h.advance(0.05);
  assert.match(h.elements.get('petCareHud').textContent, /LATINHA 1/);
  const items = [];
  const storage = {
    setItem(_, json) {
      items.push(json);
    },
    getItem() {
      return items.at(-1) ?? null;
    },
  };
  const expected = { sector: 1, credits: 25, weapon: 0, armor: 0, pods: 0, petCare: snap.petCare };
  assert.equal(writeSave(storage, expected), true);
  assert.deepEqual(readSave(storage).petCare, snap.petCare);
});

test('shield warning becomes visible on severe damage and clears on new mission', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.advance(3.1);
  h.game.damage(80);
  assert.equal(h.game.snapshot().shield, 20);
  assert.equal(h.elements.get('criticalWarning').hidden, false);
  h.game.start();
  assert.equal(h.elements.get('criticalWarning').hidden, true);
});
