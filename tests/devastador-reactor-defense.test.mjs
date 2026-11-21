import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVASTADOR_SENTINEL_COUNT,
  DEVASTADOR_DEFENSE_WARNING,
  createDevastadorDefenseState,
  devastadorDefenseOnline,
  advanceDevastadorDefense,
} from '../src/devastador-reactor-defense.js';
import {
  createDevastadorSabotageCore,
  updateDevastadorSabotageCore,
} from '../src/devastador-sabotage.js';
import { disposeBoss } from '../src/bosses.js';
import { AUDIO_CUES } from '../src/audio-cues.js';
import { harness } from './harness.mjs';

const parts = () => [
  ...Array.from({ length: 4 }, () => ({ type: 'power', hp: 70 })),
  ...Array.from({ length: 2 }, () => ({ type: 'coolant', hp: 95 })),
  ...Array.from({ length: 2 }, () => ({ type: 'drive', hp: 115 })),
];

test('the wall guard has a telegraphed charge before firing at a latched position', () => {
  let state = createDevastadorDefenseState();
  assert.equal(advanceDevastadorDefense(state, { age: 3, parts: parts() }).event, null);
  const warn = advanceDevastadorDefense(state, {
    age: 4.5, parts: parts(), playerX: 15, playerY: 18, playerZ: 30,
  });
  assert.deepEqual(warn.event, {
    type: 'warning', kind: 'sentinels', indices: [0, 1], seconds: DEVASTADOR_DEFENSE_WARNING,
  });
  state = warn.state;
  assert.equal(advanceDevastadorDefense(state, { age: 5.3, parts: parts() }).event, null);
  const fire = advanceDevastadorDefense(state, {
    age: 5.76, parts: parts(), playerX: -38, playerY: -15, playerZ: -60,
  });
  assert.deepEqual(fire.event, {
    type: 'fire', kind: 'sentinels', indices: [0, 1],
    target: { x: 15, y: 18, z: 30 },
  });
  assert.equal(fire.state.fired, 1);
  assert.equal(fire.state.armed, null);
  assert.ok(fire.state.nextAt > 8);
});

test('destroying a regulator disarms its linked wall robot immediately', () => {
  const damage = parts();
  damage[0].hp = 0;
  assert.deepEqual(devastadorDefenseOnline(damage).sentinels, [1, 2, 3]);
  damage[1].hp = 0;
  damage[2].hp = 0;
  damage[3].hp = 0;
  assert.deepEqual(devastadorDefenseOnline(damage).sentinels, []);
  assert.equal(devastadorDefenseOnline(damage).pulse, true);
  for (const part of damage) part.hp = 0;
  assert.equal(devastadorDefenseOnline(damage).systems, 0);
  assert.equal(advanceDevastadorDefense(createDevastadorDefenseState(), {
    age: 50, parts: damage,
  }).event, null);
});

test('breaking the final powered robot during its windup cancels the attack', () => {
  const damage = parts();
  for (let i = 1; i < 4; i++) damage[i].hp = 0;
  let state = advanceDevastadorDefense(createDevastadorDefenseState(), {
    age: 4.5, parts: damage,
  }).state;
  assert.deepEqual(state.armed.indices, [0]);
  damage[0].hp = 0;
  const event = advanceDevastadorDefense(state, { age: 5.2, parts: damage });
  assert.deepEqual(event.event, { type: 'cancel', kind: 'sentinels' });
  assert.equal(event.state.armed, null);
});

test('reactor adds a separate plasma pulse every third volley, not endless identical attacks', () => {
  let state = createDevastadorDefenseState();
  const kinds = [];
  for (let i = 0; i < 6; i++) {
    const warn = advanceDevastadorDefense(state, { age: 10 + i * 8, parts: parts(), phase: 2 });
    kinds.push(warn.event.kind);
    const fire = advanceDevastadorDefense(warn.state, {
      age: 10 + i * 8 + DEVASTADOR_DEFENSE_WARNING + 0.01,
      parts: parts(),
      phase: 2,
    });
    assert.equal(fire.event.type, 'fire');
    state = fire.state;
  }
  assert.deepEqual(kinds, ['sentinels', 'sentinels', 'pulse', 'sentinels', 'sentinels', 'pulse']);
});

test('special heavy robot busts stay attached to the walls and use visible arm muzzles', () => {
  const model = createDevastadorSabotageCore();
  const sentinels = model.userData.sentinels;
  assert.equal(sentinels.length, DEVASTADOR_SENTINEL_COUNT);
  for (const sentinel of sentinels) {
    assert.equal(sentinel.mount.parent, model.userData.grandHall);
    assert.ok(Math.hypot(sentinel.mount.position.x, sentinel.mount.position.z) >= 220);
    assert.equal(sentinel.upper.name, 'sentinel-deploying-upper-body');
    assert.equal(sentinel.arms.length, 2);
    assert.ok(sentinel.muzzle.name.includes('devastador-wall-sentinel-muzzle'));
    assert.equal(sentinel.mount.getObjectByName('sentinel-legs'), undefined);
  }
  updateDevastadorSabotageCore(model, { time: 10, defense: {
    armed: { kind: 'sentinels', indices: [0], fireAt: 11, target: { x: 0, y: 0, z: 0 } },
  } });
  assert.equal(sentinels[0].upper.visible, true);
  assert.ok(sentinels[0].upper.position.z > -3);
  assert.ok(sentinels[0].arms[0].muzzle.scale.x > 1.3);
  model.userData.parts[0].hp = 0;
  updateDevastadorSabotageCore(model, { time: 12 });
  assert.equal(sentinels[0].upper.visible, false);
  assert.equal(sentinels[1].upper.visible, true);
  disposeBoss(model);
});

test('stage-04 QA boss produces real wall-defense projectiles and exposes live state', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  h.advance(7, 0.1);
  const snapshot = h.game.snapshot();
  assert.equal(snapshot.sector, 4);
  assert.ok(snapshot.sabotage?.defense?.fired >= 1, 'wall guns must actually fire');
  assert.ok(snapshot.hostileProjectilePool.created > 0, 'projectiles are not decoration');
  assert.deepEqual(snapshot.sabotage.defense.online, [0, 1, 2, 3]);
  assert.equal(snapshot.bossIntent, null, 'generic boss AI remains disabled');
});

test('shot SFX avoid six-voice long arcade beeps and have distinct reactor cues', () => {
  for (const cue of ['shot', 'shotAlt', 'mechaShot', 'mechaShotAlt']) {
    const sound = AUDIO_CUES[cue];
    assert.ok(sound, cue);
    assert.ok(sound.tones.length + (sound.noises?.length ?? 0) <= 4, cue);
    assert.ok(Math.max(...sound.tones.map((t) => t.duration)) <= 0.25, cue);
  }
  for (const cue of ['reactorWarning', 'reactorVolley', 'reactorPulse']) {
    assert.ok(AUDIO_CUES[cue].tones.length >= 2, cue);
    assert.ok(AUDIO_CUES[cue].cooldown > 0.5, cue);
  }
});
