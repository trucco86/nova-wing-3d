import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { harness } from './harness.mjs';
import { createFlyingRobot } from '../src/visuals.js';
import { animatePremiumMecha } from '../src/mecha-premium.js';
import { createObstacle } from '../src/encounters.js';
import { projectileHitsApproachingObstacle } from '../src/flight.js';
import {
  MECHA_DASH, heldBankAngle, dashDirection, dashFrame,
  heroVisualScale, shipCollisionMargin,
} from '../src/hero-dodge-controls.js';
import { breakableHullHealth, damageBreakableHull } from '../src/breakable-encounters.js';

test('hero size is capped for narrow halls, ship holds edge-on bank with actual clearance', () => {
  assert.ok(heroVisualScale(18) < 1.14);
  assert.ok(heroVisualScale(0) === 1);
  assert.equal(heldBankAngle({ held: true }), -Math.PI / 2);
  assert.equal(heldBankAngle({ robot: true, held: true }), 0);
  assert.equal(shipCollisionMargin(false, true), 0.92);
  assert.equal(shipCollisionMargin(true, true), 1.3);
  assert.equal(shipCollisionMargin(false, false), 1.3);
});

test('mecha dash lasts 240ms and never bypasses cooldown or frame-rate limits', () => {
  assert.equal(dashDirection(1, 5), 1);
  assert.equal(dashDirection(-1, -5), -1);
  assert.equal(dashDirection(0, 6), -1);
  assert.equal(dashDirection(0, -6), 1);
  const distanceAt = (fps) => {
    let remain = MECHA_DASH.duration;
    let move = 0;
    for (let i=0; i<fps; i++) {
      const state = dashFrame(remain, 1/fps, 1);
      remain = state.remaining;
      move += state.displacement;
    }
    assert.equal(remain, 0);
    return move;
  };
  for (const fps of [30, 60, 120])
    assert.ok(Math.abs(distanceAt(fps) - MECHA_DASH.distance) < 1e-8);
  assert.throws(() => dashFrame(0.3, -0.1, 1), RangeError);
});

test('real touch hold turns ship vertical; mecha roll button becomes lateral dash', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  assert.equal(h.elements.get('rollTouch').textContent, 'GIRO');
  assert.ok(h.game.snapshot().shipScale <= 1.03);
  h.elements.get('rollTouch').onpointerdown({ pointerId: 7, preventDefault() {} });
  h.advance(0.45);
  assert.ok(Math.abs(h.game.snapshot().bankAngle + Math.PI/2) < 0.04);
  h.elements.get('rollTouch').emit('pointercancel', { pointerId: 7, type: 'pointercancel' });
  h.advance(0.4);
  assert.ok(Math.abs(h.game.snapshot().bankAngle) < 0.02);
  h.key('KeyT');
  h.advance(1.35);
  assert.equal(h.elements.get('rollTouch').textContent, 'DASH');
  assert.ok(h.game.snapshot().robotScale <= 1);
  const initial = h.game.snapshot().player.x;
  h.key('KeyD');
  h.game.roll();
  assert.equal(h.game.snapshot().dash.active, true);
  h.advance(0.12);
  const during = h.game.snapshot();
  assert.ok(during.player.x > initial + 4, 'DASH moves the robot sideways');
  assert.ok(during.dash.cooldown > 0);
  h.game.roll();
  const same = h.game.snapshot().dash.remaining;
  assert.ok(same <= MECHA_DASH.duration, 'spam cannot restart the dash');
  h.advance(0.3);
  assert.equal(h.game.snapshot().dash.active, false);
  h.key('KeyD', false);
});

test('robot boosts with visible paired afterburners and layered back details', () => {
  const robot = createFlyingRobot();
  assert.ok(robot.getObjectByName('premium-dorsal-heat-sink--1-0'));
  assert.ok(robot.getObjectByName('premium-spinal-reactor-cover-1-2'));
  assert.ok(robot.getObjectByName('premium-back-vector-fin-1'));
  const normal = animatePremiumMecha(robot,{ progress:1, level:0, time:1, boosting:false });
  assert.equal(normal.phase,'energize');
  assert.ok(robot.userData.premiumMecha.exhausts.every(o=>!o.visible));
  animatePremiumMecha(robot,{ progress:1, level:18, time:2, boosting:true });
  assert.equal(robot.userData.premiumMecha.exhausts.length,2);
  assert.ok(robot.userData.premiumMecha.exhausts.every(o=>o.visible&&o.scale.y>1.5));
});

test('only hostile satellites and carriers can be destroyed by real projectile geometry', () => {
  for (const kind of ['satellite','carrier']) {
    const obstacle = createObstacle(kind);
    assert.ok(obstacle.userData.solids.length > 0);
    const collision = obstacle.userData.solids[0];
    const from = collision.center.clone().add(new T.Vector3(0,0,65));
    const to = collision.center.clone().add(new T.Vector3(0,0,-65));
    assert.equal(projectileHitsApproachingObstacle(from,to,obstacle,0),true,kind);
    let hp = breakableHullHealth(kind);
    assert.ok(hp>0);
    const early = damageBreakableHull(hp, 30);
    assert.equal(early.destroyed,false);
    hp = early.health;
    const terminal = damageBreakableHull(hp, hp);
    assert.equal(terminal.destroyed,true);
    assert.equal(terminal.health,0);
  }
  for (const kind of ['tunnel','debris','gantry','reactor']) {
    assert.equal(breakableHullHealth(kind),null);
    assert.ok(createObstacle(kind).userData.solids.length > 0);
  }
  assert.equal(damageBreakableHull(70,Number.NaN).health,70);
});
