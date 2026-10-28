import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { bossSignatureVolley, bossSignaturePose } from '../src/boss-signature.js';

const NEW_BOSSES = [
  { index: 0, parts: ['signature-rok-left-wing', 'signature-rok-right-wing'] },
  { index: 1, parts: ['signature-stingray-left-fin', 'signature-stingray-right-fin', 'signature-stingray-tail'] },
  { index: 3, parts: ['signature-station-reactor'] },
  { index: 4, parts: ['signature-phoenix-left-flare', 'signature-phoenix-right-flare'] },
  { index: 7, parts: ['signature-omega-left-battery', 'signature-omega-right-battery'] },
  { index: 8, parts: ['signature-bastion-iris'] },
];

test('all six remaining bosses own moving physical parts distinct from generator hitboxes', () => {
  for (const { index, parts } of NEW_BOSSES) {
    const boss = createBossModel(SECTORS[index], index, true);
    const generators = boss.userData.parts.map((item) => item.mesh.position.toArray());
    const actors = parts.map((name) => {
      const part = boss.getObjectByName(name);
      assert.ok(part, 'Missing actual model component ' + name);
      return part;
    });
    const before = actors.map((part) => ({
      x: part.rotation.x, z: part.rotation.z, scale: part.scale.x,
    }));
    const posed = animateBossSignature(boss, index, 3.5, 3, 'windup');
    assert.ok(posed);
    assert.ok(Object.values(posed).every(Number.isFinite));
    const windup = actors.map((part) => ({
      x: part.rotation.x, z: part.rotation.z, scale: part.scale.x,
    }));
    const attacking = animateBossSignature(boss, index, 3.5, 3, 'attack');
    const attack = actors.map((part) => ({
      x: part.rotation.x, z: part.rotation.z, scale: part.scale.x,
    }));
    assert.notDeepEqual(windup, before, 'No windup animation in sector ' + index);
    assert.notDeepEqual(attack, windup, 'No attack pose in sector ' + index);
    assert.notDeepEqual(posed, attacking, 'Need a legible windup and attack pose');
    assert.deepEqual(
      boss.userData.parts.map((item) => item.mesh.position.toArray()),
      generators,
      'Animations cannot invalidate the weak point collision volumes',
    );
    disposeBoss(boss);
  }
});

test('destroyed batteries disable their side of the six new attack families', () => {
  for (const { index } of NEW_BOSSES) {
    const all = bossSignatureVolley(index, 2, 3, [true, true]);
    const leftOnly = bossSignatureVolley(index, 2, 3, [true, false]);
    const rightOnly = bossSignatureVolley(index, 2, 3, [false, true]);
    const core = bossSignatureVolley(index, 2, 3, [false, false]);
    assert.ok(all.shots.length <= 10, 'Phone projectile safety budget');
    assert.ok(leftOnly.shots.length > 0 && leftOnly.shots.length < all.shots.length, 'Left battery effect ' + index);
    assert.ok(rightOnly.shots.length > 0 && rightOnly.shots.length < all.shots.length, 'Right battery effect ' + index);
    assert.ok(leftOnly.shots.every((p) => p.origin[0] <= 0), 'Left only must not fire right ' + index);
    assert.ok(rightOnly.shots.every((p) => p.origin[0] >= 0), 'Right only must not fire left ' + index);
    assert.ok(core.shots.length === 1 && core.shots[0].origin[0] === 0);
  }
});

test('sector special attacks differ in launch vectors, phase and choreography', () => {
  const shapes = new Set();
  for (const { index } of NEW_BOSSES) {
    const one = bossSignatureVolley(index, 1, 1);
    const three = bossSignatureVolley(index, 1, 3);
    assert.ok(one.name.length > 7);
    assert.ok(one.shots.length > 1);
    assert.ok(three.shots.length >= one.shots.length);
    assert.ok(three.shots.every((p) => [...p.origin, ...p.target].every(Number.isFinite)));
    assert.notDeepEqual(bossSignaturePose(index, 1.5, 1, 'windup'), bossSignaturePose(index, 1.5, 1, 'attack'));
    shapes.add(JSON.stringify(one.shots));
  }
  assert.equal(shapes.size, NEW_BOSSES.length, 'Every encounter has its own attack geometry');
});
