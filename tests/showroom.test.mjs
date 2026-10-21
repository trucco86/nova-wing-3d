import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fighter } from '../src/visuals.js';
import { PILOT_PROFILES, SHIP_MODELS } from '../src/pilots.js';
import {
  createShowroomPilot,
  createShowroomShip,
  disposeShowroomModel,
} from '../src/showroom-models.js';

test('showroom pilots preserve relative size, fur and head differences in finite geometry', () => {
  const cats = new Map(PILOT_PROFILES.map((p) => [p.id, createShowroomPilot(p.id)]));
  for (const cat of cats.values()) {
    cat.traverse((o) => {
      for (const v of o.geometry?.attributes.position?.array ?? []) assert.ok(Number.isFinite(v));
    });
    const box = new T.Box3().setFromObject(cat);
    assert.ok(box.max.y - box.min.y > 3);
  }
  assert.equal(cats.get('bia').scale.y, cats.get('jenifer').scale.y);
  assert.equal(cats.get('bob').scale.y, cats.get('christopher').scale.y);
  assert.ok(
    cats.get('christopher').getObjectByName('head').scale.y >
      cats.get('bob').getObjectByName('head').scale.y,
  );
  assert.ok(cats.get('calvin').scale.y < cats.get('bia').scale.y);
  assert.notEqual(
    cats.get('jenifer').getObjectByName('fur').material.color.getHex(),
    cats.get('bia').getObjectByName('fur').material.color.getHex(),
  );
  cats.forEach(disposeShowroomModel);
});

test('preview ship color and resource disposal cannot change the live fighter', () => {
  const live = fighter();
  let disposed = 0;
  live.traverse((o) => {
    o.geometry?.addEventListener('dispose', () => disposed++);
    o.material?.addEventListener('dispose', () => disposed++);
  });
  const original = live.children[0].material.color.getHex();
  for (const p of SHIP_MODELS) {
    const ship = createShowroomShip(p.id, 'gold');
    assert.ok(ship.getObjectByName('ship-model-' + p.id));
    assert.notEqual(ship.children[0].geometry, live.children[0].geometry);
    assert.equal(ship.children[0].material.color.getHexString(), 'e7bd63');
    ship.traverse((o) => {
      for (const v of o.geometry?.attributes.position?.array ?? []) assert.ok(Number.isFinite(v));
    });
    disposeShowroomModel(ship);
  }
  assert.equal(disposed, 0);
  assert.equal(live.children[0].material.color.getHex(), original);
});
