import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createHeroFighter, createHeroMechaArmor } from '../src/hero-ships.js';
import { createFlyingRobot, createShipModule } from '../src/visuals.js';
import { createShowroomShip } from '../src/showroom-models.js';

function auditGeometry(root) {
  const box = new T.Box3().setFromObject(root);
  assert.ok([box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite));
  let vertices = 0;
  root.traverse((part) => {
    if (!part.isMesh) return;
    const position = part.geometry.getAttribute('position');
    assert.ok(position && position.count > 0, part.name);
    vertices += position.count;
    assert.ok(Array.from(position.array).every(Number.isFinite), part.name);
    for (const index of part.geometry.index?.array ?? [])
      assert.ok(index >= 0 && index < position.count, part.name);
  });
  assert.ok(vertices > 500, 'Sculpted hull must contain real 3D geometry');
  return box;
}

test('all three fighter hulls feature sculpted mass, beveled wings and facet canopy', () => {
  for (const model of ['nova7', 'specter', 'aegis']) {
    const hero = createHeroFighter(model);
    assert.equal(hero.name, 'hero-fighter-hull');
    assert.equal(hero.userData.visualOnly, true);
    assert.equal(hero.visible, false);
    const bounds = auditGeometry(hero);
    assert.ok(bounds.min.z < -4.8, 'recognizable forward nose');
    assert.ok(bounds.max.z > 2, 'armored exhaust reaches aft');
    assert.ok(bounds.max.x - bounds.min.x > 8, 'full wide swept wing silhouette');
    assert.ok(hero.getObjectByName('hero-sculpted-fuselage')?.isMesh);
    assert.ok(hero.getObjectByName('hero-multifaceted-canopy')?.isMesh);
    assert.ok(hero.getObjectByName('hero-swept-wing--1')?.isMesh);
    assert.ok(hero.getObjectByName('hero-swept-wing-1')?.isMesh);
    assert.ok(hero.children.filter((c) => c.name.startsWith('hero-wing-running-light')).length === 2);
    const module = createShipModule(model);
    assert.equal(module.getObjectByName('hero-fighter-hull')?.visible, false);
    assert.equal(module.getObjectByName('premium-ship-details')?.visible, false);
  }
});

test('High uses the new cockpit and Medium does not render the heavy hero', () => {
  const medium = createShowroomShip('specter', 'blue', 'medium');
  const high = createShowroomShip('specter', 'blue', 'high');
  assert.equal(medium.getObjectByName('hero-fighter-hull').visible, false);
  assert.equal(high.getObjectByName('hero-fighter-hull').visible, true);
  assert.equal(medium.getObjectByName('premium-ship-details').visible, false);
  assert.equal(high.getObjectByName('premium-ship-details').visible, true);
});

test('articulated mecha rig survives visual armor attachment without changing weapon origins', () => {
  const robot = createFlyingRobot();
  const hero = robot.getObjectByName('hero-mecha-armor');
  assert.ok(hero);
  assert.equal(hero.visible, false);
  assert.equal(hero.userData.visualOnly, true);
  auditGeometry(hero);
  assert.ok(robot.userData.mechRig?.armMuzzles?.length === 2);
  assert.ok(robot.userData.mecha?.arms?.right?.muzzle);
  assert.ok(robot.userData.mecha?.arms?.left?.muzzle);
});

test('hero models use physically based paint that can be customized without touching collision', () => {
  const hero = createHeroFighter();
  const colored = [];
  hero.traverse((part) => {
    if (part.material?.userData.paintModule) {
      assert.ok(part.material.isMeshPhysicalMaterial);
      assert.ok(part.material.metalness >= 0.65);
      assert.ok(part.material.clearcoat >= 0.5);
      colored.push(part);
    }
  });
  assert.ok(colored.length > 2);
  const origin = colored[0].geometry.getAttribute('position').array[0];
  colored[0].material.color.set('#8822cc');
  assert.equal(colored[0].geometry.getAttribute('position').array[0], origin);
});
