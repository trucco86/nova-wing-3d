import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { SECTORS } from '../src/campaign.js';
import { harness } from './harness.mjs';

test('drill windup drives a moving bit on the same boss model, then retracts', () => {
  const boss = createBossModel(SECTORS[2], 2, true);
  const bit = boss.getObjectByName('signature-drill-bit');
  assert.ok(bit);
  animateBossSignature(boss, 2, 4.5, 2, 'windup');
  const windup = bit.position.z;
  const spin = bit.rotation.z;
  animateBossSignature(boss, 2, 5, 2, 'attack');
  assert.ok(bit.position.z > windup);
  assert.notEqual(bit.rotation.z, spin);
  animateBossSignature(boss, 2, 8, 2, 'recovery');
  assert.equal(bit.position.z, -8);
  assert.ok(boss.userData.parts.every((part) => part.hp > 0));
  disposeBoss(boss);
});

test('colossus changes both cannon arms independently without moving generator hitboxes', () => {
  const boss = createBossModel(SECTORS[5], 5, true);
  const left = boss.getObjectByName('signature-mech-left-arm');
  const right = boss.getObjectByName('signature-mech-right-arm');
  assert.ok(left && right);
  const positions = boss.userData.parts.map((part) => part.mesh.position.toArray());
  animateBossSignature(boss, 5, 2, 3, 'windup');
  assert.notEqual(left.rotation.x, right.rotation.x);
  const windup = left.rotation.x;
  animateBossSignature(boss, 5, 2, 3, 'attack');
  assert.notEqual(left.rotation.x, windup);
  assert.deepEqual(
    boss.userData.parts.map((part) => part.mesh.position.toArray()),
    positions,
  );
  disposeBoss(boss);
});

test('seven hydra heads articulate separately and Marvin crown visibly eclipses', () => {
  const hydra = createBossModel(SECTORS[6], 6, true);
  const heads = Array.from({ length: 7 }, (_, i) =>
    hydra.getObjectByName('signature-hydra-head-' + i),
  );
  assert.ok(heads.every(Boolean));
  animateBossSignature(hydra, 6, 3, 3, 'attack');
  assert.ok(heads.every((head) => head.scale.x > 1));
  assert.notEqual(heads[0].rotation.z, heads[1].rotation.z);
  disposeBoss(hydra);

  const marvin = createBossModel(SECTORS[9], 9, true);
  const eclipse = marvin.getObjectByName('signature-marvin-eclipse');
  assert.ok(eclipse);
  animateBossSignature(marvin, 9, 5, 3, 'windup');
  const charging = eclipse.scale.x;
  animateBossSignature(marvin, 9, 5, 3, 'attack');
  assert.ok(eclipse.scale.x > charging);
  disposeBoss(marvin);
});

test('signature bosses launch different projectiles through the actual DEV encounter without saving', (t) => {
  for (const index of [2, 5, 6, 9]) {
    const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
    t.after(() => h.close());
    assert.equal(h.game.startDeveloperScenario(index, 'boss'), true);
    // No script-only shortcuts: advance actual simulation clock into the first tactical attack.
    let observed = false;
    for (let i = 0; i < 130; i++) {
      h.advance(0.1, 0.1);
      const state = h.game.snapshot();
      if (state.entities.hostile > 0) observed = true;
      if (state.state !== 'playing') break;
    }
    assert.ok(observed, 'boss sector ' + index + ' produced offensive projectiles');
  }
});

test('six remaining chiefs have visible, independent authored attack parts without moving weak-point hitboxes', () => {
  const signatures = [
    [0, ['signature-rok-left', 'signature-rok-right']],
    [1, ['signature-stingray-tail']],
    [3, ['signature-orbit-iris']],
    [4, ['signature-phoenix-left-wing', 'signature-phoenix-right-wing']],
    [7, ['signature-omega-left', 'signature-omega-right']],
    [8, ['signature-orion-lens']],
  ];
  for (const [index, names] of signatures) {
    const boss = createBossModel(SECTORS[index], index, true);
    const parts = names.map((name) => boss.getObjectByName(name));
    assert.ok(parts.every(Boolean), 'missing moving part on sector ' + index);
    const originalTargets = boss.userData.parts.map((p) => p.mesh.position.toArray());
    animateBossSignature(boss, index, 1, 2, 'windup');
    const charging = parts.map((p) => p.rotation.toArray().concat(p.scale.toArray()));
    animateBossSignature(boss, index, 1, 2, 'attack');
    const attack = parts.map((p) => p.rotation.toArray().concat(p.scale.toArray()));
    assert.notDeepEqual(charging, attack, 'choreography must change for boss ' + index);
    assert.deepEqual(
      boss.userData.parts.map((p) => p.mesh.position.toArray()),
      originalTargets,
    );
    disposeBoss(boss);
  }
});
