import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';
import { createCityPremiumInfrastructure, createMaglevTrain } from '../src/city-premium.js';
import { SECTORS } from '../src/campaign.js';

test('City 2.5 keeps premium physical road panels, futuristic guideway and illuminated ads in Medium', () => {
  const infrastructure = createCityPremiumInfrastructure();
  assert.equal(infrastructure.name, 'city-premium-infrastructure');
  const expectations = [
    ['city-premium-road-plates', 760],
    ['city-premium-road-lights', 380],
    ['city-maglev-guideway-shell', 180],
    ['city-maglev-guideway-lights', 180],
    ['city-maglev-supports', 90],
  ];
  for (const [name, count] of expectations) {
    const mesh = infrastructure.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.equal(mesh.count, count, name + ' instance budget');
  }
  const road = infrastructure.getObjectByName('city-premium-road-plates');
  const matrix = new T.Matrix4();
  const position = new T.Vector3();
  const q = new T.Quaternion();
  const scale = new T.Vector3();
  road.getMatrixAt(0, matrix);
  matrix.decompose(position, q, scale);
  assert.ok(position.y > -7 && position.y < -6.7);
  assert.ok(scale.z > 19 && scale.z < 20, 'visible plate seams every 20 units');

  const track = infrastructure.getObjectByName('city-maglev-guideway-shell');
  track.getMatrixAt(0, matrix);
  matrix.decompose(position, q, scale);
  assert.equal(Math.abs(position.x), 80, 'guideway aligns with maglev train path');
  assert.ok(position.y > 28 && position.y < 34);
  assert.ok(infrastructure.getObjectByName('city-maglev-supports').count > 60);
  const premium = infrastructure.getObjectByName('city-premium-high-details');
  assert.equal(premium.visible, false);
  assert.ok(premium.getObjectByName('city-premium-road-detail').count > 100);
  const signs = infrastructure.getObjectByName('city-commercial-billboards');
  assert.equal(signs.children.length, 6);
  const brands = signs.children.map((sign) => sign.name);
  assert.ok(brands.includes('city-billboard-aerorail'));
  assert.ok(brands.includes('city-billboard-nova-wing'));
  assert.ok(signs.children.every((sign) => Math.abs(sign.position.x) >= 100));
  for (const sign of signs.children) {
    const panel = sign.getObjectByName('advertising-panel');
    assert.ok(panel?.material.map?.isTexture, 'billboard texture exists without external assets');
    assert.equal(panel.material.side, T.DoubleSide);
  }
});

test('City 2.5 maglev is an articulated multi-car train with headlights rather than an empty rail', () => {
  const east = createMaglevTrain(1);
  const west = createMaglevTrain(-1);
  assert.equal(east.name, 'city-maglev-east');
  assert.equal(east.userData.highOnly, false);
  assert.equal(west.userData.highOnly, true);
  assert.ok(east.children.length > 55, 'train has three full carriages with windows');
  assert.equal(east.userData.visualOnly, true);
  assert.equal(east.position.x, 80);
  assert.ok(east.position.z > -350, 'train is close enough for an opening cinematic pass');
  const bounds = new T.Box3().setFromObject(east);
  assert.ok(bounds.max.z - bounds.min.z > 85, 'long train silhouette is visible');
  assert.ok(bounds.max.x - bounds.min.x >= 12);
  assert.ok(east.children.every((child) => !child.userData.hitbox));
});

test('City 2.5 renders in both modes, animates first visible pass, and leaves no ads on ocean or orbit', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const infrastructure = city.getObjectByName('city-premium-infrastructure');
  const high = city.getObjectByName('city-premium-high-details');
  assert.ok(infrastructure);
  assert.ok(far.getObjectByName('city-premium-infrastructure'));
  world.setGraphicsQuality('medium');
  assert.equal(infrastructure.visible, true);
  assert.equal(high.visible, false);
  const train = city.getObjectByName('city-maglev-east');
  assert.ok(train.visible, 'guaranteed opening pass must be visible in Medium');
  assert.ok(train.position.z > -350);
  world.update(1, 1, 48, true);
  assert.ok(train.position.z > -350 && train.position.z < 0);
  assert.equal(city.getObjectByName('city-maglev-west').visible, false);
  world.setGraphicsQuality('high');
  assert.equal(high.visible, true);
  assert.equal(far.getObjectByName('city-premium-high-details').visible, true);
  assert.equal(city.getObjectByName('city-maglev-west').visible, true);
  world.setSector(SECTORS[0]);
  assert.equal(infrastructure.visible, true);
  world.setLaunchAscent(0.85, true);
  assert.equal(city.visible, false, 'ads and premium rail leave view with city on orbital ascent');
  world.setSector(SECTORS[1]);
  assert.equal(infrastructure.visible, false, 'ads and plates do not appear over ocean');
  world.reset();
  assert.equal(city.position.z, 0);
});
