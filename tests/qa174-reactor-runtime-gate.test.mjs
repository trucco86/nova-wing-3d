import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import {
  DEVASTADOR_ACCESS_MODULES,
  DEVASTADOR_ACCESS_THRESHOLD,
} from '../src/devastador-reactor-access.js';
import { SECTORS } from '../src/campaign.js';

const ids = DEVASTADOR_ACCESS_MODULES.map(({ id }) => id);

test('QA174 opt-in stage 4 pauses real flight until all three access modules are activated', (t) => {
  let request = null;
  let calls = 0;
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
    onReactorAccessRequested(context) {
      calls++;
      request = context;
      return true;
    },
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  const initial = h.game.snapshot();
  assert.equal(initial.sector, 4);
  assert.equal(initial.boss, false);
  assert.equal(h.game.enterReactorAccessForQA(), true);
  assert.equal(calls, 1);
  assert.equal(request.sector, 3);
  assert.deepEqual(
    request.modules.map(({ id }) => id),
    ids,
  );
  let s = h.game.snapshot();
  assert.equal(s.state, 'reactor-access');
  assert.equal(s.reactorAccess.started, true);
  assert.equal(s.reactorAccess.completed, false);
  const frozenSeconds = s.seconds;
  h.advance(3, 0.1);
  s = h.game.snapshot();
  assert.equal(s.seconds, frozenSeconds, 'the stage clock stays frozen while exploring');
  assert.equal(s.sector, 4, 'disembark is not an extra sector');
  assert.equal(s.boss, false);
  assert.equal(request.complete(ids.slice(0, 2)), false, 'two activated modules cannot bypass');
  assert.equal(request.complete([ids[0], ids[0], ids[2]]), false, 'duplicate ids cannot bypass');
  assert.equal(request.complete([ids[0], ids[1], 'unauthorized']), false);
  assert.equal(h.game.snapshot().state, 'reactor-access');
  assert.equal(request.complete(ids), true);
  s = h.game.snapshot();
  assert.equal(s.state, 'playing');
  assert.equal(s.sector, 4);
  assert.equal(s.reactorAccess.started, false);
  assert.equal(s.reactorAccess.completed, true);
  assert.equal(s.weapon, initial.weapon);
  assert.equal(s.credits, initial.credits);
  assert.deepEqual(s.loadout, initial.loadout);
  assert.equal(request.complete(ids), false, 'the completion callback cannot be replayed');
  // The same reactor must initialize on the first real flight frame after
  // the 3/3 handoff, regardless of frame-rate or a previously frozen clock.
  h.advance(0.05, 0.05);
  assert.equal(h.game.snapshot().sector, 4);
  assert.equal(h.game.snapshot().boss, true, 'boss entry must not wait for a second timer');
  assert.equal(h.elements.get('bossHUD').hidden, false);
  // A successful disembark must really reach the original reactor boss,
  // rather than merely returning to an empty, unwinnable flight.
  h.advance(11, 0.05);
  const boss = h.game.snapshot();
  assert.equal(boss.sector, 4);
  assert.equal(boss.reactorAccess.completed, true);
  assert.equal(boss.boss, true, 'the same reactor boss starts after the warning window');
  assert.equal(h.elements.get('bossHUD').hidden, false);
});

test('QA174 legacy game and direct boss QA still run without a stage-4 renderer', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  assert.equal(h.game.enterReactorAccessForQA(), false);
  h.advance(1, 0.1);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.deepEqual(h.game.snapshot().reactorAccess, {
    started: false,
    completed: false,
    required: ids,
  });
  const boss = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
    onReactorAccessRequested() {
      throw new Error('Direct boss QA must not attempt to enter the exploration scene');
    },
  });
  t.after(() => boss.close());
  assert.equal(boss.game.startDeveloperScenario(3, 'boss'), true);
  assert.equal(boss.game.snapshot().boss, true);
  assert.equal(boss.game.enterReactorAccessForQA(), false);
});

test('QA174 renderer rejection cannot trap the pilot in the reactor-access state', (t) => {
  let calls = 0;
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
    onReactorAccessRequested() {
      calls++;
      return false;
    },
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  assert.equal(h.game.enterReactorAccessForQA(), false);
  assert.equal(calls, 1);
  assert.equal(h.game.snapshot().state, 'paused', 'failed WebGL must expose pause/exit controls');
  assert.equal(h.elements.get('pauseMenu').hidden, false);
  assert.equal(h.game.snapshot().reactorAccess.completed, false);
});

test('QA175 a renderer exception fails closed to the pause menu without bypassing the reactor', (t) => {
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
    onReactorAccessRequested() {
      throw new Error('WebGL context lost');
    },
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  assert.equal(h.game.enterReactorAccessForQA(), false);
  const snap = h.game.snapshot();
  assert.equal(snap.state, 'paused');
  assert.equal(snap.sector, 4);
  assert.equal(snap.boss, false);
  assert.equal(snap.reactorAccess.completed, false);
  assert.equal(h.elements.get('pauseMenu').hidden, false);
});

test('QA176: real Stage 04 flight naturally reaches the disembark threshold', (t) => {
  let requests = 0;
  let access = null;
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
    onReactorAccessRequested(context) {
      requests++;
      access = context;
      return true;
    },
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  const threshold = SECTORS[3].duration * DEVASTADOR_ACCESS_THRESHOLD;
  h.advance(threshold - 1, 0.25);
  let snap = h.game.snapshot();
  assert.equal(snap.state, 'playing');
  assert.equal(snap.boss, false);
  assert.equal(requests, 0, 'no early reactor access');

  h.advance(1.2, 0.2);
  snap = h.game.snapshot();
  assert.equal(requests, 1, 'the real stage clock triggers the on-screen walk segment');
  assert.ok(access);
  assert.equal(snap.sector, 4, 'the walk does not create an extra campaign sector');
  assert.equal(snap.state, 'reactor-access');
  assert.equal(snap.reactorAccess.started, true);
  assert.equal(snap.reactorAccess.completed, false);
  assert.equal(snap.boss, false);

  const stopped = snap.seconds;
  h.advance(3, 0.25);
  assert.equal(h.game.snapshot().seconds, stopped, 'flight time freezes during walking');
  assert.equal(requests, 1, 'the handoff must occur only once');
});
