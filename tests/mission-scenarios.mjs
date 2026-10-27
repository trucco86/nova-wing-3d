import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';

/**
 * Advance the actual playable launch with keyboard BOOST and elapsed simulation time.
 * Never sets orbit/boss state directly. Used by campaign and boss tests that are
 * interested in combat after the player has completed the launch challenge.
 */
export function completeFirstLaunch(h, { dt = 0.1 } = {}) {
  let s = h.game.snapshot();
  assert.equal(s.sector, 1, 'only sector one needs the BOOST-gated launch');
  if (s.orbitalLaunch.phase === 'city') {
    h.advance(Math.max(0, 23 - s.seconds), dt);
    s = h.game.snapshot();
  }
  if (s.orbitalLaunch.phase === 'boost') {
    // Give earlier combat / test actions enough time to recharge a depleted BOOST.
    if (s.energy < 99) {
      h.advance((100 - s.energy) / 15 + 0.2, dt);
      s = h.game.snapshot();
    }
    assert.equal(s.orbitalLaunch.phase, 'boost');
    h.key('ShiftLeft', true);
    h.advance(3.55, dt);
    h.key('ShiftLeft', false);
    s = h.game.snapshot();
    assert.equal(s.orbitalLaunch.phase, 'atmosphere');
    assert.ok(s.orbitalLaunch.exhaustedAt <= 5);
  }
  if (s.orbitalLaunch.phase === 'atmosphere') {
    h.advance(Math.max(0, 38.2 - s.orbitalLaunch.atmosphereSeconds), dt);
    s = h.game.snapshot();
  }
  assert.equal(s.orbitalLaunch.phase, 'orbit');
  assert.equal(s.orbitalLaunch.complete, true);
  return s;
}

export function approachFirstBoss(h, { secondsBefore = 8, dt = 0.1 } = {}) {
  completeFirstLaunch(h, { dt });
  const s = h.game.snapshot();
  h.advance(Math.max(0, SECTORS[0].duration - secondsBefore - s.seconds), dt);
  return h.game.snapshot();
}

export function reachSectorBoss(h, { bossAge = 0.15, dt = 0.1 } = {}) {
  let s = h.game.snapshot();
  if (s.sector === 1) s = completeFirstLaunch(h, { dt });
  const duration = SECTORS[s.sector - 1].duration;
  h.advance(Math.max(0, duration + bossAge - s.seconds), dt);
  s = h.game.snapshot();
  assert.equal(s.boss, true, 'boss should appear only after its real mission timer and gates');
  return s;
}

/** Verify boss armor is actually closed after its arrival shield wears off. */
export function waitForArmoredFront(h, { dt = 0.05, maxSeconds = 35 } = {}) {
  for (let i = 0; i < maxSeconds / dt; i++) {
    const s = h.game.snapshot();
    if (s.bossAge >= 3.1 && s.bossTargets.length === 2 && s.bossTargets.every((p) => !p.open)) {
      h.game.orbit(0);
      return s;
    }
    h.advance(dt, dt);
  }
  assert.fail('boss must present a shielded frontal interval after initial approach');
}

/** Orbit with the real player controls until a living generator is exposed. */
export function aimAtFirstGenerator(h, { dt = 0.05, maxSeconds = 9 } = {}) {
  for (let i = 0; i < maxSeconds / dt; i++) {
    const s = h.game.snapshot();
    assert.equal(s.arena, true);
    const point = s.bossTargets[0];
    assert.ok(point?.hp > 0, 'first generator must still exist');
    const delta = Math.atan2(
      Math.sin(point.angle - s.strategy.orbitAngle),
      Math.cos(point.angle - s.strategy.orbitAngle),
    );
    if (point.open && Math.abs(delta) < 0.35 && s.bossAge >= 3) {
      h.game.orbit(0);
      return s;
    }
    h.game.orbit(Math.sign(delta));
    h.advance(dt, dt);
  }
  h.game.orbit(0);
  assert.fail('first generator must expose a reachable orbital weak point');
}
