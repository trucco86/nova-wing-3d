import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createExplorationQuest, EXPLORATION_SAVE_KEY, readExplorationSave,
  validateExplorationState, ORBIT9_CLUES, WORLD_NODES,
} from '../src/exploration-quest.js';

function memoryStore(seed = {}) {
  const data = new Map(Object.entries(seed));
  const writes = [];
  return {
    data, writes,
    getItem: (key) => data.get(key) ?? null,
    setItem(key, value) { writes.push(key); data.set(key, value); },
  };
}

test('Five Cats hub to Orbit-9 investigation unlocks a distinct combat mission and Orion gate', () => {
  const storage = memoryStore({ 'nova-wing-3d-v1': 'UNCHANGED LEGACY CHECKPOINT' });
  const quest = createExplorationQuest({ storage });
  assert.equal(quest.travel('orion'), false);
  assert.equal(quest.inspect('relay'), false, 'No clues from the hub');
  assert.equal(quest.travel('orbit9'), true);
  assert.equal(quest.choose('restore-power'), false, 'Dialog cannot bypass three clues');
  for (const clue of ORBIT9_CLUES) assert.equal(quest.inspect(clue), true);
  assert.equal(quest.inspect('relay'), false, 'No farming duplicate clues');
  assert.equal(quest.choose('restore-power'), true);
  assert.equal(quest.nextMission(), 'defend-reactor');
  assert.equal(quest.launchMission(), true);
  assert.equal(quest.completeMission('intercept-smugglers'), false);
  assert.equal(quest.completeMission('defend-reactor'), true);
  assert.equal(quest.travel('orion'), true);
  assert.equal(quest.snapshot().location, 'orion');
  assert.equal(quest.snapshot().mission, 'done');
  assert.equal(storage.data.get('nova-wing-3d-v1'), 'UNCHANGED LEGACY CHECKPOINT');
  assert.ok(storage.writes.every((key) => key === EXPLORATION_SAVE_KEY));
  assert.deepEqual(createExplorationQuest({ storage }).snapshot(), quest.snapshot());
});

test('a different dialogue choice creates a different mission and remains immutable', () => {
  const q = createExplorationQuest({ storage: memoryStore() });
  q.travel('orbit9');
  for (const clue of ORBIT9_CLUES) q.inspect(clue);
  assert.equal(q.choose('shadow-route'), true);
  assert.equal(q.nextMission(), 'intercept-smugglers');
  assert.equal(q.choose('restore-power'), false, 'Choice locked once accepted');
  assert.equal(q.launchMission(), true);
  assert.equal(q.completeMission('intercept-smugglers'), true);
  assert.ok(q.snapshot().visited.includes('orbit9'));
});

test('QA scenario is isolated, can simulate progress but never writes local or remote state', () => {
  const storage = memoryStore({ [EXPLORATION_SAVE_KEY]: 'not-json' });
  const q = createExplorationQuest({ storage, qa: true });
  assert.equal(q.isQa(), true);
  assert.equal(q.travel('orbit9'), true);
  ORBIT9_CLUES.forEach((clue) => q.inspect(clue));
  assert.equal(q.choose('restore-power'), true);
  assert.equal(q.launchMission(), true);
  assert.equal(q.completeMission('defend-reactor'), true);
  assert.equal(q.travel('orion'), true);
  assert.equal(q.save(), false);
  assert.equal(storage.writes.length, 0);
  assert.equal(storage.data.get(EXPLORATION_SAVE_KEY), 'not-json');
});

test('corrupted or forged checkpoints do not expose locked planets or clobber campaign', () => {
  const storage = memoryStore({ [EXPLORATION_SAVE_KEY]: JSON.stringify({
    version: 1, location: 'orion', visited: ['hub', 'orion'],
    clues: [], choice: null, mission: 'locked', completedMission: null,
  }) });
  assert.equal(readExplorationSave(storage), null);
  const q = createExplorationQuest({ storage });
  assert.equal(q.snapshot().location, 'hub');
  assert.equal(q.travel('orion'), false);
  assert.equal(validateExplorationState({ __proto__: null, version: 10 }), null);
  assert.equal(Object.keys(WORLD_NODES).length, 3);
  assert.equal(q.inspect('__proto__'), false);
});

test('save failures are nonfatal and snapshots cannot mutate internal progression', () => {
  const q = createExplorationQuest({
    storage: { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } },
  });
  assert.equal(q.travel('orbit9'), true);
  assert.equal(q.save(), false);
  const copy = q.snapshot();
  copy.visited.push('orion');
  copy.clues.push('relay');
  assert.equal(q.snapshot().visited.includes('orion'), false);
  assert.equal(q.snapshot().clues.includes('relay'), false);
});
