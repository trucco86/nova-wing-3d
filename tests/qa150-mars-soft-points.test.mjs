import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarsSandstorm, updateMarsSandstorm } from '../src/mars-sandstorm.js';

// QA151 regression: QA150 injected a shader hook, but the rendered screenshot
// remained practically unchanged. Assert real GPU point-map input, not just
// the presence of code that the renderer may not apply.
test('QA151: Martian sand uses a shared GPU alpha map, not hard square points', () => {
  const storm = createMarsSandstorm();
  const particles = storm.getObjectByName('mars-sandstorm-particle-field');
  const mat = particles.material;
  assert.equal(mat.isPointsMaterial, true);
  assert.equal(particles.geometry.attributes.position.count, 240);
  assert.equal(storm.children.length, 4, 'one Points plus three haze planes');
  assert.equal(mat.depthWrite, false);
  assert.equal(mat.transparent, true);
  assert.equal(mat.size, 4.1, 'keep dots legible without excessive square occlusion');
  assert.ok(mat.map?.isDataTexture, 'a real point map is required for WebGL alpha');
  assert.equal(mat.alphaMap, null, 'do not allocate a second texture');
  assert.equal(mat.map.image.width, 32);
  assert.equal(mat.map.image.height, 32);
  assert.equal(mat.map.image.data.length, 32 * 32 * 4);
  const data = mat.map.image.data;
  const alpha = (x, y) => data[(y * 32 + x) * 4 + 3];
  assert.equal(alpha(0, 0), 0, 'corners of square sprite must be transparent');
  assert.equal(alpha(31, 31), 0);
  assert.ok(alpha(16, 16) > 220, 'center of dot must remain visible');
  assert.ok(alpha(5, 16) < alpha(13, 16), 'soft gradient prevents hard dot edges');
  assert.equal(mat.map.generateMipmaps, false);
});

test('QA151: particles share one alpha map, freeze with pause and clear after storm', () => {
  const a = createMarsSandstorm();
  const b = createMarsSandstorm();
  const dotsA = a.getObjectByName('mars-sandstorm-particle-field');
  const dotsB = b.getObjectByName('mars-sandstorm-particle-field');
  assert.notEqual(dotsA.material, dotsB.material);
  assert.equal(dotsA.material.map, dotsB.material.map, 'one texture for all storms');
  const first = updateMarsSandstorm(a, 70);
  const snapshot = [dotsA.position.x, dotsA.position.z, dotsA.material.opacity];
  assert.equal(first.active, true);
  assert.deepEqual(updateMarsSandstorm(a, 70), first);
  assert.deepEqual([dotsA.position.x, dotsA.position.z, dotsA.material.opacity], snapshot);
  assert.ok(dotsA.material.opacity > 0);
  updateMarsSandstorm(a, 89);
  assert.equal(a.visible, false);
  assert.equal(dotsA.material.opacity, 0);
  assert.equal(b.visible, false);
  assert.equal(a.children.length, b.children.length);
});
