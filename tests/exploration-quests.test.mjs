import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPLORATION_SAVE_KEY, GALAXY_GRAPH, ORBIT9_EVIDENCE,
  createExplorationState, questStatus, canTravel, travelTo, inspectEvidence,
  talkToSurvivor, completeExplorationMission, claimExplorationReward,
  loadExploration, saveExploration,
} from '../src/exploration-quests.js';

function readyInvestigation() {
  let s = createExplorationState();
  s = travelTo(s, 'orbit-9-ruins').state;
  for (const evidence of ORBIT9_EVIDENCE)
    s = inspectEvidence(s, evidence.id).state;
  return s;
}

test('galaxy exploration begins at the Five Cats base with story route locked', () => {
  const s = createExplorationState();
  assert.equal(s.location, 'five-cats-base');
  assert.equal(GALAXY_GRAPH.length, 4);
  assert.equal(canTravel(s, 'orbit-9-ruins'), true);
  assert.equal(canTravel(s, 'orion-ghost-route'), false);
  assert.equal(canTravel(s, 'hidden-planet'), false);
  assert.deepEqual(questStatus(s), {
    found: 0, required: 3, survivorSpokenTo: false,
    missionUnlocked: false, planetUnlocked: false, complete: false,
  });
  assert.equal(travelTo(s, 'orion-ghost-route').reason, 'route-locked');
});

test('clues are unique, contextual and validated before survivor dialogue', () => {
  let s = createExplorationState();
  assert.equal(inspectEvidence(s, 'transmission-a').reason, 'wrong-location');
  s = travelTo(s, 'orbit-9-ruins').state;
  assert.equal(inspectEvidence(s, 'fake').reason, 'unknown-evidence');
  assert.equal(talkToSurvivor(s, 'restore-power').reason, 'missing-evidence');
  s = inspectEvidence(s, 'transmission-a').state;
  assert.equal(inspectEvidence(s, 'transmission-a').reason, 'already-collected');
  for (const evidence of ORBIT9_EVIDENCE.slice(1))
    s = inspectEvidence(s, evidence.id).state;
  assert.equal(questStatus(s).found, 3);
  assert.equal(talkToSurvivor(s, 'invalid').reason, 'unknown-choice');
});

test('investigation and NPC decision unlock a rail encounter, then next planet', () => {
  let s = readyInvestigation();
  assert.equal(canTravel(s, 'orion-ghost-route'), false);
  s = talkToSurvivor(s, 'restore-power').state;
  assert.equal(talkToSurvivor(s, 'hidden-route').reason, 'choice-final');
  assert.equal(canTravel(s, 'orion-ghost-route'), true);
  s = travelTo(s, 'orion-ghost-route').state;
  assert.equal(completeExplorationMission(s, 'defeat').reason, 'no-victory');
  s = completeExplorationMission(s, 'victory').state;
  assert.equal(canTravel(s, 'hidden-planet'), true);
  assert.equal(claimExplorationReward(s).reward.credits, 300);
  s = claimExplorationReward(s).state;
  assert.equal(questStatus(s).complete, true);
  assert.equal(claimExplorationReward(s).reason, 'reward-unavailable');
});

test('save uses an independent key and never overwrites the existing campaign checkpoint', () => {
  const writes = [];
  const oldSave = '{"version":1,"sector":4,"credits":200}';
  const map = new Map([['nova-wing-3d-v1', oldSave]]);
  const storage = {
    getItem(k) { return map.get(k) ?? null; },
    setItem(k, v) { writes.push(k); map.set(k, v); },
  };
  let s = readyInvestigation();
  s = talkToSurvivor(s, 'hidden-route').state;
  assert.equal(saveExploration(storage, s), true);
  assert.deepEqual(writes, [EXPLORATION_SAVE_KEY]);
  assert.equal(map.get('nova-wing-3d-v1'), oldSave);
  assert.deepEqual(loadExploration(storage), s);
  assert.equal(saveExploration(storage, s, { developerSession: true }), false);
  assert.deepEqual(writes, [EXPLORATION_SAVE_KEY]);
});

test('corrupt, forged and outdated saves fail closed without campaign data loss', () => {
  const invalid = createExplorationState({
    version: 1, location: 'hidden-planet',
    clues: ['transmission-a', 'fake', 'transmission-a'],
    conversation: 'hidden-route', missionCompleted: true, rewardClaimed: true,
  });
  assert.equal(invalid.location, 'five-cats-base');
  assert.deepEqual(invalid.clues, ['transmission-a']);
  assert.equal(invalid.conversation, null);
  assert.equal(invalid.missionCompleted, false);
  assert.equal(invalid.rewardClaimed, false);
  assert.deepEqual(createExplorationState({ version: 99, clues: ORBIT9_EVIDENCE.map(e=>e.id) }), createExplorationState());
  assert.deepEqual(loadExploration({ getItem() { return '{not-json'; } }), createExplorationState());
  assert.equal(saveExploration({ setItem() { throw new Error('quota exceeded'); } }, invalid), false);
});
