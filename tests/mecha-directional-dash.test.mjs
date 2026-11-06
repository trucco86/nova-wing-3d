import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMechaDash, mechaDashDirection, MECHA_DASH } from '../src/mecha-dash.js';
import { harness } from './harness.mjs';

const setup = (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: false });
  t.after(() => h.close());
  h.game.start();
  h.advance(3.2, 0.1);
  return h;
};

test('dash direction prefers steering, then Q/E, then the last chosen side', () => {
  assert.equal(mechaDashDirection({ stickX: -0.8, key: 'KeyE' }), -1);
  assert.equal(mechaDashDirection({ left: true, key: 'KeyE' }), -1);
  assert.equal(mechaDashDirection({ right: true, key: 'KeyQ' }), 1);
  assert.equal(mechaDashDirection({ key: 'KeyQ' }), -1);
  assert.equal(mechaDashDirection({ key: 'KeyE' }), 1);
  assert.equal(mechaDashDirection({ key: 'KeyZ', previous: -1 }), -1);
  assert.equal(mechaDashDirection({ previous: -1 }), -1);
  assert.equal(mechaDashDirection({ stickX: Number.NaN, previous: 1 }), 1);
});

test('dash travels lateral without overshooting, is deterministic at 30/60fps and has a cooldown', () => {
  const run = (hz, side = 1, start = 0, limit = 35) => {
    const dash = createMechaDash();
    assert.equal(dash.begin(side, start, limit), true);
    let x = start;
    for (let frame = 0; frame < hz; frame++) x = dash.advance(1 / hz, x, limit);
    assert.equal(dash.active, false);
    assert.ok(dash.snapshot().cooldown > 0 && dash.snapshot().cooldown < MECHA_DASH.cooldown);
    assert.equal(dash.begin(side, x, limit), false, 'no repeated dash during cooldown');
    return x;
  };
  assert.ok(Math.abs(run(30) - 13) < 0.001);
  assert.ok(Math.abs(run(60) - 13) < 0.001);
  assert.ok(Math.abs(run(30, -1) + 13) < 0.001);
  assert.ok(Math.abs(run(60, -1) + 13) < 0.001);
  assert.equal(run(60, 1, 30, 35), 35, 'respects arena boundary');
});

test('a wall-facing dash cannot consume resources for invulnerability', () => {
  const dash = createMechaDash();
  assert.equal(dash.begin(-1, -35, 35), false);
  assert.equal(dash.active, false);
  assert.equal(dash.snapshot().cooldown, 0);
  assert.equal(dash.begin(1, -35, 35), true);
  dash.reset();
  assert.equal(dash.snapshot().cooldown, 0);
  assert.equal(dash.active, false);
});

test('robot uses a lateral dash instead of barrel roll and becomes briefly evasive', (t) => {
  const h = setup(t);
  h.key('KeyT');
  const before = h.game.snapshot();
  assert.equal(before.mecha.active, true);
  h.key('KeyQ');
  let dodge = h.game.snapshot();
  assert.equal(dodge.mecha.dash.active, true);
  assert.equal(dodge.mecha.dash.direction, -1);
  assert.equal(dodge.rolling, false, 'robot must never execute ship barrel roll');
  assert.equal(before.energy - dodge.energy, MECHA_DASH.energy);
  const shield = dodge.shield;
  h.game.damage(15);
  assert.equal(h.game.snapshot().shield, shield, 'dash grants brief dodge i-frames');
  h.advance(0.3, 0.02);
  dodge = h.game.snapshot();
  assert.ok(dodge.player.x < before.player.x - 8, 'character changes lane to the left');
  assert.equal(dodge.mecha.dash.active, false);
  h.game.damage(15);
  assert.equal(h.game.snapshot().shield, shield - 15, 'invulnerability ends with dash');
  h.key('KeyE');
  assert.equal(h.game.snapshot().mecha.dash.active, false, 'dash cooldown prevents spam');
  h.advance(1.6, 0.05);
  h.key('KeyE');
  assert.equal(h.game.snapshot().mecha.dash.direction, 1);
  assert.equal(h.game.snapshot().mecha.dash.active, true);
});

test('ship retains the original defensive 360 roll and Mars objective rejects robot dash', (t) => {
  const h = setup(t);
  h.game.roll();
  assert.equal(h.game.snapshot().rolling, true);
  h.advance(0.7, 0.05);
  h.key('KeyT');
  const before = h.game.snapshot();
  h.game.roll();
  assert.equal(h.game.snapshot().rolling, false);
  assert.equal(h.game.snapshot().mecha.dash.active, true);
  assert.equal(h.game.snapshot().marsPendingRoll, false);
  assert.equal(h.game.snapshot().marsCleanse, 0);
  assert.ok(h.game.snapshot().player.x === before.player.x, 'dash movement integrates over frames');
});

test('pause freezes dash position and cooldown; sector reset clears it', (t) => {
  const h = setup(t);
  h.key('KeyT');
  h.key('KeyE');
  h.advance(0.08, 0.02);
  h.game.pause();
  const frozen = h.game.snapshot();
  h.advance(1.4, 0.1);
  assert.deepEqual(h.game.snapshot(), frozen);
  h.game.pause();
  h.advance(0.4, 0.02);
  assert.equal(h.game.snapshot().mecha.dash.active, false);
  h.game.start();
  assert.equal(h.game.snapshot().mecha.dash.cooldown, 0);
  assert.equal(h.game.snapshot().mecha.dash.active, false);
});

test('mobile DASH reacts at touch-down and uses the direction selected by the virtual stick', (t) => {
  const h = setup(t);
  h.key('KeyT');
  const button = h.elements.get('rollTouch');
  assert.equal(button.textContent, 'DASH');
  assert.equal(button['aria-label'], 'Esquiva lateral do robô na direção do direcional');
  const stick = h.elements.get('stick');
  stick.onpointerdown?.({
    pointerId: 13,
    clientX: 50,
    clientY: 50,
    preventDefault() {},
  });
  stick.emit('pointermove', { pointerId: 13, clientX: 0, clientY: 50, preventDefault() {} });
  const start = h.game.snapshot().player.x;
  button.onpointerdown({ pointerId: 17, preventDefault() {} });
  assert.equal(h.game.snapshot().mecha.dash.direction, -1);
  assert.equal(h.game.snapshot().mecha.dash.active, true, 'touch-down starts dash immediately');
  assert.equal(h.game.snapshot().rolling, false);
  h.advance(0.26, 0.02);
  assert.ok(h.game.snapshot().player.x < start - 8);
  button.emit('pointerup', { pointerId: 17 });
  assert.equal(h.game.snapshot().rolling, false, 'touch release cannot trigger a second roll');
});

test('Mars dust still requires the ship spins even after a completed robot dash', (t) => {
  const h = harness({ spawnEncounters: false, hostname: 'localhost' });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(1, 'stage'), true);
  h.advance(84.4, 0.1);
  assert.equal(h.game.snapshot().marsCleanse, 3);
  h.key('KeyT');
  assert.equal(h.elements.get('rollTouch').textContent, 'DASH');
  h.key('KeyA');
  h.key('KeyZ');
  h.key('KeyA', false);
  h.advance(0.4, 0.02);
  assert.equal(h.game.snapshot().marsCleanse, 3);
  assert.equal(h.game.snapshot().rolling, false);
  assert.equal(h.game.snapshot().marsPendingRoll, false);
  h.advance(2.3, 0.1);
  h.key('KeyT');
  assert.equal(h.game.snapshot().mecha.active, false);
  assert.equal(h.elements.get('rollTouch').textContent, 'GIRO');
  h.game.roll();
  h.advance(0.72, 0.02);
  assert.equal(h.game.snapshot().marsCleanse, 2, 'ship spins still clean dust');
});
