import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarsSandstorm, updateMarsSandstorm } from '../src/mars-sandstorm.js';

test('QA150: Martian sand has feathered point sprites rather than opaque squares', () => {
  const storm = createMarsSandstorm();
  const particle = storm.getObjectByName('mars-sandstorm-particle-field');
  const mat = particle.material;
  assert.equal(mat.isPointsMaterial, true);
  assert.equal(particle.geometry.attributes.position.count, 240);
  assert.equal(storm.children.length, 4, 'one Points and three existing haze layers');
  assert.equal(mat.map, null, 'no texture allocation');
  assert.equal(mat.alphaMap, null, 'no alpha texture allocation');
  assert.equal(mat.depthWrite, false);
  const source = '#include <map_particle_fragment>';
  const shader = { fragmentShader: `void main() { vec4 diffuseColor = vec4(1.0); ${source} }` };
  mat.onBeforeCompile(shader);
  assert.ok(shader.fragmentShader.includes('gl_PointCoord.xy'));
  assert.ok(shader.fragmentShader.includes('smoothstep(0.10, 0.50, dustRadius)'));
  assert.ok(shader.fragmentShader.includes('diffuseColor.a *= dustFeather'));
  assert.ok(!shader.fragmentShader.includes('sampler2D'), 'shader must not use a texture');
  assert.equal(mat.customProgramCacheKey(), 'mars-sand-soft-point-v1');
});

test('QA150: soft sand survives clones and pause, clears with storm and does not alter wind', () => {
  const first = createMarsSandstorm();
  const second = createMarsSandstorm();
  const a = first.getObjectByName('mars-sandstorm-particle-field');
  const b = second.getObjectByName('mars-sandstorm-particle-field');
  assert.notEqual(a.material, b.material);
  assert.equal(typeof a.material.onBeforeCompile, 'function');
  assert.equal(typeof b.material.onBeforeCompile, 'function');
  const hazard = updateMarsSandstorm(first, 70);
  const before = [a.position.x, a.position.z, a.material.opacity];
  assert.equal(hazard.active, true);
  assert.deepEqual(updateMarsSandstorm(first, 70), hazard);
  assert.deepEqual([a.position.x, a.position.z, a.material.opacity], before);
  assert.ok(a.material.opacity > 0);
  updateMarsSandstorm(first, 89);
  assert.equal(first.visible, false);
  assert.equal(a.material.opacity, 0);
  assert.equal(second.visible, false);
  assert.equal(second.children.length, first.children.length);
});
