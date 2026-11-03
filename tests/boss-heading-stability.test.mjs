import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TACTICS, bossTacticsAt, wrapAngle } from '../src/tactics.js';

test('every boss faces continuously when tactical states or attack cycles change', () => {
  for (let sector = 0; sector < BOSS_TACTICS.length; sector++) {
    const step = 1 / 60;
    const duration = 8 + BOSS_TACTICS[sector].period * 5;
    let previous = bossTacticsAt(sector, 8).heading;
    for (let age = 8 + step; age <= duration; age += step) {
      const facing = bossTacticsAt(sector, age).heading;
      const jump = Math.abs(wrapAngle(facing - previous));
      assert.ok(
        jump < 0.08,
        'boss ' + sector + ' snapped at ' + age.toFixed(3) + 's: ' + jump,
      );
      previous = facing;
    }
  }
});

test('boss attack and vulnerability windows keep their original timing', () => {
  for (let sector = 0; sector < BOSS_TACTICS.length; sector++) {
    const period = BOSS_TACTICS[sector].period;
    assert.equal(bossTacticsAt(sector, 9).state, 'windup');
    assert.equal(bossTacticsAt(sector, 10.5).state, 'attack');
    assert.equal(bossTacticsAt(sector, 12).state, 'recovery');
    assert.equal(bossTacticsAt(sector, 8 + period + 0.1).state, 'windup');
    assert.ok(Number.isFinite(bossTacticsAt(sector, 30).dangerAngle));
  }
});
