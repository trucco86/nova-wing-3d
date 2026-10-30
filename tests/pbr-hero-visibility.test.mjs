import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { PBR_MAP_SIZE, createPbrSurfaceMaps } from '../src/pbr-materials.js';
import { createHeroFighter } from '../src/hero-ships.js';
import { setHeroFighterVisuals } from '../src/hero-visibility.js';
import { fighter, createShipModule, createFlyingRobot } from '../src/visuals.js';
import { createShowroomShip } from '../src/showroom-models.js';

test('P0 PBR finishes are finite, repeatable, non-flat and shared to bound GPU memory', () => {
  assert.equal(PBR_MAP_SIZE, 128);
  const seen = new Set();
  for (const finish of ['armor', 'ceramic', 'titanium']) {
    const maps = createPbrSurfaceMaps(finish);
    assert.equal(createPbrSurfaceMaps(finish), maps);
    for (const tex of [maps.normalMap, maps.roughnessMap]) {
      assert.equal(tex.image.width, PBR_MAP_SIZE);
      assert.equal(tex.image.height, PBR_MAP_SIZE);
      assert.equal(tex.image.data.length, PBR_MAP_SIZE ** 2 * 4);
      assert.equal(tex.wrapS, T.RepeatWrapping);
      assert.equal(tex.wrapT, T.RepeatWrapping);
      assert.ok(tex.image.data.every(Number.isFinite));
      seen.add(tex);
    }
    const normal = maps.normalMap.image.data;
    const rough = maps.roughnessMap.image.data;
    assert.ok(new Set(Array.from({ length: 512 }, (_, i) => normal[i * 4])).size > 4);
    assert.ok(new Set(Array.from({ length: 512 }, (_, i) => rough[i * 4 + 1])).size > 4);
  }
  assert.equal(seen.size, 6);
  assert.throws(() => createPbrSurfaceMaps('unknown'), TypeError);
  assert.throws(() => createPbrSurfaceMaps('armor', 999), RangeError);
});

test('High replaces old fighter fuselage; Medium restores original visible ship', () => {
  const high = createShowroomShip('nova7', 'blue', 'high');
  const medium = createShowroomShip('nova7', 'blue', 'medium');
  assert.equal(high.getObjectByName('hero-fighter-hull').visible, true);
  assert.equal(high.getObjectByName('ship-fuselage').visible, false);
  assert.equal(medium.getObjectByName('hero-fighter-hull').visible, false);
  assert.equal(medium.getObjectByName('ship-fuselage').visible, true);
  assert.ok(high.userData.flames.every((f) => f.visible), 'thruster effects survive High mode');
  assert.equal(high.getObjectByName('premium-ship-details').visible, true);
  assert.equal(medium.getObjectByName('premium-ship-details').visible, false);
});

test('switching ship / robot display keeps the mecha independent and original hitboxes', () => {
  const player = fighter();
  const baseParts = [...player.children];
  const module = createShipModule('aegis');
  player.add(module);
  const robot = createFlyingRobot();
  robot.visible = false;
  player.add(robot);
  const originalGeometry = player.getObjectByName('ship-fuselage').geometry;
  assert.equal(setHeroFighterVisuals(baseParts, module, 'high'), true);
  assert.equal(module.visible, true);
  assert.equal(robot.visible, false);
  assert.equal(setHeroFighterVisuals(baseParts, module, 'high', false), true);
  assert.equal(module.visible, false);
  assert.equal(player.getObjectByName('ship-fuselage').visible, false);
  robot.visible = true;
  assert.equal(setHeroFighterVisuals(baseParts, module, 'medium', true), true);
  assert.equal(robot.visible, true, 'mecha pivot and its visibility untouched');
  assert.equal(module.visible, true);
  assert.equal(player.getObjectByName('ship-fuselage').visible, true);
  assert.equal(player.getObjectByName('ship-fuselage').geometry, originalGeometry);
});

test('real hero armor uses non-flat PBR maps and original custom paint', () => {
  for (const model of ['nova7', 'specter', 'aegis']) {
    const hero = createHeroFighter(model);
    const shell = hero.getObjectByName('hero-sculpted-fuselage');
    assert.ok(shell.material.isMeshPhysicalMaterial);
    assert.ok(shell.material.normalMap?.isDataTexture);
    assert.ok(shell.material.roughnessMap?.isDataTexture);
    assert.ok(shell.material.userData.paintModule);
    assert.ok(shell.geometry.attributes.uv);
  }
});
