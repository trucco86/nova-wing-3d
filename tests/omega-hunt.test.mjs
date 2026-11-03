import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import * as T from 'three';
import {
  advanceOmegaRearResponse,
  chaseOmegaHeading,
  chaseOmegaOffset,
  omegaAppendageAmplitude,
  OMEGA_REAR_LOCK_SECONDS,
} from '../src/omega-hunt.js';
import { withReactorOrbitPresentation } from '../src/reactor-orbit-presentation.js';
import { chooseBossIntent, bossMeleePose, bossMeleeHit } from '../src/boss-combat-ai.js';
import { createBossModel, animateBossSignature, disposeBoss } from '../src/bosses.js';
import { bossWeakPointOpen, bossWeakPointPlan } from '../src/boss-weakpoint-layout.js';

const angleDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

test('Omega pursues a player behind the ship smoothly, without flipping 180 degrees', () => {
  let counterYaw = 0;
  const orbitAngle = Math.PI;
  const behind = -Math.PI;
  assert.ok(bossWeakPointOpen(7, behind, 1), 'rear generator is initially aimable');
  let hasRearWindow = false;
  for (let i = 0; i < 36; i++) {
    const next = chaseOmegaHeading(counterYaw, orbitAngle, 1 / 60, 2, 'maneuver');
    assert.ok(angleDiff(next, counterYaw) <= 0.025, 'angular turn cannot teleport');
    counterYaw = next;
    const hullYaw = counterYaw - orbitAngle;
    if (bossWeakPointOpen(7, -hullYaw, 1)) hasRearWindow = true;
  }
  assert.equal(hasRearWindow, true);
  assert.ok(angleDiff(counterYaw, orbitAngle) > 1.8, 'rear remains visible for meaningful time');
  for (let i = 0; i < 480; i++)
    counterYaw = chaseOmegaHeading(counterYaw, orbitAngle, 1 / 60, 2, 'maneuver');
  assert.ok(angleDiff(counterYaw, orbitAngle) < 0.015, 'Omega ultimately turns toward the pilot');
  assert.equal(bossWeakPointOpen(7, orbitAngle - counterYaw, 1), false);
});

test('Omega turn rate slows during committed bite to preserve dodgeable attack warning', () => {
  const fast = chaseOmegaHeading(0, 2.3, 0.08, 2, 'recovery');
  const locked = chaseOmegaHeading(0, 2.3, 0.08, 2, 'attack');
  assert.ok(fast > locked);
  assert.ok(locked > 0);
  assert.equal(chaseOmegaHeading(0.5, 2.3, 0, 1), 0.5);
  assert.throws(() => chaseOmegaHeading(0, Number.NaN, 0.016), RangeError);
  assert.throws(() => chaseOmegaHeading(0, 2, -1), RangeError);
  // Test wrap-around across +/-180 degrees, not the long way round.
  const near = chaseOmegaHeading(Math.PI - 0.02, -Math.PI + 0.03, 0.05);
  assert.ok(angleDiff(near, -Math.PI + 0.03) < 0.05);
});

test('Omega uses bite, flank claw, hammer arm and rear tentacle hitboxes', () => {
  const front = chooseBossIntent({ sector: 7, cycle: 0, playerY: 12, orbit: 0 });
  const flank = chooseBossIntent({ sector: 7, cycle: 0, orbit: 1.35 });
  const rear = chooseBossIntent({ sector: 7, cycle: 0, orbit: 2.85 });
  const heavy = chooseBossIntent({ sector: 7, cycle: 2, robot: true, orbit: 0 });
  const sweep = chooseBossIntent({ sector: 7, cycle: 1, playerY: 35, orbit: 0 });
  assert.deepEqual(
    [front.kind, flank.kind, rear.kind, heavy.kind, sweep.kind],
    ['bite', 'claw-swipe', 'tentacle-grab', 'hammer-slam', 'tentacle-sweep'],
  );
  assert.deepEqual([front.origin, flank.origin, rear.origin], ['jaw', 'claws', 'tentacles']);
  for (const intent of [front, flank, rear, heavy, sweep]) {
    assert.ok(Object.isFrozen(intent));
    assert.ok(intent.warning >= 2.2);
    assert.ok(bossMeleePose(intent, 'windup', 1.5).lunge === 0);
    assert.ok(bossMeleeHit(intent, { x: intent.targetX, y: intent.targetY, orbit: 2.7 }));
    assert.equal(bossMeleeHit(intent, { x: 92, y: -30, orbit: 2.7 }), false);
  }
  assert.equal(chooseBossIntent({ sector: 7, cycle: 4 }).kind, 'barrage');
  assert.equal(chooseBossIntent({ sector: 3, cycle: 1 }).kind, 'hammer-slam');
});

test('Omega visual jaw, claws, hammer arms and tentacles react without moving actual generators', () => {
  const boss = createBossModel(SECTORS[7], 7, true);
  for (const part of [
    'omega-mouth-cavity',
    'omega-port-talon',
    'omega-starboard-talon',
    'omega-port-tentacle',
    'omega-starboard-tentacle',
  ])
    assert.ok(boss.getObjectByName(part), part);
  const weak = boss.userData.parts.map((p) => p.mesh.position.toArray());
  const muzzles = boss.userData.batteries.map((p) => p.position.toArray());
  assert.equal(boss.userData.jaw.visible, true);
  const motion = [
    ['bite', { jaw: 0.85, claw: 0, tentacle: 0 }, 'jaw'],
    ['claw-swipe', { jaw: 0, claw: 0.8, tentacle: 0 }, 'claw'],
    ['hammer-slam', { jaw: 0, claw: 0.8, tentacle: 0 }, 'arm'],
    ['tentacle-grab', { jaw: 0, claw: 0, tentacle: 0.7 }, 'tentacle'],
  ];
  for (const [kind, pose, part] of motion) {
    const p = omegaAppendageAmplitude(kind, 'attack', pose);
    assert.ok(p[part] > 0);
    animateBossSignature(boss, 7, 12, 3, 'attack', kind, pose);
    if (part === 'jaw') assert.ok(boss.userData.jaw.rotation.x > 0.5);
    if (part === 'claw')
      assert.ok(Math.abs(boss.getObjectByName('omega-port-talon').rotation.z) > 0.5);
    if (part === 'arm') assert.ok(boss.getObjectByName('signature-omega-left').rotation.x > 0.4);
    if (part === 'tentacle')
      assert.ok(boss.getObjectByName('omega-starboard-tentacle').rotation.x > 0.25);
    assert.deepEqual(
      boss.userData.parts.map((p) => p.mesh.position.toArray()),
      weak,
    );
    assert.deepEqual(
      boss.userData.batteries.map((p) => p.position.toArray()),
      muzzles,
    );
  }
  animateBossSignature(boss, 7, 20, 3, 'recovery', 'bite');
  assert.equal(boss.getObjectByName('omega-port-talon').rotation.x, 0);
  disposeBoss(boss);
  const room4 = createBossModel(SECTORS[3], 3, true);
  assert.equal(room4.getObjectByName('omega-port-tentacle'), undefined);
  disposeBoss(room4);
  assert.equal(bossWeakPointPlan(7).length, 2, 'retain only actual destructible battery targets');
});

test('Omega follows player movement without teleporting into the dodge corridor', () => {
  const start = { x: 0, y: 0 };
  const pilot = { x: 90, y: 55 };
  const moving = chaseOmegaOffset(start, pilot, 0.08, 'maneuver');
  const committed = chaseOmegaOffset(start, pilot, 0.08, 'attack');
  assert.ok(moving.x > committed.x && moving.y > committed.y);
  assert.ok(moving.x <= 0.81);
  assert.ok(moving.y <= 0.81);
  assert.deepEqual(chaseOmegaOffset(moving, pilot, 0, 'recovery'), moving);
  let offset = start;
  for (let i = 0; i < 500; i++) offset = chaseOmegaOffset(offset, pilot, 1 / 60);
  assert.deepEqual(offset, { x: 20, y: 9 }, 'leash keeps the boss in the center arena');
  assert.throws(() => chaseOmegaOffset(start, pilot, -1), RangeError);
});

test('destroying a physical Omega battery leaves its corresponding claw and tentacle damaged', () => {
  const boss = createBossModel(SECTORS[7], 7, true);
  boss.userData.parts[0].hp = 0;
  animateBossSignature(boss, 7, 12, 3, 'attack', 'claw-swipe', { claw: 0.9 });
  const portClaw = boss.getObjectByName('omega-port-talon');
  const starboardClaw = boss.getObjectByName('omega-starboard-talon');
  const portTentacle = boss.getObjectByName('omega-port-tentacle');
  assert.ok(Math.abs(portClaw.rotation.z + 0.95) < 1e-6, 'destroyed port limb droops');
  assert.ok(portClaw.rotation.x < 0, 'destroyed port limb cannot make an attack stroke');
  assert.ok(starboardClaw.rotation.x > 0.25, 'intact opposite limb keeps moving');
  assert.ok(portTentacle.rotation.x < 0, 'linked tentacle visibly collapses');
  assert.equal(boss.userData.parts[1].hp > 0, true);
  disposeBoss(boss);
});

test('Omega waits for a sustained rear approach, then turns its own hull to face the pilot', () => {
  let response = { heading: 0, rearSeconds: 0, tracking: false };
  const rear = Math.PI;
  const fps = 60;
  const framesToReact = Math.ceil(OMEGA_REAR_LOCK_SECONDS * fps);
  for (let i = 0; i < framesToReact - 1; i++) {
    response = advanceOmegaRearResponse(response, rear, 1 / fps, 2);
    assert.equal(response.heading, 0, 'boss must not turn while rear timer is pending');
    assert.equal(response.tracking, false);
  }
  response = advanceOmegaRearResponse(response, rear, 1 / fps, 2);
  assert.equal(response.tracking, true, 'remaining behind activates boss counterturn');
  assert.ok(response.heading > 0, 'boss starts rotating its own yaw');
  const initialGap = angleDiff(rear, response.heading);
  for (let i = 0; i < 480; i++) response = advanceOmegaRearResponse(response, rear, 1 / fps, 2);
  assert.ok(angleDiff(rear, response.heading) < initialGap);
  assert.equal(response.tracking, false, 'turn stops when the boss faces the pilot');
  assert.ok(angleDiff(rear, response.heading) < 0.1);
});

test('Omega rear timer resets on early escape and does not track the normal front', () => {
  let response = { heading: 0, rearSeconds: 0, tracking: false };
  for (let i = 0; i < 75; i++) response = advanceOmegaRearResponse(response, -Math.PI, 1 / 60);
  assert.ok(response.rearSeconds > 1);
  assert.equal(response.heading, 0);
  response = advanceOmegaRearResponse(response, 0.3, 1 / 60);
  assert.equal(response.rearSeconds, 0);
  assert.equal(response.tracking, false);
  for (let i = 0; i < 40; i++) response = advanceOmegaRearResponse(response, Math.PI, 1 / 60);
  assert.equal(response.heading, 0, 're-approach must wait through a fresh full rear window');
  assert.throws(() => advanceOmegaRearResponse(response, Math.PI, -1), RangeError);
});

test('Saturn stays motionless while ship/camera orbit and Omega independently rotates', () => {
  const scene = new T.Scene();
  const center = new T.Vector3(0, 57, -230);
  const frame = new T.Group();
  scene.add(frame);
  const saturn = new T.Object3D();
  saturn.position.set(200, 130, -900);
  frame.add(saturn);
  const ship = new T.Object3D();
  ship.position.set(0, 6, 9);
  scene.add(ship);
  const omega = new T.Object3D();
  omega.position.copy(center);
  scene.add(omega);
  const worldUp = new T.Vector3(0, 1, 0);
  let firstSaturn = null;
  const positions = [];
  for (const angle of [0, Math.PI / 3, Math.PI]) {
    frame.rotation.y = -angle;
    frame.position.copy(center).sub(center.clone().applyAxisAngle(worldUp, -angle));
    omega.rotation.y = 0.65 - angle;
    const expectedHeading = 0.65;
    withReactorOrbitPresentation(scene, center, angle, () => {
      scene.updateMatrixWorld(true);
      const planetPosition = saturn.getWorldPosition(new T.Vector3());
      if (!firstSaturn) firstSaturn = planetPosition;
      else
        assert.ok(
          planetPosition.distanceTo(firstSaturn) < 1e-8,
          'Saturn does not orbit the player',
        );
      positions.push(ship.getWorldPosition(new T.Vector3()));
      const worldQuaternion = omega.getWorldQuaternion(new T.Quaternion());
      const worldEuler = new T.Euler().setFromQuaternion(worldQuaternion, 'XYZ');
      assert.ok(angleDiff(worldEuler.y, expectedHeading) < 1e-8, 'only boss hull counterturns');
    });
    assert.equal(scene.rotation.y, 0, 'presentation restores scene transformation');
  }
  assert.ok(positions[0].distanceTo(positions[1]) > 30, 'ship actually orbits around the boss');
  assert.ok(positions[1].distanceTo(positions[2]) > 30);
});
