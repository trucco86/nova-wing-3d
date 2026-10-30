import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MECHA_HEAVY_FIRE,
  mechaShotDamage,
  mechaShotCooldown,
  mechaShotScale,
} from '../src/mecha-heavy-fire.js';
import { AUDIO_CUES } from '../src/audio-cues.js';

test('fighter preserves its original damage, cooldown and size', () => {
  assert.equal(mechaShotDamage(12), 12);
  assert.equal(mechaShotDamage(12, { robot: false, kind: 'charged' }), 12);
  assert.equal(mechaShotCooldown(0.2), 0.2);
  assert.equal(mechaShotScale(1.3), 1.3);
});

test('mecha heavy cannon hits much harder while trading rate of fire for power', () => {
  assert.equal(mechaShotDamage(10, { robot: true }), 23.5);
  assert.equal(mechaShotDamage(10, { robot: true, kind: 'charged' }), 21);
  assert.equal(mechaShotDamage(10, { robot: true, kind: 'precision' }), 70);
  assert.equal(mechaShotCooldown(0.2, true), 0.24);
  assert.equal(mechaShotScale(1, true), 1.6);
  const sustainedDpsMultiplier = MECHA_HEAVY_FIRE.pulseDamage / MECHA_HEAVY_FIRE.cadenceFactor;
  assert.ok(sustainedDpsMultiplier > 1.8 && sustainedDpsMultiplier < 2.1);
});

test('invalid inputs fail closed and cannot inject non-finite damage', () => {
  assert.equal(mechaShotDamage(Infinity, { robot: true }), 0);
  assert.equal(mechaShotDamage(-30, { robot: true }), 0);
  assert.equal(mechaShotCooldown(NaN, true), 0);
});

test('mecha audio has distinct layered cannon, charged, precision and impact cues', () => {
  const cannon = AUDIO_CUES.mechaShot;
  assert.ok(cannon.cooldown >= 0.12);
  assert.ok(cannon.tones.length >= 3 && cannon.noises.length >= 1);
  assert.ok(cannon.tones.some((tone) => tone.from > 800));
  assert.ok(cannon.tones.some((tone) => tone.from < 300));
  for (const cueName of ['mechaImpact', 'mechaPrecision', 'mechaChargeRelease']) {
    const cue = AUDIO_CUES[cueName];
    assert.ok(cue, cueName);
    assert.ok(cue.tones.length >= 2, cueName);
    assert.ok(cue.noises.length >= 1, cueName);
    assert.ok(cue.tones.every((tone) => tone.gain > 0 && tone.gain <= 0.1), cueName);
  }
  assert.notDeepEqual(AUDIO_CUES.shot.tones, cannon.tones);
});
