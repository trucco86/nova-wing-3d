import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  EUROPA_CANYON_BUDGET,
  createEuropaCrystalCanyon,
  setEuropaCrystalCanyonQuality,
} from '../src/europa-crystal-canyon.js';
import { europaSurfaceAt } from '../src/europa-surface.js';
import { createWorld } from '../src/visuals.js';
import { SECTORS } from '../src/campaign.js';

test('Europa crystal canyon has authored cliffs, cyan/violet shards and rooted alien architecture', () => {
  const root = createEuropaCrystalCanyon();
  assert.equal(root.name, 'europa-premium-crystal-canyon');
  assert.equal(root.userData.visualOnly, true);
  assert.equal(root.children.length, 5, 'four batches and one landmark group');
  const quantities = [
    ['europa-canyon-grounded-cliffs', EUROPA_CANYON_BUDGET.cliffInstances],
    ['europa-canyon-crystal-cyan', EUROPA_CANYON_BUDGET.cyanCrystalInstances],
    ['europa-canyon-crystal-violet', EUROPA_CANYON_BUDGET.violetCrystalInstances],
    ['europa-canyon-ancient-bridges', EUROPA_CANYON_BUDGET.ruinArchInstances],
  ];
  const instance = new T.Matrix4();
  const pos = new T.Vector3();
  for (const [name, count] of quantities) {
    const mesh = root.getObjectByName(name);
    assert.ok(mesh?.isInstancedMesh, name + ' must be batched for WebGL');
    assert.equal(mesh.count, count);
    assert.equal(mesh.userData.visualOnly, true);
    assert.ok(mesh.geometry.index?.count > 0, name + ' must have indexed geometry');
    assert.ok(mesh.geometry.getAttribute('normal'));
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, instance);
      pos.setFromMatrixPosition(instance);
      assert.ok(Math.abs(pos.x) >= 98, name + ' stays outside aiming lane');
    }
  }
  // Check the actual transformed vertices, not merely the centre positions:
  // taller foreground crystals can lean into the aiming lane on mobile.
  for (const name of ['europa-canyon-crystal-cyan', 'europa-canyon-crystal-violet']) {
    const crystals = root.getObjectByName(name);
    const attribute = crystals.geometry.getAttribute('position');
    let closeUpCount = 0;
    for (let i = 0; i < crystals.count; i++) {
      crystals.getMatrixAt(i, instance);
      const centerZ = instance.elements[14];
      if (centerZ >= -490) closeUpCount++;
      for (let v = 0; v < attribute.count; v++) {
        pos.fromBufferAttribute(attribute, v).applyMatrix4(instance);
        assert.ok(Math.abs(pos.x) > 72, name + ' must not cover the active aiming lane');
      }
    }
    assert.ok(closeUpCount >= 4, name + ' must have visible foreground clusters');
  }
  const cyanColors = root.getObjectByName('europa-canyon-crystal-cyan').geometry.getAttribute('color');
  const violetColors = root.getObjectByName('europa-canyon-crystal-violet').geometry.getAttribute('color');
  assert.ok(violetColors.getX(6) > cyanColors.getX(6), 'violet crystals need their own visible color palette');
  const cliffs = root.getObjectByName('europa-canyon-grounded-cliffs');
  assert.ok(cliffs.geometry.getAttribute('color'));
  assert.ok(root.getObjectByName('europa-canyon-crystal-cyan').geometry.getAttribute('color'));
  const gate = root.getObjectByName('europa-canyon-distant-alien-gateway');
  assert.ok(gate?.isGroup);
  assert.ok(gate.position.x >= 120);
  assert.ok(gate.position.z >= -650, 'landmark must be close enough to read on portrait');
  assert.equal(gate.children.length, 2);
  assert.ok(gate.getObjectByName('europa-canyon-anchored-broken-gateway')?.isMesh);
  assert.ok(gate.getObjectByName('europa-canyon-suspended-reactor')?.isMesh);
  root.traverse((node) => {
    assert.notEqual(node.userData.hitbox, true);
    assert.notEqual(node.userData.collider, true);
    assert.notEqual(node.userData.targetable, true);
  });
});

test('mobile Medium mode removes violet crystal draw while preserving canyon and target portal', () => {
  const root = createEuropaCrystalCanyon();
  const violet = root.getObjectByName('europa-canyon-crystal-violet');
  assert.equal(violet.visible, true);
  setEuropaCrystalCanyonQuality(root, 'medium');
  assert.equal(violet.visible, false);
  assert.equal(root.getObjectByName('europa-canyon-crystal-cyan').visible, true);
  assert.equal(root.getObjectByName('europa-canyon-grounded-cliffs').visible, true);
  assert.equal(root.getObjectByName('europa-canyon-distant-alien-gateway').visible, true);
  setEuropaCrystalCanyonQuality(root, 'high');
  assert.equal(violet.visible, true);
  assert.equal(EUROPA_CANYON_BUDGET.decorativeDrawsHigh, 6);
  assert.equal(EUROPA_CANYON_BUDGET.decorativeDrawsMedium, 5);
});

test('the real Europa mission reveals the canyon after descent, hides it in tunnel and boss', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => 0.5, true);
  world.setSector(SECTORS[5], 5);
  const canyon = scene.getObjectByName('europa-premium-crystal-canyon');
  const surface = scene.getObjectByName('europa-frozen-surface');
  assert.ok(canyon && surface && canyon.parent === surface);
  assert.equal(surface.visible, false);
  assert.equal(europaSurfaceAt(12).groundVisible, false);
  world.setDestinationArrival(28);
  assert.equal(surface.visible, true);
  assert.ok(scene.fog.density < 0.0016, 'distance clarity must improve over old grey haze');
  const ground = scene.getObjectByName('launch-ground');
  assert.ok(ground.material.fragmentShader.includes('fissure'));
  assert.ok(ground.material.fragmentShader.includes('channel'));
  assert.ok(ground.material.fragmentShader.includes('iceTile'));
  assert.ok(ground.material.fragmentShader.includes('tileEdges'));
  assert.equal(
    ground.material.fragmentShader.includes('sin(p.y*.047+sin(p.x*.12)'),
    false,
    'remove the swirling puddle pattern from the frozen channel',
  );
  assert.equal(canyon.getObjectByName('europa-canyon-crystal-cyan').visible, true);
  assert.equal(world.setEuropaTunnel(true), true);
  assert.equal(surface.visible, false);
  assert.equal(ground.visible, false);
  world.setEuropaTunnel(false);
  assert.equal(surface.visible, true);
  world.setEuropaBossArena(true, -83);
  assert.equal(surface.visible, false);
  world.setDestinationArrival(90);
  assert.equal(surface.visible, false, 'boss scene never restores foreground scenery');
  world.setSector(SECTORS[4], 4);
  assert.equal(scene.getObjectByName('europa-premium-crystal-canyon'), undefined);
  assert.equal(world.setEuropaTunnel(true), false);
});

test('Europa crystal canyon does not add offscreen planetary props or a repeat of glowing torus corridors', () => {
  const root = createEuropaCrystalCanyon();
  let gateways = 0;
  let rings = 0;
  root.traverse((obj) => {
    if (obj.name === 'europa-canyon-distant-alien-gateway') gateways++;
    if (obj.geometry?.type === 'TorusGeometry') rings++;
  });
  assert.equal(gateways, 1, 'only one authored landmark per route');
  assert.equal(rings, 0, 'broken arcs are merged into one structure, not repeated torus props');
  const ground = root.getObjectByName('europa-canyon-grounded-cliffs');
  assert.equal(ground.material.isMeshStandardMaterial, true);
  assert.equal(
    root.getObjectByName('europa-canyon-ancient-bridges').material.isMeshStandardMaterial,
    true,
  );
});
