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
