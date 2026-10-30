import test from 'node:test';
import assert from 'node:assert/strict';
import { radioSpeaker, renderRadioSpeaker, RADIO_PILOTS } from '../src/radio-portraits.js';

test('radio portraits map exactly to five approved Five Cats identities', () => {
  assert.deepEqual(Object.keys(RADIO_PILOTS).sort(), [
    'bia',
    'bob',
    'calvin',
    'christopher',
    'jenifer',
  ]);
  assert.equal(radioSpeaker('calvin').name, 'CALVINHO');
  assert.equal(radioSpeaker('christopher').name, 'CHRISTOPHER');
  assert.equal(radioSpeaker('jenifer').name, 'JENIFER');
  assert.equal(radioSpeaker('missing').id, 'bia');
  assert.equal(radioSpeaker('__proto__').id, 'bia');
});

test('radio renderer updates portrait id, readable speaker name and accessibility', () => {
  const portrait = {
    dataset: { pilot: 'bia' },
    setAttribute(name, value) {
      this[name] = value;
    },
  };
  const label = { textContent: 'BIA' };
  const document = {
    getElementById(id) {
      return { commsPortrait: portrait, commsSpeaker: label }[id] ?? null;
    },
  };
  const speaker = renderRadioSpeaker(document, 'jenifer');
  assert.equal(speaker.id, 'jenifer');
  assert.equal(portrait.dataset.pilot, 'jenifer');
  assert.equal(label.textContent, 'JENIFER');
  assert.match(portrait['aria-label'], /JENIFER/);
  assert.equal(renderRadioSpeaker(document, 'unknown').id, 'bia');
  assert.equal(label.textContent, 'BIA');
  assert.equal(renderRadioSpeaker(null, 'bob').id, 'bob');
});
