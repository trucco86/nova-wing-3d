import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCityDestructionScene, updateCityDestructionScene } from '../src/city-destruction.js';
import { createCityFallingSolids } from '../src/city-falling-solids.js';

test('QA108: hidden falling sign parts never leave an invisible collider', () => {
  const city = createCityDestructionScene();
  const falling = createCityFallingSolids(city);
  updateCityDestructionScene(city, 6.5);
  const visible = falling.update().find((c) => c.kind === 'falling-billboard');
  assert.ok(visible, 'the visible billboard is physical');
  const originalWidth = visible.half.x * 2;

  const sign = city.getObjectByName('city-falling-advertisement');
  const pieces = [];
  sign.traverse((child) => {
    if (child.isMesh) {
      pieces.push(child);
      child.visible = false;
    }
  });
  assert.ok(pieces.length >= 3);
  assert.equal(sign.visible, true, 'parent stays visible while all its geometry is hidden');
  assert.equal(
    falling.update().some((c) => c.kind === 'falling-billboard'),
    false,
    'all hidden sign meshes must have no ghost hitbox',
  );

  const frame = city.getObjectByName('city-sign-frame');
  frame.visible = true;
  const reduced = falling.update().find((c) => c.kind === 'falling-billboard');
  assert.ok(reduced, 'one real visible mesh restores its own collider');
  assert.ok(reduced.half.x * 2 <= originalWidth + 1e-5);
  assert.ok(reduced.half.toArray().every(Number.isFinite));

  sign.visible = false;
  assert.equal(
    falling.update().some((c) => c.kind === 'falling-billboard'),
    false,
    'hidden parent also suppresses descendants that are individually visible',
  );

  sign.visible = true;
  for (const piece of pieces) piece.visible = true;
  assert.ok(
    falling.update().some((c) => c.kind === 'falling-billboard'),
    'restored visible wreck restores collision without changing player bounds',
  );
});

test('QA108: hiding falling sign geometry does not disable an independently visible hovercar', () => {
  const city = createCityDestructionScene();
  const falling = createCityFallingSolids(city);
  updateCityDestructionScene(city, 10.8);
  const hovercar = city.getObjectByName('city-falling-hovercar');
  assert.equal(hovercar.visible, true);
  const hull = city.getObjectByName('city-hovercar-hull');
  assert.ok(hull.visible);
  const before = falling.update().find((c) => c.kind === 'falling-hovercar');
  assert.ok(before, 'visible car remains collidable');

  hovercar.traverse((child) => {
    if (child.isMesh) child.visible = false;
  });
  assert.equal(
    falling.update().some((c) => c.kind === 'falling-hovercar'),
    false,
    'a hidden car has no phantom hull',
  );
  hull.visible = true;
  const restored = falling.update().find((c) => c.kind === 'falling-hovercar');
  assert.ok(restored, 'restoring a visible car part creates a bounded collider');
  assert.ok(restored.half.x > 0 && restored.half.y > 0 && restored.half.z > 0);
});
