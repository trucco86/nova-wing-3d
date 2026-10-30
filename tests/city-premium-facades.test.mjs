import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createWorld } from '../src/visuals.js';

test('City 2.2 high facade detail has dense window layers within fixed GPU budgets', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  const near = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  const high = near.getObjectByName('city-high-details');
  assert.ok(near && far && high);
  assert.equal(high.visible, false);
  const limits = [
    ['city-facade-windows-cool', 15000, 4000],
    ['city-facade-windows-amber', 3000, 100],
    ['city-facade-side-windows', 6600, 1000],
    ['city-facade-panel-modules', 800, 700],
  ];
  for (const [name, capacity, minimum] of limits) {
    const mesh = near.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name);
    assert.ok(mesh.count > minimum, name + ' must be visibly populated');
    assert.ok(mesh.count <= capacity, name + ' cannot exceed its allocated buffer');
    assert.ok(far.getObjectByName(name)?.isInstancedMesh, name + ' in distant city');
  }
  const ground = scene.getObjectByName('launch-ground');
  assert.ok(ground?.material?.uniforms?.urban, 'procedural avenue paving shader exists');
  assert.equal(ground.material.uniforms.urban.value, 1);
  assert.equal(ground.material.uniforms.detail.value, 0.4);
  const rail = near.getObjectByName('city-avenue-guardrail');
  const railLights = near.getObjectByName('city-avenue-guardrail-lights');
  assert.equal(rail?.count, 950, 'guardrails restore posts, two rails and curb on both sides');
  assert.equal(railLights?.count, 190, 'both roadway sides retain cyan rail lights on Medium');
  assert.ok(far.getObjectByName('city-avenue-guardrail'));
  const bridge = near.getObjectByName('city-elevated-crossings');
  const bridgeLights = near.getObjectByName('city-elevated-crossings-lights');
  const transit = near.getObjectByName('city-suspended-transit');
  assert.ok(bridge?.isInstancedMesh && bridge.count >= 45);
  assert.ok(bridgeLights?.isInstancedMesh && bridgeLights.count >= 25);
  assert.equal(transit?.count, 180, 'suspended transit runs down both sides of the city');
  const transform = new T.Matrix4();
  const pos = new T.Vector3();
  const rot = new T.Quaternion();
  const scale = new T.Vector3();
  rail.getMatrixAt(0, transform);
  transform.decompose(pos, rot, scale);
  assert.ok(Math.abs(pos.x) >= 38, 'guardrails never obstruct the center flight lane');
  bridge.getMatrixAt(0, transform);
  transform.decompose(pos, rot, scale);
  assert.ok(pos.y - scale.y / 2 > 45, 'aerial crossing safely clears the flight lane');
  const commonWindows = near.children.find((obj) => obj.isInstancedMesh && obj.count === 2800);
  assert.ok(commonWindows, 'medium keeps its pre-existing windows');
  world.setGraphicsQuality('high');
  assert.equal(ground.material.uniforms.detail.value, 1, 'High enriches procedural paving');
  assert.equal(high.visible, true);
  assert.equal(far.getObjectByName('city-high-details').visible, true);
  world.setGraphicsQuality('medium');
  assert.equal(ground.material.uniforms.detail.value, 0.4);
  assert.equal(high.visible, false);
  assert.equal(far.getObjectByName('city-high-details').visible, false);
  world.update(40, 40, 48, true);
  world.reset();
  assert.equal(high.visible, false);
  assert.ok(Number.isFinite(near.position.z));
});
