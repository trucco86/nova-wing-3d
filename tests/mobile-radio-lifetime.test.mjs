import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

test('touch pilot radio retains its real message until after the sector briefing', (t) => {
  const h = harness({ coarsePointer: true });
  t.after(() => h.close());
  h.game.start();
  const radio = h.elements.get('comms');
  const initial = h.elements.get('message').textContent;
  assert.ok(initial.length > 10);
  h.advance(3.3);
  assert.equal(h.document.body.classList.contains('stage-intro'), false);
  assert.equal(h.elements.get('message').textContent, initial);
  assert.equal(radio.classList.contains('active'), true, 'hidden radio must not expire');
  h.advance(2.8);
  assert.equal(radio.classList.contains('active'), false, 'radio still expires normally');
});

test('touch briefing and pending radio freeze during pause and reset on sector restart', (t) => {
  const h = harness({ coarsePointer: true });
  t.after(() => h.close());
  h.game.start();
  h.advance(1);
  h.game.pause();
  h.advance(10);
  assert.equal(h.document.body.classList.contains('stage-intro'), true);
  assert.equal(h.elements.get('comms').classList.contains('active'), true);
  h.elements.get('pauseResume').onclick();
  h.advance(2.3);
  assert.equal(h.document.body.classList.contains('stage-intro'), false);
  assert.equal(h.elements.get('comms').classList.contains('active'), true);
  h.game.pause();
  h.elements.get('pauseRestart').onclick();
  h.elements.get('pauseConfirmOk').onclick();
  assert.equal(h.document.body.classList.contains('stage-intro'), true);
  h.advance(3.3);
  assert.equal(h.elements.get('comms').classList.contains('active'), true);
});

for (const options of [{}, { coarsePointer: true, nativeLifecycle: true }]) {
  test(
    'desktop/native radio keeps its existing three-second lifetime ' + JSON.stringify(options),
    (t) => {
      const h = harness(options);
      t.after(() => h.close());
      h.game.start();
      h.advance(3.3);
      assert.equal(h.elements.get('comms').classList.contains('active'), false);
    },
  );
}
