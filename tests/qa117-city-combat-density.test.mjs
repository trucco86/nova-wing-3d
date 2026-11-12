import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageOneCombatDensity, stageOneEncounterWindows } from '../src/stage-one-pacing.js';
import { fighterWaveAt } from '../src/sector-waves.js';
import { harness } from './harness.mjs';

test('QA117: normal city and orbit have visibly larger but bounded formations', () => {
  const easy = stageOneCombatDensity('easy');
  const normal = stageOneCombatDensity('normal');
  const hard = stageOneCombatDensity('hard');
  assert.deepEqual([easy.count, normal.count, hard.count], [1, 2, 3]);
  assert.deepEqual(
    ['easy', 'normal', 'hard'].map((mode) => stageOneCombatDensity(mode, true).count),
    [2, 3, 4],
  );
  assert.ok(normal.interval < 5.4, 'normal must improve the original 5.4s fighter cadence');
  assert.ok(normal.groundInterval < 6, 'city has more visible ground patrols');
  assert.ok(easy.interval > normal.interval && hard.interval < normal.interval);
  for (const [mode, max] of [
    ['easy', 4],
    ['normal', 6],
    ['hard', 8],
  ]) {
    const p = stageOneCombatDensity(mode);
    assert.equal(p.maxActive, max);
    assert.equal(stageOneCombatDensity(mode, true, max).count, 0);
    assert.equal(stageOneCombatDensity(mode, true, max - 1).count, 1);
    assert.ok(stageOneCombatDensity(mode, true, max - 2).count <= 2);
    for (let active = 0; active <= max + 2; active++) {
      const wave = stageOneCombatDensity(mode, true, active);
      assert.ok(wave.count + active <= Math.max(active, max));
      if (wave.count > 0)
        assert.equal(fighterWaveAt(0, active, wave.count).slots.length, wave.count);
    }
  }
  assert.deepEqual(stageOneCombatDensity('unknown'), normal);
  assert.throws(() => stageOneCombatDensity('normal', false, -1), RangeError);
  assert.throws(() => stageOneCombatDensity('normal', false, 0.5), RangeError);
});

test('QA117: additional fighters never reopen the train, BOOST or subboss-intro locks', () => {
  const locked = [
    stageOneEncounterWindows(15, 'city', null),
    stageOneEncounterWindows(26, 'boost', null),
    stageOneEncounterWindows(45, 'atmosphere', null),
    stageOneEncounterWindows(66, 'orbit', 64),
  ];
  for (const window of locked) {
    assert.equal(window.exclusiveTransit, true);
    assert.equal(window.canSpawnGround, false);
  }
  assert.equal(stageOneEncounterWindows(68, 'orbit', 62).exclusiveTransit, false);
  assert.equal(stageOneEncounterWindows(76, 'orbit', 62).subbossIntroQuiet, true);
  assert.equal(stageOneEncounterWindows(83, 'orbit', 62).subbossIntroQuiet, true);
});

test('QA117: the real normal first-city encounter spawns a pair, and early ground patrol returns', (t) => {
  const h = harness({ spawnEncounters: true, enableCitySetpieces: true, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start(true);
  h.advance(2.15, 0.05);
  const first = h.game.snapshot();
  assert.equal(first.fighterWave?.cycle, 0);
  assert.equal(
    first.targets.filter((target) => target.kind === 'fighter').length,
    2,
    'normal first wave should be two real combat ships, not cosmetic traffic',
  );
  h.advance(2.1, 0.05);
  const street = h.game.snapshot();
  assert.ok(
    street.encounterKinds.some((kind) => kind === 'tank' || kind === 'walker'),
    'ground enemy is visible before the 13-second train warning',
  );
  h.game.pause();
  const paused = h.game.snapshot();
  h.advance(1.5, 0.05);
  assert.deepEqual(h.game.snapshot().encounterKinds, paused.encounterKinds);
});
