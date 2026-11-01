import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEVASTADOR_ESCAPE_BEATS,
  DEVASTADOR_ESCAPE_BOOST_START,
  DEVASTADOR_ESCAPE_WARP_START,
  devastadorEscapeAt,
} from '../src/devastador-escape.js';
import { harness } from './harness.mjs';
import { defeatBoss } from './combat-helper.mjs';

test('Devastador finale progresses through five authored radio beats with an optional manual boost', () => {
  assert.deepEqual(
    DEVASTADOR_ESCAPE_BEATS.map(({ phase }) => phase),
    ['meltdown', 'systems', 'escape', 'boost', 'warp'],
  );
  assert.equal(devastadorEscapeAt(0).speaker, 'bia');
  assert.equal(devastadorEscapeAt(1.4).speaker, 'bob');
  assert.equal(devastadorEscapeAt(3.4).speaker, 'calvin');
  assert.equal(devastadorEscapeAt(DEVASTADOR_ESCAPE_BOOST_START).speaker, 'christopher');
  assert.equal(devastadorEscapeAt(DEVASTADOR_ESCAPE_WARP_START).speaker, 'jenifer');
  assert.equal(devastadorEscapeAt(4.6).boostWindow, false);
  assert.equal(devastadorEscapeAt(4.75).boostWindow, true);
  const manual = devastadorEscapeAt(6.7, { boostedSeconds: 0.38 });
  assert.equal(manual.boostActivated, true);
  assert.equal(manual.assistedBoost, false);
  assert.equal(manual.warp, true);
  assert.ok(manual.flameScale >= 3);
});

test('no BOOST or empty energy never traps a player inside the destroyed Devastador', () => {
  const start = devastadorEscapeAt(5.1, { boostedSeconds: 0 });
  assert.equal(start.warp, false);
  const automatic = devastadorEscapeAt(6.6, { boostedSeconds: 0 });
  assert.equal(automatic.warp, true);
  assert.equal(automatic.assistedBoost, true);
  assert.equal(devastadorEscapeAt(Number.NaN).phase, 'meltdown');
  assert.equal(devastadorEscapeAt(100, { boostedSeconds: 0.5 }).assistedBoost, false);
});

test('phase 4 real QA boss demolition triggers cinematic BOOST and resets state at shop', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'boss'), true);
  defeatBoss(h, { stopAtCollapse: true });
  let s = h.game.snapshot();
  assert.equal(s.state, 'collapsing');
  assert.equal(s.sector, 4);
  assert.equal(s.devastadorEscape.phase, 'meltdown');
  h.advance(4.75, 0.05);
  s = h.game.snapshot();
  assert.equal(s.devastadorEscape.phase, 'boost');
  assert.equal(s.devastadorEscape.boostActivated, false);
  h.key('ShiftLeft');
  h.advance(0.5, 0.05);
  h.key('ShiftLeft', false);
  s = h.game.snapshot();
  assert.equal(s.devastadorEscape.boostActivated, true, 'real SHIFT input must be recognized');
  h.advance(1.5, 0.05);
  s = h.game.snapshot();
  assert.equal(s.devastadorEscape.warp, true);
  assert.equal(s.devastadorEscape.assisted, false);
  assert.equal(h.document.body.classList.contains('devastador-warp'), true);
  h.advance(1.4, 0.05);
  s = h.game.snapshot();
  assert.equal(s.state, 'shop', 'existing campaign stage transitions stay intact');
  assert.equal(s.devastadorEscape, null);
  assert.equal(h.document.body.classList.contains('devastador-warp'), false);
  assert.equal(h.document.body.classList.contains('devastador-escape'), false);
  assert.equal(h.elements.get('boostTouch').textContent, 'BOOST');
});
