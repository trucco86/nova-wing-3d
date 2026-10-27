import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_JOURNEYS, initialJourney, advanceJourney, journeyForSector } from '../src/stage-journey.js';

test('all ten sectors have distinct destinations and playable transition profiles', () => {
  assert.equal(STAGE_JOURNEYS.length, 10);
  assert.equal(new Set(STAGE_JOURNEYS.map((journey) => journey.destination)).size, 10);
  for (const journey of STAGE_JOURNEYS) {
    assert.ok(journey.entry && journey.arena && journey.exit);
  }
});

test('mega-asteroid boss gate blocks premature escape', () => {
  let state = initialJourney(2);
  assert.equal(state.destination, 'mega-asteroid');
  state = advanceJourney(state, 'destinationReached');
  state = advanceJourney(state, 'entryCompleted');
  state = advanceJourney(state, 'arenaReached');
  assert.equal(state.phase, 'boss');
  assert.equal(advanceJourney(state, 'exitReached'), state);
  assert.equal(advanceJourney(state, 'entryCompleted'), state);
  state = advanceJourney(state, 'bossDefeated');
  assert.equal(state.phase, 'escape');
  assert.equal(advanceJourney(state, 'exitReached').phase, 'complete');
});

test('invalid sectors and phases are rejected', () => {
  assert.throws(() => initialJourney(-1), RangeError);
  assert.throws(() => journeyForSector(10), RangeError);
  assert.throws(() => advanceJourney({ phase: 'unknown' }, 'arenaReached'), TypeError);
});
