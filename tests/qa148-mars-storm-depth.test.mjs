import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarsSandstorm, updateMarsSandstorm, marsSandstormAt } from '../src/mars-sandstorm.js';

function snapshot(banks) {
  return banks.map((bank) => ({
    position: bank.position.toArray(),
    rotation: bank.rotation.toArray().slice(0, 3),
    scale: bank.scale.toArray(),
    alpha: bank.material.uniforms.alpha.value,
  }));
}

test('QA148 Mars: visible gusts add depth with exactly the same 4 drawing objects', () => {
  const root = createMarsSandstorm();
  assert.equal(root.children.length, 4, 'one existing particle field plus three haze banks');
  assert.equal(root.children.filter((child) => child.isMesh).length, 3);
  const banks = root.children.filter((child) => child.isMesh);
  const materialRefs = root.children.map((child) => child.material);
  const geometryRefs = root.children.map((child) => child.geometry);
  const active = updateMarsSandstorm(root, 70);
  assert.equal(active.active, true);
  assert.equal(root.visible, true);
  assert.ok(banks.every((bank) => bank.material.uniforms.alpha.value > 0));
  const at70 = snapshot(banks);
  assert.ok(banks.some((bank, i) => Math.abs(bank.position.y - (8 + i * 5)) > 0.01));
  assert.ok(banks.some((bank, i) => Math.abs(bank.position.z - (-140 - i * 34)) > 0.01));
  assert.ok(banks.every((bank) => bank.scale.x >= 1 && bank.scale.y >= 1));
  updateMarsSandstorm(root, 71);
  assert.notDeepEqual(snapshot(banks), at70, 'front moves rather than remaining a static screen overlay');
  updateMarsSandstorm(root, 70);
  assert.deepEqual(snapshot(banks), at70, 'returning to the same time restores identical weather');
  for (let t = 72; t < 80; t += 0.25) updateMarsSandstorm(root, t);
  assert.equal(root.children.length, 4);
  assert.deepEqual(root.children.map((child) => child.material), materialRefs);
  assert.deepEqual(root.children.map((child) => child.geometry), geometryRefs);
});

test('QA148 Mars: storm reset clears alpha and cloned storms keep the same timeline', () => {
  const root = createMarsSandstorm();
  const cloned = root.clone(true);
  const storm = marsSandstormAt(70);
  assert.equal(storm.active, true);
  updateMarsSandstorm(root, 70);
  updateMarsSandstorm(cloned, 70);
  assert.deepEqual(
    snapshot(root.children.filter((child) => child.isMesh)),
    snapshot(cloned.children.filter((child) => child.isMesh)),
  );
  const ended = updateMarsSandstorm(root, 93);
  assert.equal(ended.active, false);
  assert.equal(root.visible, false);
  assert.equal(root.children[0].material.opacity, 0);
  assert.ok(root.children.slice(1).every((bank) => bank.material.uniforms.alpha.value === 0));
  updateMarsSandstorm(root, 70);
  assert.equal(root.visible, true);
});
