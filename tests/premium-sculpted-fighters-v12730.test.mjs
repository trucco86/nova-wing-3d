import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createSculptedStarfighter } from '../src/premium-starship-sculpt.js';
import { createShipModule, updatePremiumShipEffects } from '../src/visuals.js';

test('high detail fighter builds a continuous, sealed 3D hull and swept dimensional wings', () => {
  for (const model of ['nova7', 'aegis', 'specter']) {
    const paint = new T.MeshPhysicalMaterial({ color: '#c4d5e3' });
    const { group, rotors, materials } = createSculptedStarfighter(model, paint);
    assert.equal(group.name, 'ship-sculpted-high-detail');
    const hull = group.getObjectByName('ship-sculpted-continuous-hull');
    assert.ok(hull);
    assert.equal(hull.material, paint);
    assert.equal(hull.geometry.type, 'BufferGeometry');
    assert.ok(hull.geometry.getAttribute('position').count >= 160);
    assert.ok(hull.geometry.index.count >= 750);
    assert.ok(group.getObjectByName('ship-sculpted-cockpit-glass'));
    assert.ok(group.getObjectByName('ship-sculpted-canopy-frame'));
    assert.equal(group.children.filter((o) => o.name === 'ship-sculpted-swept-wing').length, 2);
    assert.equal(group.children.filter((o) => o.name === 'ship-sculpted-engine-nacelle').length, 2);
    assert.equal(group.children.filter((o) => o.name === 'ship-sculpted-exhaust-ring').length, 6);
    assert.equal(rotors.length, 2);
    assert.equal(materials.length, 4);
    let vertices = 0;
    group.traverse((obj) => {
      const p = obj.geometry?.attributes?.position;
      if (!p) return;
      vertices += p.count;
      assert.ok(p.array.every(Number.isFinite), 'non-finite geometry vertex');
      for (const index of obj.geometry.index?.array ?? [])
        assert.ok(index >= 0 && index < p.count, 'index out of bounds');
    });
    assert.ok(vertices > 400, 'sculpted design must add 3D geometry, not simple boxes');
  }
});

test('premium fighter geometry stays isolated to High profile and follows the selected paint', () => {
  for (const chassis of ['nova7', 'aegis', 'specter']) {
    const ship = createShipModule(chassis);
    const premium = ship.getObjectByName('ship-premium-details');
    const sculpt = ship.getObjectByName('ship-sculpted-high-detail');
    assert.ok(sculpt);
    assert.ok(premium.getObjectByName('ship-sculpted-continuous-hull'));
    assert.equal(premium.visible, false, 'Medium renders neither sculpted geometry nor premium details');
    const paintMesh = sculpt.getObjectByName('ship-sculpted-continuous-hull');
    assert.equal(paintMesh.material.userData.paintModule, true, 'paint selects the hero plating');
    assert.equal(ship.userData.sculptedRotors.length, 2);
    assert.ok(ship.userData.premiumMaterials.length >= 8, 'own effect materials are disposable');
    premium.visible = true;
    updatePremiumShipEffects(ship, true, 3);
    assert.equal(ship.userData.sculptedRotors[0].rotation.z, 48);
    updatePremiumShipEffects(ship, false, 4);
    assert.equal(ship.userData.sculptedRotors[0].rotation.z, 24);
  }
});
