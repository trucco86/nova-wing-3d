import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import {
  difficultyProfile,
  fighterInterval,
  obstacleInterval,
  firstSubbossQuiet,
  firstSubbossWarmup,
} from '../src/difficulty.js';
import { harness } from './harness.mjs';
import { loadSettings, storeSettings } from '../src/ui-preferences.js';

test('all ten missions are slightly longer, without changing the campaign size', () => {
  assert.equal(SECTORS.length, 10);
  const previous = [130, 70, 70, 75, 75, 80, 80, 85, 85, 90];
  SECTORS.forEach((sector, i) => {
    const ratio = sector.duration / previous[i];
    assert.ok(ratio >= 1.1 && ratio <= 1.18, `mission ${i + 1} changed by ${ratio}`);
  });
});

test('options difficulty defaults to Normal on every new session', () => {
  let stored = null;
  const storage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value;
    },
  };
  assert.equal(loadSettings(storage).difficulty, 'normal');
  storeSettings(storage, { difficulty: 'hard', language: 'en', sfx: 0.5 });
  assert.equal(JSON.parse(stored).difficulty, undefined, 'difficulty is not persisted');
  assert.equal(loadSettings(storage).difficulty, 'normal');
  assert.equal(loadSettings(storage).language, 'en', 'other preferences persist');
  assert.equal(
    loadSettings({
      getItem: () => JSON.stringify({ difficulty: 'easy' }),
    }).difficulty,
    'normal',
    'legacy values cannot force a non-Normal start',
  );
});

test('Options offers easy, normal and hard with real combat differences', (t) => {
  const h = harness();
  t.after(() => h.close());
  const selector = h.elements.get('settingDifficulty');
  assert.equal(h.game.snapshot().settings.difficulty, 'normal');
  h.elements.get('optionsFromMenu').onclick();
  selector.value = 'easy';
  selector.oninput();
  assert.equal(h.game.snapshot().settings.difficulty, 'easy');
  assert.ok(difficultyProfile('easy').damage < difficultyProfile('normal').damage);
  h.elements.get('settingsClose').onclick();
  h.game.start();
  h.advance(3.1);
  h.game.damage(20);
  assert.equal(h.game.snapshot().shield, 86, 'Easy reduces damage by 30%');
  h.game.pause();
  h.elements.get('pauseOptions').onclick();
  selector.value = 'hard';
  selector.oninput();
  assert.equal(h.game.snapshot().settings.difficulty, 'hard');
  assert.equal(difficultyProfile('hard').damage, 1.25);
  assert.ok(fighterInterval(0, 'hard') < fighterInterval(0, 'normal'));
  assert.ok(obstacleInterval(0, 'hard') < obstacleInterval(0, 'normal'));
  assert.ok(fighterInterval(0, 'easy') > fighterInterval(0, 'normal'));
});

test('first subboss has a quiet approach and readable opening fire', () => {
  const trigger = SECTORS[0].duration * 0.22;
  assert.equal(firstSubbossQuiet(0, trigger - 7, SECTORS[0].duration), false);
  assert.equal(firstSubbossQuiet(0, trigger - 4, SECTORS[0].duration), true);
  assert.equal(firstSubbossQuiet(0, trigger + 30, SECTORS[0].duration, true), true);
  assert.equal(firstSubbossQuiet(0, trigger + 30, SECTORS[0].duration, false), false);
  assert.equal(firstSubbossQuiet(1, trigger, SECTORS[1].duration, true), false);
  assert.equal(firstSubbossWarmup(0, 8), true);
  assert.equal(firstSubbossWarmup(0, 9), false);
  assert.equal(firstSubbossWarmup(1, 1), false);
});
