import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

function setup(t, options = {}) {
  const h = harness(options);
  t.after(() => h.close());
  return h;
}
test('game menu does not start audio; settings work before a mission', (t) => {
  const h = setup(t);
  assert.equal(h.calls.audio, 0);
  h.elements.get('optionsFromMenu').onclick();
  assert.equal(h.elements.get('settingsMenu').hidden, false);
  const language = h.elements.get('settingLanguage');
  language.value = 'en';
  language.oninput();
  assert.equal(h.game.snapshot().settings.language, 'en');
  assert.equal(h.elements.get('pauseResume').textContent, 'RESUME');
  const intro = h.elements.get('settingIntro');
  intro.checked = false;
  intro.oninput();
  h.elements.get('settingsClose').onclick();
  assert.equal(h.elements.get('settingsMenu').hidden, true);
  h.elements.get('start').onclick();
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().cinematic, null);
});
test('stage heading automatically hides without affecting gameplay', (t) => {
  const h = setup(t);
  h.game.start();
  assert.equal(h.game.snapshot().stageTitleVisible, true);
  h.advance(3.2);
  assert.equal(h.game.snapshot().stageTitleVisible, false);
  assert.equal(h.document.body.classList.contains('stage-intro'), false);
  assert.equal(h.game.snapshot().state, 'playing');
});
test('pause is accessible, cancel is safe, restart rolls back current stage only', (t) => {
  const h = setup(t);
  h.game.start();
  h.advance(4);
  h.game.fire();
  h.game.pause();
  const frozen = h.game.snapshot();
  assert.equal(frozen.state, 'paused');
  assert.equal(frozen.pauseDialog, true);
  h.advance(2);
  assert.equal(h.game.snapshot().seconds, frozen.seconds);
  h.elements.get('pauseRestart').onclick();
  assert.equal(h.game.snapshot().confirmation, 'restart');
  h.elements.get('pauseConfirmCancel').onclick();
  assert.equal(h.game.snapshot().confirmation, null);
  h.elements.get('pauseRestart').onclick();
  h.elements.get('pauseConfirmOk').onclick();
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().seconds, 0);
  assert.equal(h.game.snapshot().sector, frozen.sector);
  assert.equal(h.game.snapshot().hits, 0);
});
test('return to main menu requires confirmation and preserves basic access', (t) => {
  const h = setup(t);
  h.game.start();
  h.game.pause();
  h.elements.get('pauseExit').onclick();
  assert.equal(h.game.snapshot().state, 'paused');
  h.elements.get('pauseConfirmOk').onclick();
  assert.equal(h.game.snapshot().state, 'menu');
  assert.equal(h.document.body.classList.contains('in-mission'), false);
  assert.equal(h.elements.get('menu').hidden, false);
  assert.equal(h.elements.get('pauseMenu').hidden, true);
});
test('touch sensitivity and opacity update without external permissions', (t) => {
  const h = setup(t);
  const sensitivity = h.elements.get('settingSensitivity');
  h.elements.get('optionsFromMenu').onclick();
  sensitivity.value = '1.4';
  sensitivity.oninput();
  const opacity = h.elements.get('settingOpacity');
  opacity.value = '0.5';
  opacity.oninput();
  assert.equal(h.game.snapshot().settings.sensitivity, 1.4);
  assert.equal(h.elements.get('touch').style.opacity, '0.5');
  assert.equal(h.calls.audio, 0);
});
