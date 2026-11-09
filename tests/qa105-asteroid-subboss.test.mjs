import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

test('QA105: asteroid sector has a visible, sector-specific subboss encounter', (t) => {
  const h = harness({ spawnEncounters: true, hostname: 'dev.nova-wing-preview.pages.dev' });
  t.after(() => h.close());

  assert.equal(h.game.startDeveloperScenario(2, 'subboss'), true);
  const first = h.game.snapshot();
  const targets = first.targets.filter((target) => target.kind === 'subboss');
  assert.equal(targets.length, 1, 'one subboss is present in sector 3');
  assert.ok(targets[0].life > 0, 'subboss is damageable');
  assert.ok(targets[0].attack, 'sector-specific attack is configured');
  assert.ok(targets[0].tactic, 'sector-specific movement is configured');
  assert.equal(h.elements.get('subHUD').hidden, false, 'subboss HUD is visible');
  assert.equal(first.boss, false, 'main boss must not overlap the subboss');

  h.game.pause();
  const paused = h.game.snapshot();
  h.advance(1);
  assert.deepEqual(h.game.snapshot(), paused, 'pause freezes subboss encounter');

  h.game.pause();
  h.advance(0.5, 0.1);
  assert.ok(h.game.snapshot().targets.some((target) => target.kind === 'subboss'));
});

test('QA105: normal asteroid stage begins with the course gate, not an injected subboss', (t) => {
  const h = harness({ spawnEncounters: true, hostname: 'dev.nova-wing-preview.pages.dev' });
  t.after(() => h.close());

  assert.equal(h.game.startDeveloperScenario(2, 'stage'), true);
  const initial = h.game.snapshot();
  assert.equal(initial.sector, 3);
  assert.equal(initial.developerScenario.encounter, 'stage');
  assert.equal(initial.asteroidInterior.course.enabled, true);
  assert.equal(initial.asteroidInterior.course.complete, false);
  assert.equal(initial.boss, false);
  assert.equal(
    initial.targets.filter((target) => target.kind === 'subboss').length,
    0,
    'subboss must not be injected at the start of the stage',
  );

  h.advance(1, 0.1);
  const playing = h.game.snapshot();
  assert.equal(playing.asteroidInterior.course.complete, false);
  assert.equal(playing.boss, false, 'main boss cannot bypass the course');
  assert.equal(
    playing.targets.filter((target) => target.kind === 'subboss').length,
    0,
    'subboss cannot appear before the obstacle course is completed',
  );
});
