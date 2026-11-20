import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

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
  assert.equal(state.targets.some((enemy) => enemy.kind === 'subboss'), false);
  assert.equal(state.boss, false);

  // A held roll is required to physically fit the actual wing collision hull
  // through the fissure. There is no mock course-completion switch.
  h.key('KeyQ');
  state = flyUntil(h, (s) => s.asteroidInterior.course.offset > 920, 95, 'narrow fissure');
  assert.equal(state.asteroidInterior.course.complete, false);
  assert.equal(state.targets.some((enemy) => enemy.kind === 'subboss'), false);
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
  state = flyUntil(h, (s) => s.targets.some((enemy) => enemy.kind === 'subboss'), 20, 'subboss arrival');
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

  flyUntil(h, (s) => s.targets.some((enemy) => enemy.kind === 'subboss' && enemy.z > -130), 9, 'subboss attack approach');
  // The real subboss has a three-second entry shield. Wait for the authored
  // combat window so the bomb proves damage, not a bypass of invulnerability.
  for (let i = 0; i < 8; i++) {
    h.game.collect('shield');
    h.advance(0.5, 0.1);
  }
  const beforeDamage = h.game.snapshot().targets.find((enemy) => enemy.kind === 'subboss').life;
  h.game.bomb();
  const after = h.game.snapshot();
  assert.ok(after.targets.find((enemy) => enemy.kind === 'subboss').life < beforeDamage, 'real bomb reduces subboss HP');
  assert.equal(after.boss, false, 'damaging a subboss must not launch the final boss');
  assert.equal(after.asteroidInterior.course.complete, true);
});
