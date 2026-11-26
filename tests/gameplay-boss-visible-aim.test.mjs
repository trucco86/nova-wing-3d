import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleAim, applyVisibleAim } from '../tools/gameplay-boss-visible-aim.mjs';

const reticle = { visible: true, x: 500, y: 300 };
const cue = (id, x, y, state = 'open', visible = true) => ({ id, x, y, state, visible });
const screen = (cues) => ({ width: 1000, height: 600, reticle, cues });

test('selects nearest visible open weakpoint, ignoring armor and hidden labels', () => {
  const result = visibleAim(
    screen([cue('armor', 500, 300, 'armored'), cue('hidden', 500, 300, 'open', false), cue('far', 900, 400), cue('near', 580, 250)]),
  );
  assert.equal(result.id, 'near');
  assert.equal(result.status, 'adjust');
  assert.deepEqual([result.x, result.y], [1, 1]);
});

test('deadzone tolerates small normalized screen errors', () => {
  const result = visibleAim(screen([cue('near', 520, 310)]));
  assert.equal(result.status, 'aligned');
  assert.deepEqual([result.x, result.y], [0, 0]);
});

test('screen downward movement maps to negative game Y', () => {
  const result = visibleAim(screen([cue('lower', 430, 370)]));
  assert.deepEqual([result.x, result.y], [-1, -1]);
});

test('unavailable or armored targets do not invent a trajectory', () => {
  assert.equal(visibleAim(screen([cue('armor', 510, 310, 'armored')])).status, 'no-visible-open-target');
  assert.equal(visibleAim({ ...screen([]), width: 0 }).status, 'unavailable');
  assert.equal(visibleAim({ ...screen([]), reticle: { visible: false } }).status, 'unavailable');
});

test('aiming never overrides a dodge or tactical power', () => {
  const aim = { status: 'adjust', x: -1, y: 1 };
  const dodge = { fire: false, x: 1, y: 0, action: 'dodge' };
  const special = { fire: false, x: 0, y: 0, action: 'special-plasma', special: 'plasma' };
  assert.equal(applyVisibleAim(dodge, aim), dodge);
  assert.equal(applyVisibleAim(special, aim), special);
  assert.deepEqual(applyVisibleAim({ fire: true, x: 0, y: 0 }, aim), {
    fire: false,
    x: -1,
    y: 1,
    action: 'aim-weakpoint',
  });
});
