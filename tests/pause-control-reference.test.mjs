import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UI_COPY, uiText } from '../src/ui-preferences.js';

const pauseCommands = [
  'helpTitle',
  'helpKeyboard',
  'helpTouch',
  'helpMove',
  'helpFire',
  'helpBoost',
  'helpRobot',
  'helpPods',
  'helpBomb',
  'helpRoll',
  'helpOrbit',
  'helpCamera',
  'helpArsenal',
  'helpSpecial',
  'helpScan',
  'helpPrecision',
  'helpRepair',
  'helpBarrage',
  'helpPause',
  'shieldLow',
  'critical',
];
test('pause controls and low/critical shield states are fully localized', () => {
  for (const lang of ['pt', 'en', 'es'])
    for (const key of pauseCommands) {
      assert.equal(typeof UI_COPY[lang][key], 'string', lang + '/' + key);
      assert.ok(UI_COPY[lang][key].length > 3, lang + '/' + key);
      assert.equal(uiText(lang, key), UI_COPY[lang][key]);
    }
  assert.notEqual(uiText('pt', 'shieldLow'), uiText('pt', 'critical'));
  assert.notEqual(uiText('en', 'helpRobot'), uiText('en', 'helpRepair'));
});
