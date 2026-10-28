import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TRACK, TRACKS, MUSIC_MODES, createMusic, musicEnergyProfile } from '../src/audio.js';

function offlineMusicContext() {
  const sources = new Set();
  const events = [];
  const param = () => ({
    value: 0,
    setValueAtTime(value) {
      this.value = value;
    },
    exponentialRampToValueAtTime(value) {
      this.value = value;
    },
  });
  const node = () => ({
    gain: param(),
    frequency: param(),
    Q: param(),
    pan: param(),
    threshold: param(),
    knee: param(),
    ratio: param(),
    attack: param(),
    release: param(),
    connect() {},
    disconnect() {},
  });
  const context = {
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    createGain: node,
    createBiquadFilter: node,
    createDynamicsCompressor: node,
    createStereoPanner: node,
    createBuffer: (_channels, length) => ({ getChannelData: () => new Float32Array(length) }),
    createOscillator() {
      const source = {
        ...node(),
        type: 'sine',
        onended: null,
        start() {
          events.push({
            kind: 'note',
            time: context.currentTime,
            type: this.type,
            frequency: this.frequency.value,
          });
        },
        stop(at = context.currentTime) {
          this.endAt = at;
          sources.add(this);
        },
      };
      return source;
    },
    createBufferSource() {
      const source = {
        ...node(),
        onended: null,
        start() {
          events.push({ kind: 'noise', time: context.currentTime });
        },
        stop(at = context.currentTime) {
          this.endAt = at;
          sources.add(this);
        },
      };
      return source;
    },
  };
  function advance(seconds, music) {
    for (let i = 0; i < seconds * 20; i++) {
      context.currentTime += 0.05;
      for (const source of [...sources]) {
        if (source.endAt <= context.currentTime) {
          source.onended?.();
          sources.delete(source);
        }
      }
      music.update(0.05);
    }
  }
  return { context, events, advance };
}

test('combat score accelerates above the prior ambient soundtrack without losing bass', () => {
  assert.ok(TRACKS.every((track) => track.bpm >= 130));
  assert.equal(BOSS_TRACK.bpm, 150);
  assert.ok(MUSIC_MODES.includes('enraged'));
  assert.ok(musicEnergyProfile('boss').bpm > musicEnergyProfile('sector', 0).bpm);
  assert.ok(musicEnergyProfile('collapse').bpm >= 160);
  assert.ok(musicEnergyProfile('enraged').intensity > musicEnergyProfile('menu').intensity);
  assert.ok(musicEnergyProfile('sector', 5).highPulse);
  assert.equal(musicEnergyProfile('menu').highPulse, false);
});

test('driving soundtrack adds articulated melodic mids and percussion while retaining low-end', () => {
  const audio = offlineMusicContext();
  const music = createMusic(audio.context);
  music.start(0, 'menu');
  audio.advance(6, music);
  const menuEvents = audio.events.length;
  music.start(0, 'sector');
  const from = audio.events.length;
  audio.advance(6, music);
  const combatEvents = audio.events.slice(from);
  assert.ok(
    combatEvents.length > menuEvents * 1.25,
    'combat must sound denser and more energetic than the menu theme',
  );
  assert.ok(
    combatEvents.filter((event) => event.kind === 'noise').length >= 30,
    'sustained rhythmic high percussion accompanies kick and snare',
  );
  assert.ok(
    combatEvents.some((event) => event.kind === 'note' && event.frequency < 80),
    'retain real sub-bass frequencies',
  );
  assert.ok(
    combatEvents.some((event) => event.kind === 'note' && event.frequency > 400),
    'lead melody has presence beyond low rumble on smaller speakers',
  );
  assert.ok(music.snapshot().bpm >= 130);
  music.start(0, 'boss');
  assert.ok(music.snapshot().bpm >= 150);
  music.start(0, 'enraged');
  assert.ok(music.snapshot().bpm > 160);
  music.setEnabled(false);
  assert.equal(music.snapshot().voices, 0);
  music.destroy();
  assert.equal(music.snapshot().voices, 0);
});

test('music volume is bounded, can mute completely and keeps original low-end body', () => {
  const a = offlineMusicContext();
  const music = createMusic(a.context);
  music.start(2);
  assert.equal(music.snapshot().playing, true);
  music.setVolume(0);
  music.setEnabled(false);
  assert.equal(music.snapshot().enabled, false);
  music.setVolume(0.5);
  music.setEnabled(true);
  a.advance(1, music);
  assert.ok(a.events.length > 0);
  music.pause();
  assert.equal(music.snapshot().playing, false);
  music.destroy();
});
