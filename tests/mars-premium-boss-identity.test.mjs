import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createMarsPremium, updateMarsPremium } from '../src/mars-premium.js';
import { SECTORS } from '../src/campaign.js';
import { createWorld } from '../src/visuals.js';
import { BOSS_SHAPES, createBossVisualIdentity } from '../src/boss-visual-identity.js';
import { createBossModel, disposeBoss } from '../src/bosses.js';
import { stageVisualAt } from '../src/stage-variety.js';

test('Mars sector two has a red desert, two individual moons and Curiosity-style rover', () => {
  assert.equal(SECTORS[1].theme, 'mars');
  assert.match(SECTORS[1].name, /MARTE/);
  assert.equal(stageVisualAt(1).location, 'mars-dune-sea');
  const worldRoot = createMarsPremium();
  assert.equal(worldRoot.name, 'mars-premium-desert');
  assert.ok(worldRoot.getObjectByName('mars-premium-desert-floor'));
  assert.ok(worldRoot.getObjectByName('mars-moon-phobos'));
  assert.ok(worldRoot.getObjectByName('mars-moon-deimos'));
  const rover = worldRoot.getObjectByName('mars-curiosity-rover');
  assert.ok(rover && rover.getObjectByName('curiosity-mastcam-stereo-head'));
  assert.equal(rover.children.filter((o) => o.name.startsWith('curiosity-wheel')).length, 6);
  assert.equal(worldRoot.children.filter((o) => o.name.startsWith('mars-rock-field')).length, 10);
  for (const part of worldRoot.children) assert.notEqual(part.userData.hitbox, true);
});

test('Martian rocks move with gameplay and freeze when time is unchanged', () => {
  const root = createMarsPremium();
  const rock = root.getObjectByName('mars-rock-field-0');
  const original = rock.position.z;
  updateMarsPremium(root, 0);
  assert.equal(rock.position.z, original, 'no teleport on mission start');
  updateMarsPremium(root, 75);
  assert.equal(rock.position.z, original + 75);
  const traveled = rock.position.z;
  updateMarsPremium(root, 75);
  assert.equal(rock.position.z, traveled, 'pause does not advance the scene');
  updateMarsPremium(root, 0);
  assert.equal(rock.position.z, original);
});

test('Mars and asteroid interior never inherit urban meshes or each other', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.42, true);
  world.setSector(SECTORS[1]);
  assert.equal(scene.getObjectByName('launch-city').visible, false);
  assert.equal(scene.getObjectByName('city-distant-horizon').visible, false);
  const mars = scene.getObjectByName('mars-premium-desert');
  assert.ok(mars);
  assert.equal(scene.getObjectByName('launch-sky-dome').material.uniforms.marsGlow.value, 1);
  world.update(0.2, 0.2, 60, true);
  const rock = mars.getObjectByName('mars-rock-field-0');
  assert.ok(rock.position.z > -100);
  world.setSector(SECTORS[2]);
  assert.equal(scene.getObjectByName('mars-premium-desert'), undefined);
  assert.equal(scene.getObjectByName('launch-sky-dome').material.uniforms.marsGlow.value, 0);
  world.setAsteroidInterior(true);
  world.setSector(SECTORS[0]);
  assert.equal(scene.getObjectByName('launch-sky-dome').material.uniforms.cityGlow.value, 1);
});

test('all ten bosses have authored silhouettes and the Mars boss is a six-legged quarry colossus', () => {
  assert.equal(BOSS_SHAPES.length, 10);
  assert.equal(new Set(BOSS_SHAPES).size, 10);
  for (let i = 0; i < 10; i++) {
    const model = createBossModel(SECTORS[i], i, true);
    const identity = model.getObjectByName('boss-distinct-' + BOSS_SHAPES[i]);
    assert.ok(identity && identity.children.length >= 4, 'unique visual boss ' + i);
    assert.equal(model.userData.parts.length, 2, 'weapon hit volumes unchanged');
    assert.ok(model.getObjectByName('boss-battery-left-muzzle'));
    assert.ok(model.getObjectByName('boss-battery-right-muzzle'));
    disposeBoss(model);
  }
  const dune = createBossVisualIdentity(1, {
    armor: new T.MeshStandardMaterial(),
    dark: new T.MeshStandardMaterial(),
    edge: new T.MeshBasicMaterial(),
    hot: new T.MeshBasicMaterial(),
  });
  assert.equal(
    dune.children.filter((o) => o.name.startsWith('mars-dune-walker-upper-leg')).length,
    6,
  );
  assert.ok(dune.getObjectByName('mars-armored-crust'));
});
