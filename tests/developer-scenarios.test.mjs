import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

test('DEV QA jumps to a sector boss without saving or posting ranking events', (t) => {
  let started = 0;
  let finished = 0;
  let writes = 0;
  const storage = {
    getItem: (key) =>
      key === 'nova-wing-3d-v1'
        ? JSON.stringify({ version: 1, sector: 2, credits: 30, weapon: 0, armor: 0, pods: 0 })
        : null,
    setItem() {
      writes++;
    },
  };
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    storage,
    spawnEncounters: false,
    onStageStarted: () => started++,
    onStageFinished: () => finished++,
  });
  t.after(() => h.close());
  assert.equal(h.elements.get('developerPanel').hidden, false);
  assert.equal(h.game.snapshot().developerAvailable, true);
  h.elements.get('developerSector').value = '9';
  h.elements.get('developerEncounter').value = 'boss';
  assert.equal(h.elements.get('developerLaunch').onclick(), true);
  const state = h.game.snapshot();
  assert.equal(state.developerSession, true);
  assert.equal(state.sector, 10);
  assert.equal(state.boss, true);
  assert.deepEqual(state.developerScenario, { sector: 9, encounter: 'boss' });
  assert.equal(h.elements.get('developerSessionTag').hidden, false);
  assert.equal(started, 0);
  assert.equal(finished, 0);
  assert.equal(writes, 0);
  h.game.pause();
  h.elements.get('pauseExit').onclick();
  h.elements.get('pauseConfirmOk').onclick();
  assert.equal(h.game.snapshot().state, 'menu');
  assert.equal(h.game.snapshot().developerSession, false);
  assert.equal(h.elements.get('developerSessionTag').hidden, true);
  assert.equal(writes, 0);
});

test('DEV QA can inspect a mid-sector subboss and restart the same scenario', (t) => {
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'subboss'), true);
  assert.equal(h.game.snapshot().sector, 4);
  assert.ok(h.game.snapshot().encounterKinds.includes('subboss'));
  h.game.pause();
  h.elements.get('pauseRestart').onclick();
  h.elements.get('pauseConfirmOk').onclick();
  assert.equal(h.game.snapshot().developerSession, true);
  assert.ok(h.game.snapshot().encounterKinds.includes('subboss'));
});

test('public and HML hosts refuse QA navigation, including direct API calls', (t) => {
  const h = harness({ hostname: 'hml.nova-wing-preview.pages.dev' });
  t.after(() => h.close());
  assert.equal(h.elements.get('developerPanel').hidden, true);
  assert.equal(h.game.startDeveloperScenario(4, 'boss'), false);
  assert.equal(h.game.startDeveloperScenario(11, 'stage'), false);
  assert.equal(h.game.snapshot().state, 'menu');
  assert.equal(h.game.snapshot().developerSession, false);
});
