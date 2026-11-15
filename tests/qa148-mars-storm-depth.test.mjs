import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMarsSandstorm,
  marsSandstormAt,
  updateMarsSandstorm,
} from '../src/mars-sandstorm.js';

test('QA148: storm gains layered shear without extra meshes, textures or particles', () => {
  const storm = createMarsSandstorm();
  const particles = storm.getObjectByName('mars-sandstorm-particle-field');
  const banks = storm.children.filter((child) =>
    child.name.startsWith('mars-rolling-sand-haze-bank'),
  );
  assert.equal(storm.children.length, 4, 'one particle draw plus three haze draws');
  assert.equal(banks.length, 3);
  assert.equal(new Set(banks.map((bank) => bank.geometry)).size, 1, 'share one cloud geometry');
  assert.equal(particles.geometry.getAttribute('position').count, 240);
  assert.ok(banks.every((bank) => bank.material.isShaderMaterial));
  assert.ok(banks.every((bank) => bank.material.transparent && bank.material.depthWrite === false));
  assert.ok(banks.every((bank) => !/sampler2D|texture2D/.test(bank.material.fragmentShader)));
  assert.equal(marsSandstormAt(59).warning, true);
  assert.equal(storm.visible, false);
  updateMarsSandstorm(storm, 70);
  assert.equal(storm.visible, true);
  assert.ok(banks[0].material.uniforms.alpha.value > banks[1].material.uniforms.alpha.value);
  assert.ok(banks[1].material.uniforms.alpha.value > banks[2].material.uniforms.alpha.value);
  assert.ok(
    banks.every((bank) => Number.isFinite(bank.position.y) && Number.isFinite(bank.rotation.z)),
  );
});

test('QA148: deterministic cloud motion and no abrupt global particle snap', () => {
  const storm = createMarsSandstorm();
  const banks = storm.children.filter((child) =>
    child.name.startsWith('mars-rolling-sand-haze-bank'),
  );
  function snapshot(seconds) {
    updateMarsSandstorm(storm, seconds);
    return {
      particleZ: storm.children[0].position.z,
      banks: banks.map((bank) => [
        bank.position.x,
        bank.position.y,
        bank.rotation.z,
        bank.material.uniforms.alpha.value,
      ]),
    };
  }
  const early = snapshot(68);
  const active = snapshot(70);
  assert.notDeepEqual(active, early);
  assert.deepEqual(snapshot(70), active, 'the same clock time produces the same visual state');
  const beforeWrap = snapshot(71.42);
  const afterWrap = snapshot(71.44);
  assert.ok(
    Math.abs(afterWrap.particleZ - beforeWrap.particleZ) < 2,
    'no 150-unit dust-field jump',
  );
  assert.deepEqual(snapshot(70), active, 'scrubbing time does not accumulate drift');
  updateMarsSandstorm(storm, 89);
  assert.equal(storm.visible, false);
  assert.ok(banks.every((bank) => bank.material.uniforms.alpha.value === 0));
  assert.equal(storm.children[0].material.opacity, 0);
});
