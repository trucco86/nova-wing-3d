import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIO_CUES } from '../src/audio-cues.js';
import { DEFAULT_SETTINGS, readSettings } from '../src/ui-preferences.js';

test('new player mix is audible, bounded and keeps existing saved preferences', () => {
  assert.equal(DEFAULT_SETTINGS.music, 0.8);
  assert.equal(DEFAULT_SETTINGS.sfx, 0.85);
  assert.deepEqual(
    { music: readSettings({ music: 0.2 }).music, sfx: readSettings({ sfx: 0.4 }).sfx },
    { music: 0.2, sfx: 0.4 },
  );
});

test('ship laser uses layered transient, energy body and mobile midrange texture', () => {
  const cue = AUDIO_CUES.shot;
  assert.ok(cue.cooldown >= 0.08);
  assert.ok(cue.tones.length >= 3);
  assert.ok(cue.tones.some((tone) => tone.from > 900 && tone.duration < 0.1));
  assert.ok(cue.tones.some((tone) => tone.from < 350 && tone.duration > 0.1));
  assert.ok(cue.noises.some((noise) => noise.filter >= 1500));
  assert.ok(cue.tones.every((tone) => tone.gain > 0 && tone.gain < 0.1));
});
