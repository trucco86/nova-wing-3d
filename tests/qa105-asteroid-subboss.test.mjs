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
  assert.equal(first.bossHp ?? 0, 0, 'main boss must not overlap the subboss');

  h.game.pause();
  const paused = h.game.snapshot();
  h.advance(1);
  assert.deepEqual(h.game.snapshot(), paused, 'pause freezes subboss encounter');

  h.game.pause();
  h.advance(0.5, 0.1);
  assert.ok(h.game.snapshot().targets.some((target) => target.kind === 'subboss'));
});
