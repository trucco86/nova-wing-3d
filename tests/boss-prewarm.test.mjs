import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { reachSectorBoss } from './mission-scenarios.mjs';

test('boss geometry is built during stage preparation and reused at the actual encounter', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  const initial = h.game.snapshot();
  assert.equal(initial.boss, false);
  assert.equal(initial.bossPrepared, true);
  assert.ok(initial.preparedBossModelId);
  const preparedId = initial.preparedBossModelId;
  reachSectorBoss(h, { bossAge: 0.1, dt: 0.1 });
  const arrived = h.game.snapshot();
  assert.equal(arrived.boss, true);
  assert.equal(arrived.bossPrepared, false);
  assert.equal(arrived.bossModelId, preparedId, 'encounter never rebuilds the boss geometry');
});

test('mission restart discards an unused prepared boss and prepares one fresh instance', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  const id = h.game.snapshot().preparedBossModelId;
  assert.ok(id);
  h.game.start();
  const next = h.game.snapshot();
  assert.equal(next.bossPrepared, true);
  assert.notEqual(next.preparedBossModelId, id);
  assert.equal(next.boss, false);
});
