import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPECIALS } from '../src/strategy.js';
import { SQUAD_SPECIALS } from '../src/five-cats-squad.js';
import { harness } from './harness.mjs';

test('shield/stasis and team supers stay active long enough to be tactical', () => {
  assert.ok(SPECIALS[0].duration >= 12);
  assert.ok(SPECIALS[2].duration >= 11);
  assert.ok(SQUAD_SPECIALS.plasma.duration >= 8);
  assert.ok(SQUAD_SPECIALS.overdrive.duration >= 10);
});

test('team super damages armored boss more than normal gunfire without bypassing generators', (t) => {
  const ordinary = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  const squad = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => ordinary.close());
  t.after(() => squad.close());
  for (const h of [ordinary, squad]) {
    assert.equal(h.game.startDeveloperScenario(9, 'boss'), true);
    h.advance(4.1, 0.1);
    assert.equal(h.game.snapshot().bossParts, 2);
  }
  const normal = ordinary.game.damageBoss(10000, null, 'kinetic', false, 'hull', 'weapon');
  const superHit = squad.game.damageBoss(10000, null, 'fire', false, 'hull', 'squad-plasma');
  assert.ok(normal > 0);
  assert.ok(superHit > normal * 2.5, 'special should be visibly stronger against intact hull');
  assert.equal(squad.game.snapshot().bossParts, 2, 'team super cannot skip generators');
  assert.ok(squad.game.snapshot().bossHp > 0.55 * 4440);
});

test('dodging Marvin bite triggers an actual counterattack bonus window', (t) => {
  const h = harness({ hostname: 'dev.nova-wing-preview.pages.dev', spawnEncounters: false });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(9, 'boss'), true);
  h.advance(9, 0.1);
  const intent = h.game.snapshot().bossIntent;
  assert.equal(intent?.kind, 'bite');
  const prior = h.game.snapshot().shield;
  h.key('KeyD');
  h.advance(2.1, 0.1);
  h.key('KeyD', false);
  const avoided = h.game.snapshot();
  assert.equal(avoided.shield, prior, 'bite is avoided by moving away from marked zone');
  assert.ok(
    avoided.strategy.bossCounterTime > 0,
    'missed physical strike gives a real counter window',
  );
  h.advance(4.7, 0.1);
  assert.equal(h.game.snapshot().strategy.bossCounterTime, 0, 'counter expires in simulation time');
});
