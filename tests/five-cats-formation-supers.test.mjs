import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SQUAD_PILOTS, SQUAD_INTRO_DURATION, SQUAD_SPECIALS,
  formationPose, allySortieAt, canActivateSquadSpecial,
} from '../src/five-cats-squad.js';
import { harness } from './harness.mjs';

test('opening has all five Five Cats; Bia is centered and leading', () => {
  assert.deepEqual(SQUAD_PILOTS.map((p) => p.id).sort(),
    ['bia', 'bob', 'calvin', 'christopher', 'jenifer']);
  assert.equal(SQUAD_PILOTS.find((p) => p.id === 'bia').slot, 0);
  const center = formationPose(0, 0);
  for (const wing of [-2, -1, 1, 2]) {
    const pose = formationPose(wing, 0);
    assert.ok(Math.abs(pose.x) > 0);
    assert.ok(pose.z > center.z, 'leader must fly ahead of all wingmates');
    assert.ok(Number.isFinite(pose.bank));
  }
  assert.equal(formationPose(-1, SQUAD_INTRO_DURATION).x,
    -formationPose(1, SQUAD_INTRO_DURATION).x);
});

test('four allies enter separate segments of phase one and exclude selected pilot', () => {
  const sorties = [19, 42, 66, 91].map((n) => allySortieAt(n + 1, 'bia'));
  assert.equal(new Set(sorties.map((s) => s.pilot.id)).size, 4);
  assert.ok(sorties.every((s) => s.pilot.id !== 'bia'));
  assert.equal(allySortieAt(3, 'bia'), null);
  assert.equal(allySortieAt(110, 'bia'), null);
  assert.notEqual(allySortieAt(19, 'jenifer')?.pilot.id, 'jenifer');
});

test('specials require gameplay, sufficient energy and elapsed cooldown', () => {
  for (const kind of ['plasma', 'overdrive']) {
    const spec = SQUAD_SPECIALS[kind];
    assert.ok(spec.cost > 0 && spec.cooldown > spec.duration);
    assert.equal(canActivateSquadSpecial(kind, {
      playing: true, intro: false, energy: spec.cost, cooldown: 0,
    }), true);
    assert.equal(canActivateSquadSpecial(kind, {
      playing: true, intro: true, energy: 100, cooldown: 0,
    }), false);
    assert.equal(canActivateSquadSpecial(kind, {
      playing: true, intro: false, energy: spec.cost - 1, cooldown: 0,
    }), false);
  }
});

test('new mission shows Bia-led formation before gameplay clock starts', (t) => {
  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  assert.ok(h.game.snapshot().fiveCats.intro > 0);
  h.advance(1);
  const first = h.game.snapshot();
  assert.equal(first.fiveCats.visible.length, 5);
  assert.equal(first.fiveCats.visible.find((p) => p.pilot === 'bia').x, 0);
  assert.ok(first.seconds < 0.02);
  assert.equal(h.elements.get('squadFormationStatus').hidden, false);
  h.advance(4.1);
  const ended = h.game.snapshot();
  assert.equal(ended.fiveCats.intro, 0);
  assert.equal(ended.fiveCats.visible.length, 0);
  assert.equal(h.elements.get('squadFormationStatus').hidden, true);
});

test('Y triggers physical plasma barrage, spends arcana; cooldown prevents immediate repeat', (t) => {
  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  h.advance(5.1);
  const before = h.game.snapshot().strategy.arcana;
  h.key('KeyY');
  assert.ok(h.game.snapshot().fiveCats.plasmaTime > 0);
  assert.equal(before - h.game.snapshot().strategy.arcana, SQUAD_SPECIALS.plasma.cost);
  h.key('KeyY');
  assert.equal(before - h.game.snapshot().strategy.arcana, SQUAD_SPECIALS.plasma.cost);
  h.advance(0.3);
  assert.ok(h.game.snapshot().entities.shots >= 1);
  assert.ok(h.game.snapshot().fiveCats.plasmaCooldown > 0);
});

test('O launches Five Cats overdrive with actual wingman meshes and cooldown', (t) => {
  const h = harness({ spawnEncounters: false });
  t.after(() => h.close());
  h.game.start();
  h.advance(5.1);
  h.key('KeyO');
  assert.ok(h.game.snapshot().fiveCats.overdriveTime > 0);
  h.advance(0.1);
  assert.equal(h.game.snapshot().fiveCats.visible.length, 4);
  h.advance(3.6);
  assert.ok(h.game.snapshot().fiveCats.overdriveTime === 0);
});
