import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCityCommerce, createCityHorizonMegastructure } from '../src/city-commerce.js';
import { createLaunchCelestials } from '../src/launch-celestials.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('City 2.7 has varied real shops, plazas and three mall buildings outside the flight lane', () => {
  const retail = createCityCommerce();
  assert.equal(retail.name, 'city-commerce-streets');
  assert.equal(retail.userData.shops, 16);
  assert.deepEqual(retail.userData.malls, ['ORBITAL PLAZA', 'NOVA MARKET', 'SKYLINE MALL']);
  const tags = retail.children.filter((c) => c.name.startsWith('city-shopping-center-'));
  assert.equal(tags.length, 3);
  assert.ok(tags.every((c) => Math.abs(c.position.x) >= 140 && c.userData.visualOnly));
  const signs = retail.children.filter((c) => c.name === 'city-mall-advertising-sign');
  assert.equal(signs.length, 3);
  assert.ok(signs.every((c) => c.material.map?.isTexture));
  const glazing = retail.getObjectByName('city-commerce-base-glazing');
  const lights = retail.getObjectByName('city-commerce-base-retail');
  assert.ok(glazing?.isInstancedMesh && glazing.count >= 15);
  assert.ok(lights?.isInstancedMesh && lights.count >= 15);
  const hi = retail.getObjectByName('city-commerce-high-detail');
  assert.equal(hi.visible, false);
  assert.ok(hi.getObjectByName('city-commerce-high-window')?.count > 20);
  retail.traverse((o) => {
    assert.notEqual(o.userData.hitbox, true, 'retail is cosmetic and never changes collisions');
    if (o.isInstancedMesh) {
      const matrix = new T.Matrix4();
      const position = new T.Vector3();
      const rotation = new T.Quaternion();
      const scale = new T.Vector3();
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, matrix);
        matrix.decompose(position, rotation, scale);
        assert.ok(Math.abs(position.x) > 90, 'retail remains outside maglev and flight corridor');
        assert.ok(Number.isFinite(position.z));
      }
    }
  });
});

test('City 2.7 citadel is a prominent distant visual anchor above the flying lane', () => {
  const citadel = createCityHorizonMegastructure();
  assert.equal(citadel.name, 'city-horizon-megastructure');
  assert.ok(citadel.getObjectByName('citadel-orbital-ring')?.isMesh);
  assert.ok(citadel.getObjectByName('citadel-central-spire').position.y > 300);
  const pylon = citadel.getObjectByName('citadel-flight-side-pylon');
  assert.ok(pylon.position.y - pylon.scale.y / 2 > 20);
  assert.ok(citadel.getObjectByName('city-megastructure-high-detail'));
  citadel.traverse((o) => assert.notEqual(o.userData.hitbox, true));
});

test('City 2.7 Earth has procedural clouds, a separate Moon and a distant Sun with halo', () => {
  const scene = new T.Scene();
  const sky = createLaunchCelestials(scene);
  for (const name of [
    'launch-earth-horizon', 'launch-earth-clouds', 'launch-earth-atmospheric-limb',
    'launch-orbit-moon', 'launch-orbit-sun', 'launch-sun-halo-0', 'launch-sun-halo-1',
  ]) assert.ok(scene.getObjectByName(name), name);
  sky.setGraphicsQuality('medium');
  sky.update(0.5);
  assert.equal(sky.earth.visible, true);
  assert.equal(sky.sun.visible, true);
  assert.equal(sky.moon.visible, false, 'lunar reveal is later than sunlight');
  assert.equal(sky.clouds.visible, false, 'cloud-shell draw cost is High-only');
  const partial = sky.earth.material.uniforms.fade.value;
  sky.setGraphicsQuality('high');
  sky.update(0.75);
  assert.equal(sky.clouds.visible, true);
  assert.equal(sky.limb.visible, true);
  assert.equal(sky.moon.visible, true);
  assert.ok(sky.earth.material.uniforms.fade.value > partial);
  assert.ok(sky.sun.getObjectByName('launch-sun-halo-0').material.opacity > 0);
  sky.reset();
  assert.equal(sky.earth.visible, false);
  assert.equal(sky.sun.visible, false);
  assert.equal(sky.moon.visible, false);
});

test('City 2.7 transition is continuous, leaves architecture below the player and preserves other sectors', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[0]);
  world.setGraphicsQuality('medium');
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const horizon = scene.getObjectByName('city-distant-horizon');
  const earth = scene.getObjectByName('launch-earth-horizon');
  const moon = scene.getObjectByName('launch-orbit-moon');
  const sun = scene.getObjectByName('launch-orbit-sun');
  assert.ok(city.getObjectByName('city-commerce-streets'));
  assert.ok(far.getObjectByName('city-commerce-streets'));
  assert.ok(horizon.getObjectByName('city-horizon-megastructure'));
  world.setGraphicsQuality('high');
  assert.equal(city.getObjectByName('city-commerce-high-detail').visible, true);
  assert.equal(horizon.getObjectByName('city-megastructure-high-detail').visible, true);
  world.setLaunchAscent(0.44, true);
  const early = earth.material.uniforms.fade.value;
  assert.equal(city.visible, true, 'city is still present when Earth first appears');
  assert.ok(early > 0 && early < 0.3, 'Earth gently fades in, never pops');
  assert.ok(sun.visible);
  world.setLaunchAscent(0.70, true);
  const middle = earth.material.uniforms.fade.value;
  assert.ok(middle > early, 'Earth reveal increases monotonically');
  assert.ok(city.position.y < -300, 'city physically drops away during ascent');
  assert.equal(city.visible, true, 'no abrupt early city-to-globe swap');
  assert.equal(moon.visible, true);
  world.setLaunchAscent(0.85, true);
  assert.equal(city.visible, false, 'city already below the view when hidden');
  assert.equal(horizon.visible, false);
  assert.equal(earth.visible, true);
  world.setLaunchAscent(1, true);
  assert.ok(earth.material.uniforms.fade.value > 0.90);
  world.setSector(SECTORS[1]);
  assert.equal(earth.visible, false, 'Earth launch objects do not leak into ocean sector');
  assert.equal(moon.visible, false);
  assert.equal(sun.visible, false);
  assert.equal(city.getObjectByName('city-commerce-streets').visible, false);
  world.setSector(SECTORS[0]);
  world.reset();
  assert.equal(earth.visible, false, 'restart returns to city view');
  assert.equal(city.position.y, 0);
});
