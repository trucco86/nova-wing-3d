import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createPilotRelay, PILOT_SWAP_COOLDOWN } from '../src/pilot-relay.js';
import { createCockpit } from '../src/cockpit.js';
import { pilotAt } from '../src/pilots.js';
import { harness } from './harness.mjs';

test('pilot relay swaps craft with cooldown, distinct ship class and persistent avaria', () => {
  const relay = createPilotRelay({ pilot: 'bia', ship: 'nova7', color: 'polar' });
  assert.equal(relay.current().ship, 'nova7');
  const first = relay.switchPilot();
  assert.equal(first.next.pilot, 'bob');
  assert.equal(first.next.ship, 'aegis');
  assert.equal(relay.switchPilot(), null);
  relay.advance(PILOT_SWAP_COOLDOWN);
  const second = relay.switchPilot();
  assert.equal(second.next.pilot, 'christopher');
  const disabled = relay.retire();
  assert.equal(disabled.previous.pilot, 'christopher');
  assert.equal(disabled.next.pilot, 'calvin');
  assert.ok(relay.snapshot().damaged.includes('christopher'));
  assert.ok(!relay.snapshot().available.includes('christopher'));
  relay.reset({ pilot: 'jenifer', ship: 'aegis', color: 'gold' });
  assert.deepEqual(relay.snapshot().damaged, []);
  assert.equal(relay.current().pilot, 'jenifer');
  assert.equal(relay.current().ship, 'aegis');
});

test('cockpit paws match pilot identity, size and fur without new-frame meshes', () => {
  const camera = new T.PerspectiveCamera();
  const cockpit = createCockpit(camera);
  cockpit.update(0.05, true, 0.4, { pilot: 'christopher', steer: 0.6, boosting: true });
  assert.equal(cockpit.snapshot().paws, 2);
  assert.equal(cockpit.snapshot().pawScale, pilotAt('christopher').pawScale);
  assert.equal(cockpit.snapshot().fur, pilotAt('christopher').fur);
  const firstMeshes = camera.getObjectByName('five-cats-cockpit').children.length;
  cockpit.update(0.05, true, 0.1, { pilot: 'calvin', steer: -1 });
  assert.equal(cockpit.snapshot().pawScale, pilotAt('calvin').pawScale);
  assert.equal(camera.getObjectByName('five-cats-cockpit').children.length, firstMeshes);
  cockpit.destroy();
  assert.equal(camera.getObjectByName('five-cats-cockpit'), undefined);
});

test('in-battle relay changes actual speed, damage and shield while retaining integrity ratio', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.advance(2.1);
  const before = h.game.snapshot();
  assert.equal(before.loadout.pilot, 'bia');
  assert.equal(h.game.switchPilot(), true);
  const after = h.game.snapshot();
  assert.equal(after.loadout.pilot, 'bob');
  assert.equal(after.loadout.ship, 'aegis');
  assert.ok(after.maxShield > before.maxShield);
  assert.notEqual(after.combatMultipliers.speed, before.combatMultipliers.speed);
  assert.notEqual(after.combatMultipliers.damage, before.combatMultipliers.damage);
  assert.ok(Math.abs(after.shield / after.maxShield - before.shield / before.maxShield) < 0.02);
  assert.equal(h.game.switchPilot(), false, 'cooldown cannot be bypassed');
  assert.equal(after.lives, before.lives);
});

test('fatal damage withdraws damaged ship and hands command to a surviving cat', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.advance(3.2);
  h.game.damage(9999);
  const damage = h.game.snapshot();
  assert.equal(damage.state, 'respawning');
  assert.equal(damage.lives, 2);
  assert.ok(damage.pilotRelay.damaged.includes('bia'));
  h.advance(1.6);
  const replaced = h.game.snapshot();
  assert.equal(replaced.state, 'playing');
  assert.equal(replaced.loadout.pilot, 'bob');
  assert.equal(replaced.lives, 2);
  assert.ok(replaced.shield > 0);
  assert.equal(replaced.pilotRelay.damaged.includes('bia'), true);
});

test('transforming after pilot replacement hides the actual new ship module', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  h.advance(0.3);
  h.key('KeyT');
  h.advance(1.3);
  const firstRobot = h.game.snapshot();
  assert.equal(firstRobot.mecha.active, true);
  assert.equal(firstRobot.shipModuleVisible, false);
  assert.equal(firstRobot.robotVisible, true);
  h.key('KeyT', false);
  assert.equal(h.game.switchPilot(), true);
  const replacedShip = h.game.snapshot();
  assert.equal(replacedShip.loadout.ship, 'aegis');
  assert.equal(replacedShip.mecha.active, false);
  assert.equal(replacedShip.shipModuleVisible, true);
  assert.equal(replacedShip.robotVisible, false);
  h.key('KeyT');
  h.advance(1.3);
  const nextRobot = h.game.snapshot();
  assert.equal(nextRobot.mecha.active, true);
  assert.equal(nextRobot.shipModuleVisible, false);
  assert.equal(nextRobot.robotVisible, true);
});
