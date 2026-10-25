import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

function advanceProtected(h, seconds) {
  for (let elapsed = 0; elapsed < seconds - 1e-9; elapsed += 0.1) {
    h.game.collect('shield');
    h.advance(Math.min(0.1, seconds - elapsed));
  }
}

test('web subboss approaches, signals its attack, freezes on pause and resets', (t) => {
  const h = harness({ spawnEncounters: true });
  t.after(() => h.close());
  h.game.start();
  advanceProtected(h, 19.8);
  const charging = h.game.snapshot();
  const subboss = charging.targets.find((enemy) => enemy.kind === 'subboss');
  assert.equal(subboss.tactic, 'strafe');
  assert.equal(subboss.attack, 'RAJADA FRONTAL');
  assert.equal(subboss.charging, true);
  assert.ok(subboss.z > -100 && subboss.z < -75, 'faster approach reaches the combat plane');
  assert.match(h.elements.get('subState').textContent, /RAJADA FRONTAL/);
  assert.equal(h.elements.get('subHUD').style.color, '#ff784f');

  h.game.pause();
  const paused = h.game.snapshot();
  h.advance(2);
  assert.deepEqual(h.game.snapshot(), paused);
  h.game.pause();
  h.advance(0.7);
  const fired = h.game.snapshot();
  assert.equal(fired.targets.find((enemy) => enemy.kind === 'subboss').charging, false);
  assert.ok(fired.entities.hostile > charging.entities.hostile);

  h.game.start();
  assert.equal(h.game.snapshot().targets.length, 0);
  advanceProtected(h, 19.2);
  assert.equal(h.game.snapshot().targets.find((enemy) => enemy.kind === 'subboss').phase, 1);
});
