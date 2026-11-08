import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

function game(t) {
  const save = JSON.stringify({
    version: 1,
    sector: 2,
    credits: 250,
    weapon: 0,
    armor: 0,
    pods: 0,
  });
  const h = harness({
    enableAsteroidCourse: true,
    storage: {
      getItem: (key) => (key === 'nova-wing-3d-v1' ? save : null),
      setItem() {},
    },
  });
  t.after(() => h.close());
  h.game.start(true);
  return h;
}
function until(h, condition, seconds = 45) {
  for (let i = 0; i < seconds * 20; i++) {
    if (condition(h.game.snapshot())) return;
    h.advance(0.05);
  }
  assert.fail('Pilot did not reach the expected physical checkpoint');
}
const offset = (h) => h.game.snapshot().asteroidInterior.course.offset;

test('holding and releasing GIRO in the real game preserves hull clearance and pause', (t) => {
  const h = game(t);
  until(h, (s) => s.asteroidInterior.course.blocked);
  const stopped = offset(h);
  h.key('KeyQ');
  h.advance(0.6);
  assert.ok(offset(h) > stopped + 20);
  h.key('KeyQ', false);
  h.advance(0.15);
  assert.ok(h.game.snapshot().bankAngle < -1.4, 'rock prevents opening the wings inside the slit');
  h.game.pause();
  const paused = offset(h);
  h.advance(2);
  assert.equal(offset(h), paused);
  h.game.pause();
  h.advance(2);
  assert.ok(Math.abs(h.game.snapshot().bankAngle) < 0.1);
  assert.ok(offset(h) > paused + 80);
});

test('respawn inside the slit backs out continuously and allows banking again', (t) => {
  const h = game(t);
  h.key('KeyE');
  until(h, (s) => s.asteroidInterior.course.offset > 850);
  const impactOffset = offset(h);
  h.game.damage(1000);
  assert.equal(h.game.snapshot().state, 'respawning');
  h.advance(1.6);
  h.key('KeyE');
  h.advance(3);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.ok(offset(h) > impactOffset + 50, 'recovered pilot must leave the rock');
});

test('robot can return to the longer ship after frontal rock contact', (t) => {
  const h = game(t);
  h.key('KeyT');
  h.key('KeyT', false);
  until(h, (s) => s.asteroidInterior.course.blocked);
  assert.equal(h.game.snapshot().mecha.active, true);
  h.key('KeyT');
  h.key('KeyT', false);
  h.advance(0.4);
  assert.equal(h.game.snapshot().mecha.active, false, 'recede before unfolding the longer chassis');
  h.key('KeyQ');
  h.advance(2);
  assert.ok(offset(h) > 900);
});

test('slit, alternate fragment route and open arena are traversable with normal inputs', (t) => {
  const h = game(t);
  h.key('KeyQ');
  until(h, (s) => s.asteroidInterior.course.offset > 920);
  h.key('KeyQ', false);
  h.key('KeyD');
  until(h, (s) => s.player.x >= 15, 3);
  h.key('KeyD', false);
  until(h, (s) => s.asteroidInterior.course.offset > 1220, 10);
  h.key('KeyA');
  until(h, (s) => s.player.x <= 1, 3);
  h.key('KeyA', false);
  until(h, (s) => s.asteroidInterior.course.complete, 25);
  until(h, (s) => s.boss, 40);
  assert.equal(h.game.snapshot().journey.phase, 'boss');
});
