import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createShipModule, createWorld, updatePremiumShipEffects } from '../src/visuals.js';

test('all ship classes retain premium physical surfacing in a high-only group', () => {
  for (const chassis of ['nova7', 'aegis', 'specter']) {
    const ship = createShipModule(chassis);
    const details = ship.getObjectByName('ship-premium-details');
    assert.ok(details);
    assert.equal(details.visible, false, 'medium profile must avoid extra draw calls');
    for (const name of [
      'ship-premium-wing-armor',
      'ship-premium-engine-cowl',
      'ship-premium-engine-ring',
      'ship-premium-boost-plume',
    ])
      assert.ok(details.getObjectByName(name), chassis + ': ' + name);
    assert.equal(
      details.getObjectByName('ship-premium-wing-armor').material.type,
      'MeshPhysicalMaterial',
    );
    assert.equal(ship.userData.premiumPlumes.length, 2);
    details.visible = true;
    updatePremiumShipEffects(ship, true, 3);
    assert.ok(ship.userData.premiumPlumes.every((p) => p.material.opacity >= 0.89));
    assert.ok(ship.userData.premiumPlumes.every((p) => p.position.z === 5));
    updatePremiumShipEffects(ship, false, 4);
    assert.ok(ship.userData.premiumPlumes.every((p) => p.position.z === 4));
  }
});

test('premium city landmarks and bridges are gated by visual quality, not collision', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const close = scene.getObjectByName('launch-city');
  const details = close.getObjectByName('city-high-details');
  for (const name of ['skyline', 'landmark']) {
    assert.ok(
      details.children.some((node) => node.name.toLowerCase().includes(name)),
      name,
    );
  }
  world.setGraphicsQuality('high');
  assert.equal(details.visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(details.visible, false);
});
