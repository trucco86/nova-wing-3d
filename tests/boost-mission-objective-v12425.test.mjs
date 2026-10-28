import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

test('first-sector BOOST objective stays in the top HUD until the required boost is exhausted', (t) => {
  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  const alert = h.elements.get('launchBoostNotice');
  const boost = h.elements.get('boostTouch');
  assert.equal(alert.hidden, true, 'never cover initial gameplay');
  h.advance(24);
  assert.equal(h.game.snapshot().orbitalLaunch.phase, 'boost');
  assert.equal(alert.hidden, false, 'persistent explicit cue during the objective');
  assert.equal(boost.classList.contains('launch-required'), true);
  h.key('ShiftLeft');
  h.advance(4);
  assert.equal(h.game.snapshot().orbitalLaunch.phase, 'atmosphere');
  assert.equal(alert.hidden, true, 'prompt clears automatically after required boost');
  assert.equal(boost.classList.contains('launch-required'), false);
});
