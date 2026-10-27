import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBBOSS_TACTICS,
  subbossProfile,
  subbossMotion,
  subbossCooldown,
  subbossWindup,
  FIRST_SUBBOSS_RETREAT,
  firstSubbossDeparture,
} from '../src/subboss-tactics.js';

test('ten subboss profiles expose distinct readable tactics', () => {
  assert.equal(SUBBOSS_TACTICS.length, 10);
  assert.equal(new Set(SUBBOSS_TACTICS.map((profile) => profile.attack)).size, 10);
  assert.equal(new Set(SUBBOSS_TACTICS.map((profile) => profile.motion)).size, 10);
  for (const profile of SUBBOSS_TACTICS) {
    assert.match(profile.color, /^#[0-9a-f]{6}$/i);
    assert.ok(profile.aim.length >= 1 && profile.aim.length <= 3);
    assert.ok(profile.approach > 2);
  }
  assert.equal(subbossProfile(10), SUBBOSS_TACTICS[0]);
  assert.equal(subbossProfile(-1), SUBBOSS_TACTICS[9]);
});

test('subboss motion approaches quickly and remains inside the combat envelope', () => {
  const positions = SUBBOSS_TACTICS.map((_, index) => subbossMotion(index, 1.5, 2));
  for (const position of positions) {
    assert.ok(position.z > -105 && position.z < -65);
    assert.ok(Math.abs(position.x) <= 36);
    assert.ok(position.y >= -8 && position.y <= 28);
    assert.ok([position.x, position.y, position.z, position.bank].every(Number.isFinite));
  }
  assert.ok(new Set(positions.map((position) => position.x.toFixed(2))).size >= 8);
  const late = subbossMotion(4, 20, 3);
  assert.ok(late.z > -82 && late.z < -65);
});

test('later phases shorten cooldown while keeping a visible windup', () => {
  for (let index = 0; index < SUBBOSS_TACTICS.length; index++) {
    assert.ok(subbossCooldown(index, 1) > subbossCooldown(index, 2));
    assert.ok(subbossCooldown(index, 2) > subbossCooldown(index, 3));
    assert.ok(subbossCooldown(index, 3) >= 0.7);
    assert.ok(subbossWindup(index, 1) > subbossWindup(index, 3));
    assert.ok(subbossWindup(index, 3) >= 0.42);
  }
});

test('first urban subboss has finite combat and a visible departure, others keep their tactics', () => {
  assert.deepEqual(firstSubbossDeparture(0, 18), {
    retreating: false,
    complete: false,
    progress: 0,
  });
  const before = subbossMotion(0, FIRST_SUBBOSS_RETREAT.startAge - 0.1);
  const escaping = firstSubbossDeparture(0, FIRST_SUBBOSS_RETREAT.startAge + 2);
  const inFlight = subbossMotion(0, FIRST_SUBBOSS_RETREAT.startAge + 2);
  const final = subbossMotion(0, FIRST_SUBBOSS_RETREAT.startAge + FIRST_SUBBOSS_RETREAT.duration);
  assert.equal(escaping.retreating, true);
  assert.equal(escaping.complete, false);
  assert.ok(inFlight.z < before.z - 90, 'withdrawal opens the forward view gradually');
  assert.ok(inFlight.y > before.y, 'the subboss visibly climbs during departure');
  assert.ok(final.z < -340, 'retreat ends safely beyond the enemy camera lane');
  assert.equal(
    firstSubbossDeparture(0, FIRST_SUBBOSS_RETREAT.startAge + FIRST_SUBBOSS_RETREAT.duration)
      .complete,
    true,
  );
  assert.equal(firstSubbossDeparture(1, 400).retreating, false);
  assert.ok(subbossMotion(1, 400).z > -100, 'later missions keep their full subboss fight');
});
