import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldWarnBoss } from '../src/boss-telegraph.js';

test('the warning appears once, before a boss and without changing spawn timing', () => {
  assert.equal(shouldWarnBoss({ elapsed: 48, duration: 60 }), false);
  assert.equal(shouldWarnBoss({ elapsed: 52, duration: 60 }), true);
  assert.equal(shouldWarnBoss({ elapsed: 55, duration: 60, warned: true }), false);
  assert.equal(shouldWarnBoss({ elapsed: 60, duration: 60 }), false);
  assert.equal(shouldWarnBoss({ elapsed: 55, duration: 60, boss: true }), false);
});
test('subboss, tunnel and non-finite timing never cause false warnings', () => {
  assert.equal(shouldWarnBoss({ elapsed: 55, duration: 60, blocked: true }), false);
  assert.equal(shouldWarnBoss({ elapsed: NaN, duration: 60 }), false);
  assert.equal(shouldWarnBoss({ elapsed: 9, duration: 8 }), false);
});

import { harness } from './harness.mjs';
import { SECTORS } from '../src/campaign.js';
import { completeOrbitalLaunch } from './combat-helper.mjs';
test('real game announces boss before arrival, once, without freezing flight', (t) => {
  const h = harness();
  t.after(() => h.close());
  h.game.start();
  completeOrbitalLaunch(h);
  h.advance(SECTORS[0].duration - 11 - h.game.snapshot().seconds);
  assert.equal(h.elements.get('bossIncoming').hidden, true);
  h.advance(4);
  assert.equal(h.elements.get('bossIncoming').hidden, false);
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().boss, false);
  h.game.pause();
  assert.equal(h.elements.get('bossIncoming').hidden, true);
  h.advance(10);
  h.game.pause();
  assert.equal(h.elements.get('bossIncoming').hidden, false);
  h.advance(5);
  assert.equal(h.elements.get('bossIncoming').hidden, true);
  h.advance(3.5);
  assert.equal(h.game.snapshot().boss, true);
  assert.equal(h.elements.get('bossIncoming').hidden, true);
});
