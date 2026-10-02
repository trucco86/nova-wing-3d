import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
test('mapped keys consume down/up/repeat in flight while browser modifiers stay outside game', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  for (const type of ['keydown', 'keyup'])
    for (const repeat of [false, true]) {
      let cancelled = false;
      h.window.emit(type, {
        code: 'Space',
        repeat,
        preventDefault() {
          cancelled = true;
        },
      });
      assert.ok(cancelled);
    }
  let cancelled = false;
  h.window.emit('keydown', {
    code: 'Space',
    ctrlKey: true,
    preventDefault() {
      cancelled = true;
    },
  });
  h.advance(0.3);
  assert.equal(cancelled, false);
  assert.equal(h.game.snapshot().entities.shots, 0);
});
test('long press gestures are consumed on flight surfaces and HUD, not menu or after destroy', () => {
  const h = harness();
  let cancelled = false;
  const e = {
    preventDefault() {
      cancelled = true;
    },
  };
  h.document.emit('selectstart', e);
  assert.equal(cancelled, false);
  h.game.start();
  for (const type of ['selectstart', 'contextmenu', 'dragstart']) {
    cancelled = false;
    h.document.emit(type, e);
    assert.ok(cancelled);
  }
  for (const id of ['touch', 'game'])
    for (const type of ['touchstart', 'touchmove']) {
      cancelled = false;
      h.elements.get(id).emit(type, e);
      assert.ok(cancelled);
    }
  h.close();
  cancelled = false;
  h.document.emit('selectstart', e);
  assert.equal(cancelled, false);
});
