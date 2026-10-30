import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCinematicFlagship, animateCinematicFlagship } from '../src/cinematic-flagship.js';
import { createCinematicReflectionStudio, installCinematicIbl } from '../src/cinematic-lighting.js';
import { createCinematicExhaust, animateCinematicExhaust } from '../src/cinematic-exhaust.js';
import { createWorld, createShipModule, createFlyingRobot, fighter } from '../src/visuals.js';
import { setHeroFighterVisuals } from '../src/hero-visibility.js';

function meshGeometrySafe(object) {
  let vertices = 0,
    meshes = 0;
  object.traverse((part) => {
    if (!part.isMesh) return;
    meshes++;
    const positions = part.geometry?.getAttribute('position');
    assert.ok(positions?.count > 0, part.name);
    assert.ok(Array.from(positions.array).every(Number.isFinite), part.name);
    vertices += positions.count;
    for (const index of part.geometry.index?.array ?? [])
      assert.ok(index >= 0 && index < positions.count, part.name);
  });
  return { vertices, meshes };
}

test('cinematic flagship replaces simple hull with a recognisable, wide hero silhouette', () => {
  const hero = createCinematicFlagship();
  assert.equal(hero.name, 'cinematic-flagship-hull');
  assert.equal(hero.visible, false);
  assert.equal(hero.userData.visualOnly, true);
  const { vertices, meshes } = meshGeometrySafe(hero);
  assert.ok(vertices >= 600 && meshes <= 20, 'authored mesh with bounded draw calls');
  const bounds = new T.Box3().setFromObject(hero);
  assert.ok(bounds.min.x < -90 && bounds.max.x > 90);
  assert.ok(bounds.min.z < -60 && bounds.max.z >= 48);
  assert.ok(hero.getObjectByName('flagship-armored-command-cockpit'));
  assert.ok(hero.getObjectByName('flagship-hero-launch-bay'));
  assert.equal(hero.children.filter((c) => c.isInstancedMesh).length, 3);
  assert.equal(hero.userData.drawCallBudget, 17);
  const emitters = hero.children.filter((c) => c.userData.emitter);
  assert.equal(emitters.length, 2);
  animateCinematicFlagship(hero, 13.4);
  assert.equal(emitters[0].scale.x, 1, 'hidden flagship does not animate unnecessary meshes');
  hero.visible = true;
  animateCinematicFlagship(hero, 13.4);
  assert.ok(Number.isFinite(emitters[0].scale.x));
  assert.notEqual(emitters[0].scale.x, 1);
});

test('world High switches mother ship and lights, Medium restores original boss launch frame', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.45, true);
  const flag = scene.getObjectByName('distant-orbital-flagship');
  const sculpted = flag?.getObjectByName('cinematic-flagship-hull');
  const legacy = flag?.getObjectByName('flagship-dorsal-armor');
  const bay = flag?.getObjectByName('flagship-boss-launch-hangar');
  assert.ok(sculpted && legacy && bay);
  world.setGraphicsQuality('high');
  assert.equal(sculpted.visible, true);
  assert.equal(legacy.visible, false);
  assert.equal(bay.visible, true, 'boss emerges through the preserved launch bay');
  world.setGraphicsQuality('medium');
  assert.equal(sculpted.visible, false);
  assert.equal(legacy.visible, true);
  assert.equal(bay.visible, true);
  world.reset();
});

test('reflection studio is source-only, with four cards and a renderer-free fallback', () => {
  const studio = createCinematicReflectionStudio();
  assert.equal(
    studio.children.filter((c) => c.name.startsWith('cinematic-reflection-softbox')).length,
    4,
  );
  meshGeometrySafe(studio);
  const target = new T.Scene();
  const ibl = installCinematicIbl({}, target);
  assert.equal(ibl.status, 'unsupported-renderer');
  ibl.setQuality('high');
  assert.equal(target.environment, null);
  ibl.dispose();
});

test('High fighter and mecha boost effects follow power without changing the attack rig', () => {
  const ship = createShipModule('aegis');
  const rig = ship.getObjectByName('cinematic-fighter-exhaust');
  const mecha = createFlyingRobot();
  const robotRig = mecha.getObjectByName('cinematic-mecha-exhaust');
  assert.ok(rig && robotRig);
  assert.equal(rig.children.length, 6);
  assert.equal(robotRig.children.length, 6);
  const nozzles = mecha.userData.mechRig.armMuzzles.slice();
  assert.equal(animateCinematicExhaust(ship, 1, false, 'medium'), false);
  assert.equal(rig.visible, false);
  const previousCount = rig.children.length;
  assert.equal(animateCinematicExhaust(ship, 1, false, 'high'), true);
  const lengthAtIdle = rig.userData.units[0].flame.scale.y;
  assert.equal(animateCinematicExhaust(ship, 1, true, 'high'), true);
  assert.ok(rig.userData.units[0].flame.scale.y > lengthAtIdle * 2);
  assert.equal(animateCinematicExhaust(mecha, 1, true, 'high'), true);
  assert.ok(robotRig.visible);
  assert.equal(rig.children.length, previousCount, 'no allocation per frame');
  assert.deepEqual(mecha.userData.mechRig.armMuzzles, nozzles);
  const pilot = fighter();
  const base = [...pilot.children];
  pilot.add(ship);
  setHeroFighterVisuals(base, ship, 'medium');
  assert.equal(rig.visible, false);
  setHeroFighterVisuals(base, ship, 'high');
  assert.equal(rig.visible, true);
  setHeroFighterVisuals(base, ship, 'high', false);
  assert.equal(ship.visible, false);
  assert.equal(rig.visible, false);
  assert.ok(createCinematicExhaust('fighter').userData.visualOnly);
  assert.throws(() => createCinematicExhaust('invalid'), TypeError);
});
