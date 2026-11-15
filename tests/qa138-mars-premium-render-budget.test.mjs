import test from 'node:test';
import assert from 'node:assert/strict';
import { MARS_GLOBE_FRAGMENT_SHADER } from '../src/mars-globe-shader.js';
import { createMarsApproach, updateMarsApproach, marsDescentAt } from '../src/mars-descent.js';
import { createMarsPremium, updateMarsArrival, updateMarsPremium } from '../src/mars-premium.js';
import { createMarsSandstorm, updateMarsSandstorm } from '../src/mars-sandstorm.js';

test('Mars improvements preserve the orbital draw and noise budget', () => {
  const root = createMarsApproach();
  const planet = root.getObjectByName('mars-orbit-visible-planet');
  assert.equal(planet.material.fragmentShader, MARS_GLOBE_FRAGMENT_SHADER);
  assert.match(MARS_GLOBE_FRAGMENT_SHADER, /basalt/);
  assert.match(MARS_GLOBE_FRAGMENT_SHADER, /sunward/);
  assert.match(MARS_GLOBE_FRAGMENT_SHADER, /terminator/);
  assert.equal((MARS_GLOBE_FRAGMENT_SHADER.match(/noise3\(N \*/g) ?? []).length, 2);
  assert.doesNotMatch(MARS_GLOBE_FRAGMENT_SHADER, /sampler2D|texture2D/);
  assert.equal(planet.geometry.parameters.widthSegments, 64);
  assert.equal(planet.geometry.parameters.heightSegments, 48);
  assert.equal(planet.children.length, 1);
  const haze = root.getObjectByName('mars-atmospheric-sand-haze');
  assert.equal(haze.children.filter((c) => c.isMesh).length, 4);
});

test('approach and sandstorm animate from cached references, with clone fallback', () => {
  const approach = createMarsApproach();
  const globe = approach.getObjectByName('mars-orbit-visible-planet');
  approach.getObjectByName = () => { throw new Error('Unexpected hot-path traversal'); };
  updateMarsApproach(approach, marsDescentAt(18));
  assert.equal(globe.visible, true);
  assert.doesNotThrow(() => updateMarsApproach(createMarsApproach().clone(true), marsDescentAt(20)));
  const storm = createMarsSandstorm();
  const particles = storm.getObjectByName('mars-sandstorm-particle-field');
  const banks = storm.children.filter((x) => x.name.startsWith('mars-rolling-sand-haze-bank'));
  storm.getObjectByName = () => { throw new Error('Unexpected hot-path traversal'); };
  updateMarsSandstorm(storm, 70);
  assert.equal(storm.visible, true);
  updateMarsSandstorm(storm, 92);
  assert.equal(storm.visible, false);
  assert.equal(particles.material.opacity, 0);
  assert.ok(banks.every((b) => b.material.uniforms.alpha.value === 0));
  const position = particles.position.x;
  for (let i = 0; i < 20; i++) updateMarsSandstorm(storm, 93 + i);
  assert.equal(particles.position.x, position);
  assert.doesNotThrow(() => updateMarsSandstorm(createMarsSandstorm().clone(true), 71));
});

test('scrolling desert no longer allocates moving lists or re-searches the world', () => {
  const root = createMarsPremium();
  const rock = root.getObjectByName('mars-rock-field-0');
  const terrain = root.getObjectByName('mars-premium-desert-floor');
  assert.equal(terrain.geometry.parameters.widthSegments, 65);
  assert.equal(terrain.geometry.parameters.heightSegments, 140);
  assert.doesNotThrow(() => root.clone(true));
  assert.equal(root.getObjectByName('mars-sandstorm-particle-field').geometry.attributes.position.count, 240);
  root.getObjectByName = () => { throw new Error('Unexpected hot-path traversal'); };
  for (let i = 0; i < 150; i++) {
    updateMarsPremium(root, i * 0.63);
    updateMarsArrival(root, i % 95);
  }
  updateMarsPremium(root, 55);
  const z = rock.position.z;
  updateMarsPremium(root, 55);
  assert.equal(rock.position.z, z);
  const same = updateMarsArrival(root, 70);
  assert.ok(same.storm.active);
  assert.equal(terrain.geometry.attributes.position.count, terrain.geometry.attributes.color.count);
});
