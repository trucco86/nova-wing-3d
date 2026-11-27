import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignFlight } from '../tools/gameplay-campaign-pilot.mjs';

const state = { state: 'playing', player: { x: 0, y: 6 }, seconds: 0 };

test('pilot uses actual boost gate and does not fire during cinematics', () => {
  assert.deepEqual(campaignFlight({ ...state, orbitalLaunch: { phase: 'boost' } }), {
    x: 0,
    y: 0,
    fire: true,
    boost: true,
  });
  assert.equal(campaignFlight({ ...state, launchCinematic: true }).fire, false);
  assert.equal(campaignFlight({ ...state, state: 'respawning' }).fire, false);
});

test('pilot climbs in city and returns to combat altitude in orbit', () => {
  assert.equal(campaignFlight({ ...state, orbitalLaunch: { phase: 'city' } }).y, 1);
  assert.equal(
    campaignFlight({ ...state, player: { x: 0, y: 22 }, orbitalLaunch: { phase: 'orbit' } }).y,
    -1,
  );
  assert.equal(campaignFlight({ ...state, boss: true }).fire, false);
});
