import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SECTORS } from '../src/campaign.js';
import { createBossModel, disposeBossModel } from '../src/bosses.js';
import { bossSignatureVolley } from '../src/boss-signature.js';
import { bossAttackProgram } from '../src/boss-director.js';
import { bossBatteryPlan, batteryForSignature, sourceHardpointName } from '../src/boss-hardpoints.js';
import { createGroundEnemy, robotEyeMuzzles } from '../src/encounters.js';

test('ten bosses have visible left and right physical cannon hardpoints powered by destroyable weak points', () => {
  for (let i = 0; i < 10; i++) {
    const boss = createBossModel(SECTORS[i], i, true);
    const turrets = boss.userData.batteries;
    assert.equal(turrets.length, 2);
    assert.equal(boss.userData.parts.length, 2);
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1;
      assert.equal(boss.userData.parts[s].battery, turrets[s]);
      assert.ok(turrets[s].getObjectByName(sourceHardpointName(side)));
      assert.ok(turrets[s].getObjectByName('boss-battery-charging-ring')?.isMesh);
    }
    assert.ok(boss.getObjectByName(sourceHardpointName(0)));
    boss.position.set(5, 12, -90);
    boss.rotation.y = 0.3;
    boss.updateMatrixWorld(true);
    const left = boss.getObjectByName(sourceHardpointName(-1)).getWorldPosition(new T.Vector3());
    const right = boss.getObjectByName(sourceHardpointName(1)).getWorldPosition(new T.Vector3());
    assert.ok(left.distanceTo(right) > 30);
    boss.userData.parts[0].hp = 0;
    boss.userData.parts[0].battery.visible = false;
    assert.equal(boss.getObjectByName(sourceHardpointName(-1)).parent.visible, false);
    disposeBossModel(boss);
  }
});
test('destroying cannon generators actually reduces attack volume and slows cadence', () => {
  for (let i = 0; i < 10; i++) {
    const program = bossAttackProgram(i, 3, 4);
    const both = bossBatteryPlan([true, true], program.sources.length);
    const left = bossBatteryPlan([true, false], program.sources.length);
    const right = bossBatteryPlan([false, true], program.sources.length);
    const core = bossBatteryPlan([false, false], program.sources.length);
    assert.ok(left.sides.length <= both.sides.length, 'less attack volume boss ' + i);
    assert.ok(right.sides.length <= both.sides.length, 'less attack volume boss ' + i);
    assert.ok(left.sides.every((side) => side === -1));
    assert.ok(right.sides.every((side) => side === 1));
    assert.deepEqual(core.sides, [0], 'one emergency weapon when both guns are destroyed');
    assert.ok(core.cadenceMultiplier > left.cadenceMultiplier);
    assert.ok(left.cadenceMultiplier > both.cadenceMultiplier);
    const signature = bossSignatureVolley(i, 3, 3, [true, true]);
    assert.ok(signature.shots.every((shot) => batteryForSignature(shot.origin, [true, true]) !== null));
    for (const emission of signature.shots) {
      const side = batteryForSignature(emission.origin, [false, true]);
      assert.ok(side === null || side === 1);
    }
  }
});
test('robot eye ray bolts originate from named world-space eyes on animated head', () => {
  const model = createGroundEnemy('walker', 1);
  model.position.set(13, 7, -130);
  model.userData.turret.rotation.y = 0.2;
  const points = robotEyeMuzzles(model);
  assert.equal(points.length, 2);
  assert.ok(points[0].distanceTo(points[1]) > 2);
  assert.ok(points.every((point) => Number.isFinite(point.z)));
});
