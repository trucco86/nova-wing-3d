import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orbit9CameraPose } from '../src/orbit9-camera.js';
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
  assert.ok(
    root.userData.instanceCounts.hull >= 20,
    'landing hangar must have near-field armored frames instead of an empty deck',
  );
  assert.ok(
    root.userData.instanceCounts.cyan >= 25,
    'arrival path and carrier gantries need recognizable light guides',
  );
  assert.equal(root.children.filter((o) => o.isMesh && !o.isInstancedMesh).length, 2);
  const dial = root.getObjectByName('orbit9-reactor-diagnostic-dial');
  const faceRing = root.getObjectByName('devastador-reactor-front-energy-ring');
  assert.ok(dial);
  assert.ok(faceRing, 'the core collider must show an identifiable reactor face');
  assert.ok(faceRing.position.z > -34, 'reactor energy ring sits in front of the solid block');
  updateOrbit9StageArt(root, 3);
  assert.ok(Math.abs(dial.rotation.z - 0.48) < 0.00001);
  assert.ok(Math.abs(faceRing.rotation.z + 0.36) < 0.00001);
  updateOrbit9StageArt(root, NaN);
  assert.equal(dial.rotation.z, 0);
  assert.ok(Math.abs(faceRing.rotation.z) < 1e-8);
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

test('follow camera keeps the entrance deck visible and avoids giant foreground reactor props', () => {
  const spawn = orbit9CameraPose(0, 12, { yaw: 0, mode: 'follow' });
  assert.ok(spawn.eye.z <= 21, 'follow camera must stay above the built deck');
  assert.ok(spawn.eye.z > spawn.aim.z);
  assert.ok(spawn.eye.y < 8, 'follow camera stays at character level, not overhead');
  assert.ok(spawn.aim.z < 7, 'the look-ahead reveals the hangar architecture');
  assert.ok(spawn.fov <= 54, 'follow framing keeps the cat large enough on phones');
  const horizontal = Math.hypot(spawn.eye.x - spawn.aim.x, spawn.eye.z - spawn.aim.z);
  const pitch = Math.atan2(spawn.eye.y - spawn.aim.y, horizontal);
  assert.ok(pitch < 0.28, 'camera pitch must not fill the viewport with deck panels');
  const portrait = orbit9CameraPose(0, 12, {
    yaw: 0,
    mode: 'follow',
    aspect: 390 / 844,
  });
  const landscape = orbit9CameraPose(0, 12, {
    yaw: 0,
    mode: 'follow',
    aspect: 844 / 390,
  });
  assert.ok(
    portrait.eye.z > landscape.eye.z + 5,
    'portrait camera must move back so the cat does not fill half the phone',
  );
  assert.ok(portrait.eye.z <= 34, 'portrait camera stays over the extended landing floor');
  assert.ok(portrait.fov > landscape.fov, 'portrait view needs more vertical space around cat');
  const reactor = orbit9CameraPose(39, -55, { yaw: 0, mode: 'follow' });
  const distance = Math.hypot(reactor.eye.x - 39, reactor.eye.z + 55);
  assert.ok(distance < 16, 'reactor camera must be close enough to keep the pilot readable');
  assert.ok(reactor.eye.z < -38, 'foreground service modules should stay behind camera');
  const survey = orbit9CameraPose(39, -55, { yaw: 0, mode: 'survey' });
  assert.ok(survey.eye.y > reactor.eye.y, 'panoramic mode stays visibly elevated');
});
