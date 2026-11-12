import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_CUES, createAudioCues } from '../src/audio-cues.js';

function fakeAudio() {
  const events = { sources: [], stopped: 0, params: [] };
  const param = () => ({
    value: 0,
    setValueAtTime(value) {
      this.value = value;
      events.params.push(['set', value]);
    },
    exponentialRampToValueAtTime(value) {
      this.value = value;
    },
    setTargetAtTime(value) {
      this.value = value;
      events.params.push(['target', value]);
    },
    cancelScheduledValues() {},
  });
  const node = (kind = 'utility') => ({
    kind,
    frequency: param(),
    gain: param(),
    Q: param(),
    playbackRate: param(),
    threshold: param(),
    knee: param(),
    ratio: param(),
    attack: param(),
    release: param(),
    connect() {},
    disconnect() {},
    start() {},
    stop() {
      events.stopped++;
    },
  });
  const context = {
    state: 'running',
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    createGain: () => node(),
    createBiquadFilter: () => node(),
    createDynamicsCompressor: () => node(),
    createOscillator() {
      const n = node('osc');
      events.sources.push(n);
      return n;
    },
    createBufferSource() {
      const n = node('noise');
      events.sources.push(n);
      return n;
    },
    createBuffer(_channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    },
  };
  return { context, events };
}

test('QA111: shot, robot cannon and plasma use layered cinematic attack rather than one pitched beep', () => {
  const shot = AUDIO_CUES.shot;
  assert.ok(shot.cooldown >= 0.08, 'rapid fire cannot become a continuous shrill tone');
  assert.ok(shot.tones.some((x) => x.wave === 'sawtooth' && x.duration < 0.07));
  assert.ok(shot.tones.some((x) => x.wave === 'triangle' && x.duration >= 0.14));
  assert.ok(shot.tones.some((x) => x.wave === 'sine' && x.to <= 70));
  assert.ok(shot.noises.some((x) => x.color === 'brown' && x.duration >= 0.12));
  assert.ok(AUDIO_CUES.mechaShot.tones.some((x) => x.to <= 50 && x.duration >= 0.24));
  assert.ok(AUDIO_CUES.plasmaRelease.tones.some((x) => x.to <= 40 && x.duration > 0.4));
  assert.ok(AUDIO_CUES.plasmaRelease.noises.some((x) => x.duration >= 0.45));
  assert.ok(AUDIO_CUES.plasmaCharge.noises.some((x) => x.attack >= 0.09));
  for (const name of ['shot', 'mechaShot', 'plasmaCharge', 'plasmaRelease']) {
    const cue = AUDIO_CUES[name];
    assert.ok(
      cue.tones.length + cue.noises.length <= 6,
      'reserve voices for music and concurrent battle',
    );
    for (const layer of [...cue.tones, ...cue.noises])
      assert.ok(
        layer.gain > 0 && layer.gain < 0.2,
        'avoid a clipping-prone single loud oscillator',
      );
  }
});

test('QA111: real charge meter drives ONE rising plasma engine and stops cleanly on release, mute and pause', () => {
  const { context, events } = fakeAudio();
  const cues = createAudioCues(context);
  cues.setCharge({ active: true, progress: 0.12 });
  assert.equal(cues.snapshot().chargeActive, true);
  const activeSources = events.sources.length;
  assert.equal(activeSources, 3, 'one bass, one filtered metallic layer and one noise source');
  const bass = events.sources.find((n) => n.kind === 'osc');
  const initial = bass.frequency.value;
  for (let i = 1; i <= 20; i++) {
    context.currentTime += 0.05;
    cues.setCharge({ active: true, progress: Math.min(1, 0.12 + i * 0.05) });
  }
  assert.equal(
    events.sources.length,
    activeSources,
    'do not allocate a fresh oscillator each frame',
  );
  assert.ok(bass.frequency.value > initial, 'plasma gains audible pressure while charging');
  assert.ok(cues.snapshot().chargeProgress >= 0.9);
  cues.setCharge({ active: false });
  assert.equal(cues.snapshot().chargeActive, false);
  const targets = events.params.filter((entry) => entry[0] === 'target').slice(-3);
  assert.deepEqual(
    targets.map((x) => x[1]),
    [0, 0, 0],
    'release silences all charge layers',
  );
  cues.setCharge({ active: true, progress: 0.3 });
  assert.equal(events.sources.length, activeSources, 'reuse charge synth when a new hold begins');
  cues.silence();
  assert.equal(cues.snapshot().chargeActive, false);
  cues.setCharge({ active: true, progress: 0.4 });
  cues.setVolume(0);
  assert.equal(cues.snapshot().chargeActive, false);
  cues.setCharge({ active: true, progress: 0.8 });
  assert.equal(cues.snapshot().chargeActive, false, 'SFX slider at zero makes no sound');
  cues.setVolume(1);
  cues.setEnabled(false);
  cues.setCharge({ active: true, progress: 0.8 });
  assert.equal(cues.snapshot().chargeActive, false);
  cues.destroy();
  assert.ok(events.stopped >= 3, 'destroy stops all charge sources');
  assert.equal(cues.snapshot().voices, 0);
});

test('QA111: repeated shots rotate slight deterministic pitch without stacking endless sources', () => {
  const { context, events } = fakeAudio();
  const cues = createAudioCues(context);
  assert.equal(cues.play('shot'), true);
  const first = events.sources.filter((node) => node.kind === 'osc').map((n) => n.frequency.value);
  assert.equal(first.length, 4, 'the cannon includes its delayed pressure rebound layer');
  assert.ok(
    AUDIO_CUES.shot.tones.some(
      (tone) => tone.delay >= 0.04 && tone.duration >= 0.24 && tone.to <= 110,
    ),
    'the fourth oscillator must actually sustain the audible post-attack body',
  );
  assert.equal(cues.play('shot'), false, 'rapid duplicate gets suppressed');
  context.currentTime += 0.09;
  assert.equal(cues.play('shot'), true);
  const second = events.sources
    .filter((node) => node.kind === 'osc')
    .slice(-3)
    .map((n) => n.frequency.value);
  assert.notDeepEqual(first, second, 'neighboring impacts have a subtle different character');
  for (let i = 0; i < 30; i++) {
    context.currentTime += 0.09;
    cues.play('shot');
  }
  assert.ok(cues.snapshot().voices <= 32);
  cues.setEnabled(false);
  assert.equal(cues.snapshot().voices, 0, 'mute silences all tails immediately');
  cues.destroy();
});
