import assert from 'node:assert/strict';
import test from 'node:test';
import { createHapticFeedback } from '../src/haptic-feedback.js';

test('unsupported iPhone browser never advertises or invents vibration', () => {
  const haptics = createHapticFeedback({ navigator: {} });
  assert.equal(haptics.kind, 'unsupported');
  assert.equal(haptics.available, false);
  assert.equal(haptics.pulse(45), false);
});

test('supported Android web vibration uses bounded hardware durations', () => {
  const durations = [];
  const haptics = createHapticFeedback({
    navigator: {
      vibrate(duration) {
        durations.push(duration);
        return true;
      },
    },
  });
  assert.equal(haptics.kind, 'web');
  assert.equal(haptics.available, true);
  assert.equal(haptics.pulse(70), true);
  assert.equal(haptics.pulse(30000), true);
  assert.deepEqual(durations, [70, 250]);
});

test('refused or failed browser feedback never crashes the game', () => {
  assert.equal(
    createHapticFeedback({ navigator: { vibrate: () => false } }).pulse(45),
    false,
  );
  assert.equal(
    createHapticFeedback({
      navigator: {
        vibrate() {
          throw Error('Not allowed');
        },
      },
    }).pulse(45),
    false,
  );
});

test('native haptics adapter activates only when installed and native', async () => {
  const pulses = [];
  const plugin = {
    vibrate({ duration }) {
      pulses.push(duration);
      return Promise.resolve();
    },
  };
  const native = createHapticFeedback({
    navigator: {},
    Capacitor: {
      isNativePlatform: () => true,
      Plugins: { Haptics: plugin },
    },
  });
  assert.equal(native.kind, 'native');
  assert.equal(native.pulse(45), true);
  assert.deepEqual(pulses, [45]);
  const webOnly = createHapticFeedback({
    navigator: {},
    Capacitor: {
      isNativePlatform: () => false,
      Plugins: { Haptics: plugin },
    },
  });
  assert.equal(webOnly.available, false);
  await Promise.resolve();
});
