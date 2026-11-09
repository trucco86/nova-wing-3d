import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_ONE_PACING, stageOneEncounterWindows } from '../src/stage-one-pacing.js';
import { harness } from './harness.mjs';

test('the train, mandatory Super Boost and atmospheric climb form an exclusive playable sequence', () => {
  assert.equal(STAGE_ONE_PACING.trainWarningAt, 13);
  const before = stageOneEncounterWindows(12.9, 'city', null);
  assert.equal(before.exclusiveTransit, false);
  assert.equal(before.canSpawnGround, true);
  const warning = stageOneEncounterWindows(13, 'city', null);
  assert.equal(warning.exclusiveTransit, true);
  assert.equal(warning.canSpawnGround, false);
  assert.equal(warning.canSpawnSubboss, false);
  assert.equal(warning.canSpawnBase, false);
  const train = stageOneEncounterWindows(18, 'city', null);
  assert.equal(train.exclusiveTransit, true);
  for (const phase of ['boost', 'atmosphere']) {
    const state = stageOneEncounterWindows(38, phase, null);
    assert.equal(
      state.exclusiveTransit,
      true,
      phase + ' must not spawn a surprise enemy or obstacle',
    );
    assert.equal(state.canSpawnSubboss, false);
    assert.equal(state.canSpawnBase, false);
    assert.equal(state.canSpawnGround, false);
  }
  assert.equal(
    stageOneEncounterWindows(18, 'city', null, false).exclusiveTransit,
    false,
    'legacy/non-scripted stages retain existing spawning rules',
  );
  assert.equal(stageOneEncounterWindows(18, 'city', null, false).canSpawnSubboss, true);
  assert.throws(() => stageOneEncounterWindows(-0.1), RangeError);
  assert.throws(() => stageOneEncounterWindows(NaN), RangeError);
  assert.throws(() => stageOneEncounterWindows(30, 'invalid'), RangeError);
});

test('post-orbit rhythm stages recovery, fighter re-entry, subboss and base individually', () => {
  const reachedAt = 61.4;
  const at = (age) => stageOneEncounterWindows(reachedAt + age, 'orbit', reachedAt);
  assert.equal(at(0).exclusiveTransit, true);
  assert.equal(at(4.99).exclusiveTransit, true);
  assert.equal(at(5).exclusiveTransit, false);
  assert.equal(at(5).canSpawnSubboss, false);
  assert.equal(at(13.99).canSpawnSubboss, false);
  assert.equal(at(14).canSpawnSubboss, true);
  assert.equal(at(14).subbossIntroQuiet, true);
  assert.equal(at(21.99).subbossIntroQuiet, true);
  assert.equal(at(22).subbossIntroQuiet, false);
  assert.equal(at(22.99).canSpawnBase, false);
  assert.equal(at(23).canSpawnBase, true);
  assert.equal(at(23).canSpawnGround, false, 'city tanks and walkers never float in orbit');
  assert.equal(
    stageOneEncounterWindows(100, 'boost', 61.4).exclusiveTransit,
    true,
    'a fake orbit timestamp cannot skip the real boost phase',
  );
  assert.equal(
    stageOneEncounterWindows(10, 'orbit', 100).orbitAge,
    null,
    'invalid future orbit timestamp never unlocks combat',
  );
});

test('real stage-1 gameplay waits for actual BOOST exhaustion then grants orbit encounter windows', (t) => {
  const h = harness({ spawnEncounters: false, enableCitySetpieces: true, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start(true);
  h.advance(22.4);
  let state = h.game.snapshot();
  assert.equal(state.orbitalLaunch.phase, 'boost');
  assert.equal(state.cityDestruction.pacing.exclusiveTransit, true);
  assert.equal(state.cityDestruction.pacing.canSpawnSubboss, false);
  assert.equal(state.cityDestruction.pacing.canSpawnBase, false);
  h.advance(2.2);
  state = h.game.snapshot();
  assert.equal(state.orbitalLaunch.phase, 'boost', 'waiting still cannot complete the mission');
  assert.equal(state.cityDestruction.pacing.exclusiveTransit, true);
  h.key('ShiftLeft');
  h.advance(3.8);
  h.key('ShiftLeft', false);
  state = h.game.snapshot();
  assert.equal(state.orbitalLaunch.phase, 'atmosphere');
  assert.equal(state.cityDestruction.pacing.exclusiveTransit, true);
  h.advance(38.2);
  state = h.game.snapshot();
  assert.equal(state.orbitalLaunch.phase, 'orbit');
  assert.ok(state.cityDestruction.pacing.orbitAge >= 0);
  assert.equal(state.cityDestruction.pacing.exclusiveTransit, true);
  h.advance(5.05);
  state = h.game.snapshot();
  assert.equal(state.cityDestruction.pacing.exclusiveTransit, false);
  assert.equal(state.cityDestruction.pacing.canSpawnSubboss, false);
  h.advance(9.05);
  state = h.game.snapshot();
  assert.equal(state.cityDestruction.pacing.canSpawnSubboss, true);
  assert.equal(state.cityDestruction.pacing.subbossIntroQuiet, true);
  assert.equal(state.cityDestruction.pacing.canSpawnBase, false);
  h.advance(9.05);
  state = h.game.snapshot();
  assert.equal(state.cityDestruction.pacing.canSpawnBase, true);
  assert.equal(state.cityDestruction.pacing.canSpawnGround, false);
});
