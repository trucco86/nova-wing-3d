import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

function monitor(node, field) {
  let value = node[field];
  let mutations = 0;
  Object.defineProperty(node, field, {
    configurable: true,
    get() { return value; },
    set(next) { mutations++; value = next; },
  });
  return () => mutations;
}

test('steady gameplay stops rewriting static counters but updates progress continuously', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.advance(0.3);
  const staticCounters = ['shieldValue', 'score', 'bombs', 'petCareHud', 'bossHealthReadout', 'cockpitReadout'];
  const writes = Object.fromEntries(
    staticCounters.map((id) => [id, monitor(h.elements.get(id), 'textContent')]),
  );
  const progress = monitor(h.elements.get('progress').style, 'width');
  h.advance(0.9);
  for (const [id, count] of Object.entries(writes))
    assert.equal(count(), 0, id + ' should not be overwritten with the same value per frame');
  assert.ok(progress() > 0, 'continuous progress display stays responsive');
  h.game.bomb();
  assert.equal(h.elements.get('bombs').textContent, '◆ ◆ ');
  assert.equal(String(h.elements.get('bombTouch')['data-count']), '2');
  h.advance(0.1);
  assert.equal(writes.bombs(), 1, 'next frame does not rewrite immediate bomb feedback');
});

test('shield and cockpit HUD still update without frame batching when damage arrives', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.advance(3.1);
  const shieldWrites = monitor(h.elements.get('shieldValue'), 'textContent');
  const cockpitWrites = monitor(h.elements.get('cockpitReadout'), 'textContent');
  const previous = h.elements.get('shieldValue').textContent;
  h.game.damage(10);
  h.game.step(0.016);
  assert.notEqual(h.elements.get('shieldValue').textContent, previous);
  assert.equal(shieldWrites(), 1);
  assert.equal(cockpitWrites(), 1);
  h.game.step(0.016);
  assert.equal(shieldWrites(), 1);
  assert.equal(cockpitWrites(), 1);
});
