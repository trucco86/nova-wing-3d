import test from 'node:test';
import assert from 'node:assert/strict';
import { configurePlaybackAudioSession } from '../src/audio-session.js';
import { harness } from './harness.mjs';

test('game requests playback audio for the speaker only after a player action', (t) => {
  const h = harness();
  t.after(() => h.close());
  const session = { type: 'ambient' };
  h.window.navigator = { audioSession: session };
  assert.equal(session.type, 'ambient', 'the menu must not force sound on');
  h.game.start();
  assert.equal(session.type, 'playback');
  assert.equal(h.calls.audio, 1, 'keep one shared Web Audio context');
  assert.ok(h.calls.audioResume > 0);
});

test('older browsers and unavailable audio session APIs keep normal game audio', (t) => {
  assert.equal(configurePlaybackAudioSession(undefined), false);
  assert.equal(configurePlaybackAudioSession({}), false);
  assert.equal(
    configurePlaybackAudioSession({
      get audioSession() {
        throw new Error('unavailable');
      },
    }),
    false,
  );
  assert.equal(
    configurePlaybackAudioSession({
      audioSession: {
        set type(_value) {
          throw new Error('read-only');
        },
      },
    }),
    false,
  );
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.calls.audio, 1, 'Web Audio starts without audioSession support');
});
