import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { marsSandstormAt } from '../src/mars-sandstorm.js';

test('Mars turbulence pushes ship physically and respects pause/restart and player controls', (t) => {
  const h = harness({ hostname: 'localhost', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(1, 'stage'), true);
  assert.equal(h.game.snapshot().sector, 2);
  // No ambient enemy shots are required to exercise the storm.
  h.advance(60, 0.2);
  const before = h.game.snapshot().player.x;
  assert.ok(marsSandstormAt(60).warning);
  h.advance(5, 0.2);
  const during = h.game.snapshot();
  assert.ok(
    Math.abs(during.player.x - before) > 0.15,
    'actual player coordinates drift when storm wind hits, not only camera visuals',
  );
  assert.match(during.route.label, /TURBULÊNCIA MARCIANA/);
  h.game.pause();
  const paused = h.game.snapshot().player.x;
  h.advance(2, 0.2);
  assert.equal(h.game.snapshot().player.x, paused, 'pause freezes wind and movement');
  h.game.pause();
  h.key('ArrowRight');
  h.advance(1, 0.1);
  h.key('ArrowRight', false);
  const steered = h.game.snapshot().player.x;
  assert.ok(steered > paused - 3, 'manual steering remains capable of opposing gusts');
});
