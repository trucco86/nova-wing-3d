import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';
import { SECTORS } from '../src/campaign.js';
import { SUBBOSS_BOSS_RECOVERY_SECONDS } from '../src/encounter-separation.js';

/**
 * QA164 follows the same playable KeyQ -> side fragment -> central corridor
 * route already covered by asteroid-course-game.test.mjs, but with REAL enemy
 * spawning and the sector's normal boss gate enabled.
 */
function flyUntil(h, predicate, timeoutSeconds, label) {
  const dt = 0.1;
  for (let i = 0; i < Math.ceil(timeoutSeconds / dt); i++) {
    const state = h.game.snapshot();
    assert.notEqual(state.state, 'gameover', 'mission ended during ' + label);
    assert.equal(
      state.targets.some((enemy) => enemy.kind === 'subboss') && state.boss,
      false,
      'boss must never overlap subboss in ' + label,
    );
    if (predicate(state)) return state;
    // Preserve a live player while still running all real enemy AI, impacts,
    // spawns, asteroid colliders, stage clock and boss sequencing.
    if (i % 5 === 0) h.game.collect('shield');
    h.advance(dt, dt);
  }
  assert.fail('Timed out on normal asteroid stage: ' + label);
}

test('QA164: asteroid stage must traverse rocks before showing its real subboss', (t) => {
  const save = JSON.stringify({
    version: 1,
    sector: 2,
    credits: 250,
    weapon: 0,
    armor: 0,
    pods: 0,
    bombs: 8,
  });
  const h = harness({
    spawnEncounters: true,
    enableAsteroidCourse: true,
    storage: {
      getItem: (key) => (key === 'nova-wing-3d-v1' ? save : null),
      setItem() {},
    },
  });
  t.after(() => h.close());
  h.game.start(true);

  let state = h.game.snapshot();
  assert.equal(state.sector, 3);
  assert.equal(state.asteroidInterior.course.complete, false);
  assert.equal(
    state.targets.some((enemy) => enemy.kind === 'subboss'),
    false,
  );
  assert.equal(state.boss, false);

  // A held roll is required to physically fit the actual wing collision hull
  // through the fissure. There is no mock course-completion switch.
  h.key('KeyQ');
  state = flyUntil(h, (s) => s.asteroidInterior.course.offset > 920, 95, 'narrow fissure');
  assert.equal(state.asteroidInterior.course.complete, false);
  assert.equal(
    state.targets.some((enemy) => enemy.kind === 'subboss'),
    false,
  );
  h.key('KeyQ', false);

  h.key('KeyD');
  flyUntil(h, (s) => s.player.x >= 15, 4, 'fragment dodge to the right');
  h.key('KeyD', false);
  flyUntil(h, (s) => s.asteroidInterior.course.offset > 1220, 35, 'central fragment');
  h.key('KeyA');
  flyUntil(h, (s) => s.player.x <= 1, 4, 'return to central corridor');
  h.key('KeyA', false);

  state = flyUntil(h, (s) => s.asteroidInterior.course.complete, 55, 'course completion');
  assert.equal(state.boss, false, 'boss remains gated after leaving the asteroid rocks');
  state = flyUntil(
    h,
    (s) => s.targets.some((enemy) => enemy.kind === 'subboss'),
    20,
    'subboss arrival',
  );
  const subboss = state.targets.filter((enemy) => enemy.kind === 'subboss');
  assert.equal(subboss.length, 1, 'one real subboss, never duplicated');
  assert.ok(subboss[0].life > 0);
  assert.equal(subboss[0].tactic, 'spiral');
  assert.equal(subboss[0].attack, 'ESPIRAL PERFURANTE');
  assert.equal(h.elements.get('subHUD').hidden, false);
  assert.equal(state.boss, false);

  h.game.pause();
  const frozen = h.game.snapshot();
  h.advance(1);
  assert.deepEqual(h.game.snapshot(), frozen, 'pause freezes both encounter and game clock');
  h.game.pause();

  flyUntil(
    h,
    (s) => s.targets.some((enemy) => enemy.kind === 'subboss' && enemy.z > -130),
    9,
    'subboss attack approach',
  );
  // The real subboss has a three-second entry shield. Wait for the authored
  // combat window so the bomb proves damage, not a bypass of invulnerability.
  for (let i = 0; i < 8; i++) {
    h.game.collect('shield');
    h.advance(0.5, 0.1);
  }
  const beforeDamage = h.game.snapshot().targets.find((enemy) => enemy.kind === 'subboss').life;
  h.game.bomb();
  const after = h.game.snapshot();
  assert.ok(
    after.targets.find((enemy) => enemy.kind === 'subboss').life < beforeDamage,
    'real bomb reduces subboss HP',
  );
  assert.equal(after.boss, false, 'damaging a subboss must not launch the final boss');
  assert.equal(after.asteroidInterior.course.complete, true);

  // QA165: destroy the SAME live subboss via the public bomb mechanic. No
  // direct mutation of life/dead flags and no developer encounter shortcut.
  for (let i = 0; i < 7 && h.game.snapshot().targets.some((e) => e.kind === 'subboss'); i++)
    h.game.bomb();
  state = h.game.snapshot();
  assert.equal(
    state.targets.some((e) => e.kind === 'subboss'),
    false,
    'bomb damage must resolve the subboss and unlock the boss recovery timer',
  );
  assert.equal(h.elements.get('subHUD').hidden, true, 'subboss HUD closes on actual defeat');
  const clearedAt = state.seconds;
  assert.equal(state.boss, false);

  // The eight-second recovery cannot be skipped by the elapsed mission timer,
  // even if the asteroid course completed after the nominal boss deadline.
  for (let i = 0; i < 75; i++) {
    if (i % 5 === 0) h.game.collect('shield');
    h.advance(0.1, 0.1);
    assert.equal(h.game.snapshot().boss, false, 'no boss during the 8s recovery');
    assert.equal(h.elements.get('bossIncoming').hidden, true, 'no warning before recovery');
  }
  assert.ok(h.game.snapshot().seconds - clearedAt >= 7.4);
  // The encounter also respects the authored boss warning clock. Recovery
  // can end before the final nine seconds of an 82-second asteroid mission.
  const earliestWarning = Math.max(
    clearedAt + SUBBOSS_BOSS_RECOVERY_SECONDS,
    SECTORS[2].duration - 9,
  );
  state = flyUntil(
    h,
    () => !h.elements.get('bossIncoming').hidden,
    Math.max(3, earliestWarning - h.game.snapshot().seconds + 3),
    'post-subboss warning and mission clock',
  );
  assert.ok(state.seconds >= earliestWarning - 0.11, 'both boss timing gates must be satisfied');
  assert.equal(state.boss, false, 'warning must precede the final boss');
  assert.equal(state.asteroidInterior.course.complete, true);

  state = flyUntil(h, (s) => s.boss, 6, 'boss entrance from mothership');
  assert.equal(state.journey.phase, 'boss');
  assert.equal(state.bossParts, 2, 'both real armored generators start intact');
  assert.equal(state.bossTargets.length, 2);
  assert.equal(h.elements.get('bossHUD').hidden, false);
  assert.equal(h.game.damageBoss(1000), 0, 'boss arrival shield is functional');

  // Use normal orbit controls and the existing boss-damage budget. Direct
  // damageBoss calls exercise generator and core gates, NOT projectile aim.
  flyUntil(h, (s) => s.bossAge >= 3.1, 9, 'arrival shield expiration');
  for (let index = 0; index < 2; index++) {
    let struck = false;
    for (let i = 0; i < 700; i++) {
      state = h.game.snapshot();
      if (state.bossTargets[index].hp <= 0) break;
      const point = state.bossTargets[index];
      const delta = Math.atan2(
        Math.sin(point.angle - state.strategy.orbitAngle),
        Math.cos(point.angle - state.strategy.orbitAngle),
      );
      if (Math.abs(delta) > 0.22) h.game.orbit(Math.sign(delta));
      else {
        h.game.orbit(0);
        if (point.open && h.game.damageBoss(10000) > 0) struck = true;
      }
      if (i % 5 === 0) h.game.collect('shield');
      h.advance(0.1, 0.1);
    }
    h.game.orbit(0);
    state = h.game.snapshot();
    assert.equal(state.bossTargets[index].hp, 0, 'generator ' + index + ' can be destroyed');
    assert.ok(struck, 'generator ' + index + ' received actual budgeted damage');
    assert.equal(state.bossParts, 1 - index);
    assert.equal(state.state, 'playing');
  }

  // The boss core requires a frontal orbit and a timed vulnerability window,
  // after both flank/rear generators have been removed.
  let coreStruck = false;
  for (let i = 0; i < 1500; i++) {
    state = h.game.snapshot();
    if (state.state === 'collapsing') break;
    assert.equal(state.state, 'playing', 'boss duel must not softlock or end unexpectedly');
    const delta = Math.atan2(
      Math.sin(state.coreAngle - state.strategy.orbitAngle),
      Math.cos(state.coreAngle - state.strategy.orbitAngle),
    );
    if (Math.abs(delta) > 0.23) h.game.orbit(Math.sign(delta));
    else {
      h.game.orbit(0);
      if (state.coreOpen && h.game.damageBoss(10000) > 0) coreStruck = true;
    }
    if (i % 5 === 0) h.game.collect('shield');
    h.advance(0.1, 0.1);
  }
  h.game.orbit(0);
  state = h.game.snapshot();
  assert.ok(coreStruck, 'exposed core accepts budgeted damage after both generators');
  assert.equal(state.state, 'collapsing', 'defeating the real core starts the exit cinematic');
  assert.equal(state.journey.phase, 'escape');
  assert.equal(state.bossHp, 0);

  // The existing finale speaks through Five Cats and triggers automatic
  // light speed before returning the player to the hangar/shop.
  h.advance(5.7, 0.1);
  assert.equal(h.game.snapshot().warpDeparture, false, 'warp cannot start before 5.8s');
  h.advance(0.5, 0.1);
  state = h.game.snapshot();
  assert.equal(state.warpDeparture, true, 'automatic speed-of-light exit must activate');
  assert.equal(state.state, 'collapsing');
  const beforeWarpZ = state.playerDepth;
  h.advance(0.4, 0.1);
  assert.ok(h.game.snapshot().playerDepth < beforeWarpZ, 'pilot actually accelerates forward');
  h.advance(2, 0.1);
  state = h.game.snapshot();
  assert.equal(state.state, 'shop', 'sector 3 victory goes to normal intermission');
  assert.equal(state.journey.phase, 'complete');
  assert.equal(h.elements.get('shop').hidden, false, 'hangar/shop becomes accessible');
  assert.equal(h.elements.get('shopTitle').textContent, 'SETOR 03 LIBERTADO');
});
