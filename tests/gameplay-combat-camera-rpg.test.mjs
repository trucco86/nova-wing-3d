import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createFlightCamera } from '../src/flight.js';
import { SECTORS } from '../src/campaign.js';
import { stagePerspectiveAt } from '../src/stage-variety.js';
import { createBossCombat } from '../src/combat.js';
import { SQUAD_SPECIALS } from '../src/five-cats-squad.js';
import { harness } from './harness.mjs';

test('tactical fleet overhead keeps ship inside viewport even in portrait', () => {
  for (const aspect of [16 / 9, 390 / 844]) {
    const camera = new T.PerspectiveCamera(65, aspect, 0.1, 2500);
    const rig = createFlightCamera(camera, true);
    const pilot = new T.Vector3(0, 9, 9);
    rig.reset(pilot);
    rig.setShot('overhead');
    for (let i = 0; i < 130; i++) rig.update(1 / 60, pilot, 0, false);
    camera.updateMatrixWorld();
    const projection = pilot.clone().project(camera);
    assert.ok(Math.abs(projection.x) < 0.55, 'ship centered horizontally');
    assert.ok(Math.abs(projection.y) < 0.85, 'ship visible vertically: ' + projection.y);
    assert.ok(projection.z > -1 && projection.z < 1);
  }
});

test('overhead fleet encounter maps up/down to world depth instead of altitude', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(7, 'stage'), true);
  const duration = SECTORS[7].duration;
  h.advance(duration * 0.47, 0.1);
  assert.equal(h.game.snapshot().directedShot, 'overhead');
  const before = h.game.snapshot().player;
  h.key('KeyW');
  h.advance(0.6, 0.1);
  h.key('KeyW', false);
  const moved = h.game.snapshot().player;
  assert.ok(moved.z < before.z - 2, 'up must move ship forward on top-down X/Z plane');
  assert.ok(Math.abs(moved.y - 9) < 3, 'overhead movement holds readable flight altitude');
  h.advance(duration * 0.1, 0.1);
  assert.equal(h.game.snapshot().directedShot, 'chase');
  assert.ok(Math.abs(h.game.snapshot().player.z - 9) < 1, 'return to rail center is smooth');
});

test('RPG supers last long enough to matter and do not bypass weak-point phases', () => {
  assert.ok(SQUAD_SPECIALS.plasma.duration >= 6);
  assert.ok(SQUAD_SPECIALS.overdrive.duration >= 8);
  assert.ok(SQUAD_SPECIALS.plasma.cooldown > SQUAD_SPECIALS.plasma.duration);
  const boss = createBossCombat(5, 1);
  for (let i = 0; i < 40; i++) boss.update(0.1);
  let total = 0;
  for (let i = 0; i < 50; i++) {
    boss.update(0.1);
    total += boss.spendSpecial(35);
  }
  assert.ok(total > 600, 'team super should deliver meaningful sustained damage');
  assert.ok(total < 1100, 'super has bounded damage budget and cannot one-shot boss');
});

test('barrier and stasis persist across real simulation seconds', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.game.castSpecial(), true);
  assert.ok(h.game.snapshot().strategy.barrier >= 10);
  h.advance(6.5, 0.1);
  assert.ok(h.game.snapshot().strategy.barrier >= 3, 'shield should not vanish after 4s');
  const before = h.game.snapshot().hp;
  h.game.damage(20);
  assert.equal(h.game.snapshot().hp, before, 'active shield absorbs direct damage');
  h.advance(4.5, 0.1);
  assert.equal(h.game.snapshot().strategy.barrier, 0);
});
