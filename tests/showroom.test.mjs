import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { fighter } from '../src/visuals.js';
import { PILOT_PROFILES, SHIP_MODELS } from '../src/pilots.js';
import {
  createShowroomPilot,
  PILOT_ART_DIRECTION,
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
  // Bob should resemble Christopher, but be slightly slimmer rather than identical.
  assert.ok(cats.get('bob').scale.y < cats.get('christopher').scale.y);
  assert.ok(cats.get('bob').scale.y > cats.get('christopher').scale.y * 0.93);
  assert.ok(
    cats.get('christopher').getObjectByName('head').scale.y >
      cats.get('bob').getObjectByName('head').scale.y,
  );
  assert.ok(cats.get('calvin').scale.y < cats.get('bia').scale.y);
  assert.equal(
    cats.get('christopher').getObjectByName('fur').material.color.getHexString(),
    '2b2930',
  );
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

test('approved cat art identities are expressed by distinct 3D face, visor and suit materials', () => {
  const expected = {
    bia: '#e4ad4a',
    bob: '#d9ac53',
    christopher: '#d9a74f',
    calvin: '#e8b457',
    jenifer: '#80bf94',
  };
  for (const [id, iris] of Object.entries(expected)) {
    const model = createShowroomPilot(id);
    assert.equal(model.userData.artIdentity, id);
    assert.equal(model.getObjectByName('iris').material.color.getHexString(), iris.slice(1));
    assert.equal(
      model.getObjectByName('pilot-art-harness').material.color.getHexString(),
      PILOT_ART_DIRECTION[id].harness.slice(1),
    );
    assert.equal(
      model.getObjectByName('pilot-art-chest-light').material.color.getHexString(),
      PILOT_ART_DIRECTION[id].light.slice(1),
    );
    assert.ok(model.getObjectByName('pilot-art-collar'));
    assert.ok(model.getObjectByName('pilot-art-shoulder-armor'));
    assert.ok(model.getObjectByName('ear').scale.y > 0.8);
    let parts = 0;
    model.traverse((part) => {
      if (part.isMesh) parts++;
    });
    assert.ok(parts < 100, 'cinematic pilot must remain lightweight for mobile');
    disposeShowroomModel(model);
  }
  assert.ok(PILOT_ART_DIRECTION.calvin.ear > PILOT_ART_DIRECTION.christopher.ear);
  assert.notEqual(PILOT_ART_DIRECTION.bob.iris, PILOT_ART_DIRECTION.jenifer.iris);
  assert.equal(PILOT_ART_DIRECTION.bia.suit, '#26313b');
});
