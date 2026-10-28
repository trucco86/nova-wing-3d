import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_CUES, createAudioCues } from '../src/audio-cues.js';
import { harness } from './harness.mjs';

test('transformations, ignition and ship impact have distinct layered mechanical signatures', () => {
  for (const name of ['transformRobot', 'transformShip', 'boostIgnition', 'shipImpact']) {
    assert.ok(AUDIO_CUES[name], name + ' must have its own audible cue');
    assert.ok(
      AUDIO_CUES[name].noises?.length > 0,
      name + ' needs a textured transient, not only a beep',
    );
  }
  assert.notDeepEqual(AUDIO_CUES.transformRobot, AUDIO_CUES.transformShip);
  assert.ok(AUDIO_CUES.shipImpact.tones.some((tone) => tone.to <= 80));
});

test('accepted game actions trigger transformation, ignition and impact audio; rejected actions stay silent', (t) => {
  const h = harness();
  t.after(() => h.close());
  assert.equal(h.game.snapshot().audio, null, 'menu must not unlock audio automatically');
  h.game.start();
  h.key('KeyT');
  h.key('KeyT', false);
  assert.equal(h.game.snapshot().audio.lastCue, 'transformRobot');
  const count = h.game.snapshot().audio.voices;
  h.key('KeyT');
  h.key('KeyT', false);
  assert.equal(
    h.game.snapshot().audio.voices,
    count,
    'cooldown rejects both transformation and its audio',
  );
  h.advance(3.2);
  h.key('KeyT');
  h.key('KeyT', false);
  assert.equal(h.game.snapshot().audio.lastCue, 'transformShip');
  h.game.damage(10);
  assert.equal(h.game.snapshot().audio.lastCue, 'shipImpact');
  const impact = h.game.snapshot().audio.voices;
  h.game.damage(10);
  assert.equal(h.game.snapshot().audio.voices, impact, 'invulnerability rejects false impacts');
  h.key('ShiftLeft');
  h.advance(0.05);
  assert.equal(h.game.snapshot().audio.lastCue, 'boostIgnition');
  const boosting = h.game.snapshot().audio.voices;
  h.advance(0.4);
  assert.equal(
    h.game.snapshot().audio.voices,
    boosting,
    'held BOOST cannot replay ignition every frame',
  );
  h.game.pause();
  const paused = h.game.snapshot().audio;
  assert.equal(
    paused.voices,
    0,
    'pause cancels old effects instead of replaying their tails on resume',
  );
  h.advance(2);
  assert.deepEqual(h.game.snapshot().audio, paused);
  assert.equal(h.calls.audio, 1);
  h.game.pause();
  h.elements.get('sound').onclick();
  h.game.fire();
  assert.equal(h.game.snapshot().audio.voices, 0, 'SOM OFF cancels pending effects');
});

test('continuous propulsion is a lifecycle-controlled layer, never a per-frame one-shot', () => {
  const context = {
    destination: {},
    createGain: () => ({ gain: { value: 1 }, connect() {}, disconnect() {} }),
  };
  const cues = createAudioCues(context);
  assert.equal(typeof cues.setFlight, 'function');
  cues.setFlight({ active: false });
  assert.equal(cues.snapshot().engineActive, false);
  cues.destroy();
});

test('propulsion reuses its loop and automation, while important impacts survive a saturated effects pool', () => {
  let sources = 0,
    buffers = 0,
    automation = 0,
    stops = 0;
  const param = () => ({
    value: 0,
    setValueAtTime(value) {
      this.value = value;
    },
    exponentialRampToValueAtTime(value) {
      this.value = value;
    },
    setTargetAtTime(value) {
      this.value = value;
      automation++;
    },
    cancelScheduledValues() {},
  });
  const node = () => ({
    gain: param(),
    frequency: param(),
    Q: param(),
    playbackRate: param(),
    connect() {},
    disconnect() {},
    start() {},
    stop() {
      stops++;
    },
  });
  const context = {
    currentTime: 0,
    sampleRate: 8000,
    state: 'running',
    destination: {},
    createGain: node,
    createBiquadFilter: node,
    createOscillator() {
      sources++;
      return node();
    },
    createBufferSource() {
      sources++;
      return node();
    },
    createBuffer(_channels, length) {
      buffers++;
      return { getChannelData: () => new Float32Array(length) };
    },
  };
  const cues = createAudioCues(context);
  cues.setFlight({ active: true });
  const started = sources,
    scheduled = automation;
  for (let i = 0; i < 120; i++) {
    context.currentTime += 1 / 60;
    cues.setFlight({ active: true });
  }
  assert.equal(sources, started, 'steady flight never allocates more sources');
  assert.equal(automation, scheduled, 'steady flight never floods AudioParam automation');
  assert.equal(buffers, 1, 'one cached noise buffer powers the continuous turbine');
  cues.setFlight({ active: true, boosting: true });
  assert.equal(cues.snapshot().engineMode, 'boost');
  assert.equal(sources, started);
  for (let i = 0; i < 40; i++) {
    context.currentTime += 0.1;
    cues.play('shot');
  }
  assert.ok(cues.snapshot().voices <= 32);
  assert.equal(cues.play('shipImpact'), true, 'ship damage has priority over old weapon tails');
  assert.equal(cues.snapshot().lastCue, 'shipImpact');
  cues.setVolume(0);
  assert.equal(cues.snapshot().voices, 0);
  assert.equal(cues.snapshot().engineActive, false);
  assert.equal(cues.play('shot'), false);
  cues.destroy();
  assert.ok(stops >= 2, 'destroy stops both loop sources as well as transient voices');
  assert.equal(cues.snapshot().destroyed, true);
});
