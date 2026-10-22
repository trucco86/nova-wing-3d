import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldWarnBoss } from '../src/boss-telegraph.js';

test('the warning appears once, before a boss and without changing spawn timing', () => {
  assert.equal(shouldWarnBoss({elapsed:48,duration:60}),false);
  assert.equal(shouldWarnBoss({elapsed:52,duration:60}),true);
  assert.equal(shouldWarnBoss({elapsed:55,duration:60,warned:true}),false);
  assert.equal(shouldWarnBoss({elapsed:60,duration:60}),false);
  assert.equal(shouldWarnBoss({elapsed:55,duration:60,boss:true}),false);
});
test('subboss, tunnel and non-finite timing never cause false warnings', () => {
  assert.equal(shouldWarnBoss({elapsed:55,duration:60,blocked:true}),false);
  assert.equal(shouldWarnBoss({elapsed:NaN,duration:60}),false);
  assert.equal(shouldWarnBoss({elapsed:9,duration:8}),false);
});
