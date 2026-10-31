import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GRAPHICS_OPTIONS,
  resolveGraphicsQuality,
  graphicsPixelRatioLimit,
} from '../src/graphics-quality.js';
import { readSettings, loadSettings, storeSettings, UI_COPY } from '../src/ui-preferences.js';

test('graphics mode resolves conservatively on mobile and honors explicit choices', () => {
  assert.deepEqual(GRAPHICS_OPTIONS, ['auto', 'medium', 'high']);
  assert.equal(resolveGraphicsQuality('auto', { coarsePointer: true }), 'medium');
  assert.equal(resolveGraphicsQuality('auto', { deviceMemory: 4 }), 'medium');
  assert.equal(resolveGraphicsQuality('auto', { coarsePointer: false, deviceMemory: 8 }), 'high');
  assert.equal(resolveGraphicsQuality('high', { coarsePointer: true }), 'high');
  assert.equal(resolveGraphicsQuality('medium'), 'medium');
  assert.equal(graphicsPixelRatioLimit('medium', { coarsePointer: true }), 1.05);
  assert.ok(graphicsPixelRatioLimit('high') > graphicsPixelRatioLimit('medium'));
});

test('graphics settings persist without changing save progress and are translated', () => {
  let value = '';
  const storage = { getItem: () => value, setItem: (_, text) => (value = text) };
  assert.equal(readSettings({ graphics: 'ultra' }).graphics, 'auto');
  assert.equal(storeSettings(storage, { graphics: 'high', language: 'es' }), true);
  assert.equal(loadSettings(storage).graphics, 'high');
  assert.equal(loadSettings(storage).language, 'es');
  for (const language of ['pt', 'en', 'es'])
    for (const key of ['graphics', 'graphicsAuto', 'graphicsHigh', 'graphicsMedium'])
      assert.ok(UI_COPY[language][key]);
});
