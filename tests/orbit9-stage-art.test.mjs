import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORBIT9_ART_LANDMARKS,
  ORBIT9_DEVASTADOR_PALETTE,
  createOrbit9StageArt,
  updateOrbit9StageArt,
} from '../src/orbit9-stage-art.js';
import {
  ORBIT9_OBSTACLES,
  ORBIT9_CLUE_POSITIONS,
  ORBIT9_SURVIVOR,
} from '../src/orbit9-free-roam.js';

test('Orbit-9 art reuses Stage 04 Devastador armor, hazard and light language', () => {
  assert.equal(ORBIT9_DEVASTADOR_PALETTE.hull, '#34475b');
  assert.equal(ORBIT9_DEVASTADOR_PALETTE.armor, '#677a91');
  assert.equal(ORBIT9_DEVASTADOR_PALETTE.plating, '#151f33');
  assert.equal(ORBIT9_DEVASTADOR_PALETTE.cyan, '#73e8ff');
  assert.equal(ORBIT9_DEVASTADOR_PALETTE.hazard, '#fa755c');
  const root = createOrbit9StageArt();
  assert.equal(root.name, 'orbit9-devastador-stage-art');
  assert.equal(root.userData.referencesStage, 3);
  assert.equal(root.userData.visualOnly, true);
  assert.deepEqual(
    root.userData.landmarks.map((item) => item.id),
    ['central', 'science', 'reactor', 'archive'],
  );
  assert.deepEqual(root.userData.landmarks, ORBIT9_ART_LANDMARKS);
  const batches = root.children.filter((o) => o.isInstancedMesh);
  assert.ok(batches.length >= 7 && batches.length <= 8);
  assert.ok(batches.every((m) => m.count > 0 && m.userData.visualOnly));
  assert.ok(batches.reduce((n, m) => n + m.count, 0) >= 200);
  assert.equal(root.children.filter((o) => o.isMesh && !o.isInstancedMesh).length, 1);
  const dial = root.getObjectByName('orbit9-reactor-diagnostic-dial');
  assert.ok(dial);
  updateOrbit9StageArt(root, 3);
  assert.ok(Math.abs(dial.rotation.z - 0.48) < 0.00001);
  updateOrbit9StageArt(root, NaN);
  assert.equal(dial.rotation.z, 0);
  root.traverse((o) => {
    if (o.isMesh) {
      assert.equal(o.userData.visualOnly, true);
      assert.equal(o.castShadow, false);
      assert.equal(o.receiveShadow, false);
    }
  });
});

test('Stage art adds no new collision or interaction positions', () => {
  const originalBlocks = ORBIT9_OBSTACLES.map(({ id, x, z, halfX, halfZ }) => ({
    id,
    x,
    z,
    halfX,
    halfZ,
  }));
  const before = JSON.stringify({
    blocks: originalBlocks,
    clues: ORBIT9_CLUE_POSITIONS,
    npc: ORBIT9_SURVIVOR,
  });
  createOrbit9StageArt();
  const after = JSON.stringify({
    blocks: ORBIT9_OBSTACLES.map(({ id, x, z, halfX, halfZ }) => ({
      id,
      x,
      z,
      halfX,
      halfZ,
    })),
    clues: ORBIT9_CLUE_POSITIONS,
    npc: ORBIT9_SURVIVOR,
  });
  assert.equal(after, before);
  assert.deepEqual(ORBIT9_CLUE_POSITIONS, [
    [-38, -18],
    [39, -55],
    [-37, -82],
  ]);
  assert.deepEqual(ORBIT9_SURVIVOR, [9, -92]);
});
