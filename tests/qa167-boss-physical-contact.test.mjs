import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_STRIKE_CONTACT_SECONDS,
  bossMeleeContactReady,
  bossMeleeHit,
  bossMeleePose,
  chooseBossIntent,
} from '../src/boss-combat-ai.js';

const intentFor = (kind) => ({ kind, warning: 2.2, targetX: 0, targetY: 12, dodgeRadius: 11 });

test('only authored full-body charges move the boss toward the camera', () => {
  for (const kind of ['bite', 'drill-ram', 'plasma-dive', 'rok-ram', 'stingray-sting']) {
    const pose = bossMeleePose(intentFor(kind), 'attack', 0.7);
    assert.ok(pose.lunge > 0, kind + ' should physically charge');
    assert.ok(pose.track > 0, kind + ' should track the announced target');
  }
  for (const kind of [
    'claw-swipe',
    'hammer-slam',
    'tentacle-grab',
    'tentacle-sweep',
    'ice-quake',
    'cryo-pincer',
    'rok-pincer',
    'stingray-scissor',
    'drill-crosscut',
    'solar-sweep',
    'reactor-vent',
    'orion-gravity-pulse',
    'orion-iris-shear',
    'hydra-two-head-crossfire',
    'marvin-rear-thruster-sweep',
  ]) {
    const pose = bossMeleePose(intentFor(kind), 'attack', 0.7);
    assert.equal(pose.lunge, 0, kind + ' must not fake a strike by growing the whole boss');
    assert.equal(pose.track, 0, kind + ' must use its articulated part, not body translation');
  }
});

test('logical boss contact is at the visible animation apex and never during windup', () => {
  const intent = intentFor('cryo-pincer');
  assert.equal(BOSS_STRIKE_CONTACT_SECONDS, 0.7);
  assert.equal(bossMeleeContactReady(intent, 'windup', 2.2), false);
  assert.equal(bossMeleeContactReady(intent, 'attack', 0.69), false);
  assert.equal(bossMeleeContactReady(intent, 'attack', 0.7), true);
  assert.equal(bossMeleeContactReady(intent, 'attack', 1.2), true);
  assert.equal(bossMeleeContactReady(intentFor('barrage'), 'attack', 0.8), false);
  assert.equal(bossMeleeContactReady(null, 'attack', 0.8), false);
  assert.equal(bossMeleeContactReady(intent, 'attack', Number.NaN), false);
  assert.equal(bossMeleePose(intent, 'windup', 1.0).lunge, 0);
  assert.ok(bossMeleePose(intent, 'attack', 0.7).claw > 0.8);
  // Simulated dropped frames must not skip the one-shot logical hit gate.
  assert.equal(bossMeleeContactReady(intent, 'attack', 0.94), true);
});

test('pilot gets a real dodge window; attack area remains fixed after preparation', () => {
  const intent = chooseBossIntent({
    sector: 5,
    cycle: 1,
    phase: 2,
    playerX: 2,
    playerY: 12,
  });
  assert.equal(bossMeleeHit(intent, { x: 2, y: 12 }), true);
  assert.equal(bossMeleeHit(intent, { x: 82, y: 48 }), false);
  assert.deepEqual([intent.targetX, intent.targetY], [2, 12]);
  assert.ok(Object.isFrozen(intent), 'telegraphed aim is latched once');
});

test('repeated early phase boss attacks alternate without changing broken hardware rules', () => {
  const first = chooseBossIntent({ sector: 0, cycle: 1, phase: 1, playerY: 12 });
  assert.equal(first.kind, 'rok-pincer');
  const varied = chooseBossIntent({
    sector: 0,
    cycle: 1,
    phase: 1,
    playerY: 12,
    previousKind: first.kind,
  });
  assert.equal(varied.kind, 'rok-ram');
  const another = chooseBossIntent({
    sector: 5,
    cycle: 1,
    phase: 1,
    playerY: 25,
    previousKind: 'cryo-pincer',
  });
  assert.equal(another.kind, 'ice-quake');
  const powerless = chooseBossIntent({
    sector: 3,
    cycle: 1,
    phase: 3,
    generators: [false, false],
    previousKind: 'barrage',
  });
  assert.equal(powerless.kind, 'barrage', 'do not resurrect destroyed weapons');
});
