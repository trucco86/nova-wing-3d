import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createBossCombat } from '../src/combat.js';
import { createFlightCamera } from '../src/flight.js';
import { SPECIALS } from '../src/strategy.js';
import { SQUAD_SPECIALS } from '../src/five-cats-squad.js';
import { harness } from './harness.mjs';

test('team plasma and Five Cats Overdrive have meaningful duration and independently metered boss impact', () => {
  assert.equal(SQUAD_SPECIALS.plasma.duration, 8);
  assert.equal(SQUAD_SPECIALS.overdrive.duration, 10);
  assert.ok(SQUAD_SPECIALS.plasma.cooldown > SQUAD_SPECIALS.plasma.duration);
  assert.ok(SQUAD_SPECIALS.overdrive.cooldown > SQUAD_SPECIALS.overdrive.duration);
  const combat = createBossCombat(9, 1);
  combat.update(4);
  combat.spend(100000);
  assert.equal(combat.spend(100, false), 0, 'ordinary-fire damage cap is exhausted');
  const special = combat.spendSquadSpecial(100);
  assert.ok(special > 50, 'squad super must have independent meaningful budget');
  const reserveRemainder = combat.spendSquadSpecial(100);
  assert.ok(
    reserveRemainder > 0 && reserveRemainder < 25,
    'special reserve is capped, not infinite',
  );
  assert.equal(combat.spendSquadSpecial(100), 0);
  combat.update(1);
  assert.ok(combat.spendSquadSpecial(200) > 90);
  assert.equal(SPECIALS[0].duration, 12);
  assert.equal(SPECIALS[2].duration, 11);
});

test('squad supers remain active for their full advertised gameplay duration', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(9, 'boss'), true);
  h.advance(4.1, 0.1);
  h.key('KeyY');
  assert.equal(h.game.snapshot().fiveCats.plasmaTime, 8);
  h.key('KeyY', false);
  h.advance(4, 0.1);
  assert.ok(h.game.snapshot().fiveCats.plasmaTime > 3.5);
  h.advance(4.2, 0.1);
  assert.equal(h.game.snapshot().fiveCats.plasmaTime, 0);
  assert.equal(h.game.snapshot().state, 'playing');
});

test('reactor top-down is a playable X/Z navigation objective, never an automatic scenic cut', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  assert.equal(h.game.snapshot().directedShot, 'chase');
  h.advance(31.2, 0.1);
  const started = h.game.snapshot();
  assert.equal(started.directedShot, 'overhead');
  assert.ok(started.missionCameraSeconds > 0);
  h.key('KeyW');
  h.advance(0.5, 0.1);
  const moved = h.game.snapshot();
  assert.ok(moved.playerDepth < started.playerDepth - 6, 'UP moves into world depth');
  h.key('KeyW', false);
  h.key('KeyD');
  h.advance(0.6, 0.1);
  assert.ok(
    h.game.snapshot().player.x > started.player.x + 8,
    'RIGHT moves across tactical screen',
  );
  h.key('KeyD', false);
  h.game.cycleCamera();
  h.advance(0.1);
  assert.equal(
    h.game.snapshot().directedShot,
    'cockpit',
    'manual cockpit overrides mission camera',
  );
  h.advance(18, 0.1);
  assert.equal(h.game.snapshot().directedShot, 'cockpit');
  h.game.cycleCamera();
  h.game.cycleCamera();
  h.advance(0.5, 0.1);
  assert.equal(h.game.snapshot().directedShot, 'chase');
});

test('overhead flight camera keeps the ship inside even narrow mobile viewport', () => {
  for (const aspect of [16 / 9, 390 / 844, 320 / 568]) {
    const camera = new T.PerspectiveCamera(60, aspect, 0.1, 2500);
    const rig = createFlightCamera(camera, true);
    const player = new T.Vector3(0, 10, 9);
    rig.reset(player);
    rig.setShot('overhead');
    for (const [x, z] of [
      [18, -26],
      [-18, 26],
      [0, -44],
      [15, -15],
    ]) {
      player.set(x, 10, z);
      for (let i = 0; i < 90; i++) rig.update(1 / 60, player, 0, false);
      camera.updateMatrixWorld();
      const projected = player.clone().project(camera);
      assert.ok(Math.abs(projected.x) < 0.92, 'ship x offscreen: ' + projected.x);
      assert.ok(Math.abs(projected.y) < 0.92, 'ship y offscreen: ' + projected.y);
    }
  }
});

test('Marvin reacts to the player and telegraphs a bite before it can hit', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(9, 'boss'), true);
  h.advance(9, 0.1);
  const intent = h.game.snapshot().bossIntent;
  assert.equal(intent?.kind, 'bite');
  assert.match(intent.label, /MORDIDA/);
  const initial = h.game.snapshot().shield;
  h.key('KeyD');
  h.advance(2.1, 0.1);
  h.key('KeyD', false);
  assert.ok(h.game.snapshot().player.x > intent.targetX + 12);
  assert.equal(h.game.snapshot().shield, initial, 'the bite was dodged by moving away');
});
