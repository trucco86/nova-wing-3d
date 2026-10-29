import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceSectorObjective,
  initialSectorObjective,
  sectorObjectiveAt,
} from '../src/sector-objectives.js';

test('five distinct optional sector flight objectives respect existing campaign gates', () => {
  const sectorIds = [1, 4, 5, 7, 8];
  const ids = sectorIds.map((sector) => sectorObjectiveAt(sector).id);
  assert.equal(new Set(ids).size, sectorIds.length);
  for (let sector = 0; sector < 10; sector++) {
    assert.equal(!!sectorObjectiveAt(sector), sectorIds.includes(sector));
  }
  assert.equal(initialSectorObjective(0).status, 'none');
  assert.throws(() => sectorObjectiveAt(10), RangeError);
});

test('target lane rewards require sustained pilot movement, not elapsed time alone', () => {
  const mission = sectorObjectiveAt(1);
  let state = initialSectorObjective(1);
  let step = advanceSectorObjective(state, mission, 27, 80, { x: 0, y: 6 }, 0.1);
  assert.equal(step.state.status, 'pending');
  step = advanceSectorObjective(step.state, mission, 28, 80, { x: 0, y: 6 }, 0.1);
  assert.equal(step.event, 'started');
  assert.equal(step.state.hold, 0);
  for (let i = 0; i < 20; i++) {
    step = advanceSectorObjective(
      step.state,
      mission,
      29 + i * 0.1,
      80,
      { x: mission.x, y: mission.y },
      0.1,
    );
  }
  assert.equal(step.state.status, 'active');
  assert.ok(step.state.hold >= 1.9 && step.state.hold < 2.1);
  step = advanceSectorObjective(step.state, mission, 31.1, 80, { x: -55, y: 6 }, 0.1);
  assert.ok(step.state.hold < 2);
  let completionEvents = 0;
  for (let i = 0; i < 14; i++) {
    step = advanceSectorObjective(
      step.state,
      mission,
      31.2 + i * 0.1,
      80,
      { x: mission.x, y: mission.y },
      0.1,
    );
    if (step.event === 'completed') completionEvents++;
  }
  assert.equal(step.state.status, 'completed');
  assert.equal(completionEvents, 1);
  assert.equal(
    advanceSectorObjective(step.state, mission, 35, 80, { x: mission.x, y: mission.y }, 1).event,
    null,
  );
});

test('mission expiry never damages player or unlocks a boss prematurely', () => {
  const plan = sectorObjectiveAt(5);
  let state = initialSectorObjective(5);
  const result = advanceSectorObjective(state, plan, 60, 92, { x: 0, y: 6 }, 0.1);
  assert.equal(result.state.status, 'missed');
  assert.equal(result.event, 'missed');
  assert.equal(
    advanceSectorObjective(result.state, plan, 70, 92, { x: plan.x, y: plan.y }, 3).state.status,
    'missed',
  );
  assert.throws(() => advanceSectorObjective(state, plan, 30, 92, { x: 0, y: 6 }, -1), RangeError);
});
