import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { shipColorAt } from '../src/pilots.js';
import { CINEMATIC_FLEET } from '../src/cinematic-formation.js';
import {
  SQUAD_PILOTS,
  SQUAD_INTRO_DURATION,
  SQUAD_SPECIALS,
  formationPose,
  allySortieAt,
  canActivateSquadSpecial,
} from '../src/five-cats-squad.js';
import { harness } from './harness.mjs';

test('opening has all five Five Cats; Bia is centered and leading', () => {
  assert.deepEqual(SQUAD_PILOTS.map((p) => p.id).sort(), [
    'bia',
    'bob',
    'calvin',
    'christopher',
    'jenifer',
  ]);
  assert.equal(SQUAD_PILOTS.find((p) => p.id === 'bia').slot, 0);
  const center = formationPose(0, 0);
  for (const wing of [-2, -1, 1, 2]) {
    const pose = formationPose(wing, 0);
    assert.ok(Math.abs(pose.x) > 0);
    assert.ok(pose.z > center.z, 'leader must fly ahead of all wingmates');
    assert.ok(Number.isFinite(pose.bank));
  }
  assert.equal(
    formationPose(-1, SQUAD_INTRO_DURATION).x,
    -formationPose(1, SQUAD_INTRO_DURATION).x,
  );
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
    assert.equal(
      canActivateSquadSpecial(kind, {
        playing: true,
        intro: false,
        energy: spec.cost,
        cooldown: 0,
      }),
      true,
    );
    assert.equal(
      canActivateSquadSpecial(kind, {
        playing: true,
        intro: true,
        energy: 100,
        cooldown: 0,
      }),
      false,
    );
    assert.equal(
      canActivateSquadSpecial(kind, {
        playing: true,
        intro: false,
        energy: spec.cost - 1,
        cooldown: 0,
      }),
      false,
    );
  }
});

test('new mission uses the actual active ship as leader, with four escorts', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: true });
  t.after(() => h.close());
  h.game.start();
  assert.ok(h.game.snapshot().fiveCats.intro > 0);
  h.advance(1);
  const first = h.game.snapshot();
  assert.equal(first.fiveCats.visible.length, 4);
  assert.ok(first.fiveCats.visible.every((p) => p.pilot !== 'bia'));
  assert.equal(first.fiveCats.introPilot, 'bia');
  assert.equal(first.fiveCats.playerIsLeader, true);
  assert.ok(first.seconds < 0.02);
  assert.equal(h.elements.get('squadFormationStatus').hidden, false);
  assert.equal(h.document.body.classList.contains('launch-cinematic'), true);
  assert.equal(first.fiveCats.visibleTagCount, 0);
  h.advance(SQUAD_INTRO_DURATION - 1 + 0.1);
  const ended = h.game.snapshot();
  assert.equal(ended.fiveCats.intro, 0);
  assert.equal(ended.fiveCats.visible.length, 0);
  assert.equal(h.elements.get('squadFormationStatus').hidden, true);
  assert.equal(h.document.body.classList.contains('launch-cinematic'), false);
});

test('skipping the optional story keeps stage-one hangar launch after campaign map', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: true, preflightMap: true });
  t.after(() => h.close());
  h.elements.get('start').onclick();
  assert.equal(h.elements.get('cinematic').hidden, false);
  h.elements.get('cinematicSkip').onclick();
  assert.equal(h.elements.get('cinematic').hidden, true);
  assert.equal(h.elements.get('campaignMap').hidden, false);
  h.elements.get('mapLaunch').onclick();
  assert.equal(h.game.snapshot().state, 'playing');
  assert.equal(h.game.snapshot().fiveCats.intro, SQUAD_INTRO_DURATION);
  h.advance(1.2);
  assert.equal(h.game.snapshot().seconds, 0, 'mission clock cannot advance during launch');
  assert.equal(h.game.snapshot().fiveCats.visible.length, 4);
  assert.match(h.elements.get('squadFormationStatus').textContent, /HANGAR|MOTORES|DECOLAGEM/);
  h.advance(SQUAD_INTRO_DURATION - 1.2 + 0.1);
  assert.equal(h.game.snapshot().fiveCats.intro, 0);
  h.advance(0.2);
  assert.ok(h.game.snapshot().seconds > 0);
});

test('keyboard skip of story preserves stage-one launch and does not skip it', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: true });
  t.after(() => h.close());
  h.elements.get('start').onclick();
  h.key('Escape');
  assert.equal(h.elements.get('cinematic').hidden, true);
  assert.equal(h.game.snapshot().fiveCats.intro, SQUAD_INTRO_DURATION);
  h.advance(0.3);
  assert.equal(h.game.snapshot().fiveCats.visible.length, 4);
  assert.match(h.elements.get('squadFormationStatus').textContent, /HANGAR/);
});

test('selected ship and paint stay on the same real fighter across the launch handoff', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: true });
  t.after(() => h.close());
  h.game.start(false, {
    sector: 0,
    loadout: { pilot: 'bob', ship: 'specter', color: 'crimson' },
  });
  h.advance(1.1);
  const first = h.game.snapshot();
  assert.equal(first.fiveCats.introPilot, 'bob');
  assert.equal(first.fiveCats.playerIsLeader, true);
  assert.equal(first.fiveCats.visible.length, 4);
  assert.ok(first.fiveCats.visible.every((wing) => wing.pilot !== 'bob'));
  assert.equal(first.heroShip.model, 'ship-model-specter');
  assert.equal(first.heroShip.visible, true);
  assert.equal(first.heroShip.selectedColor, 'crimson');
  const selected = new T.Color(shipColorAt('crimson').color).getHexString();
  assert.equal(first.heroShip.paint, selected);
  for (const profile of CINEMATIC_FLEET.filter(({ id }) => id !== 'bob')) {
    const escort = first.fiveCats.visible.find(({ pilot }) => pilot === profile.id);
    assert.ok(escort);
    assert.equal(escort.shipModel, 'ship-model-' + profile.model);
    assert.equal(escort.paintedColor, new T.Color(shipColorAt(profile.color).color).getHexString());
  }
  h.advance(SQUAD_INTRO_DURATION - 1.1 + 0.01);
  const ended = h.game.snapshot();
  assert.equal(ended.fiveCats.intro, 0);
  assert.equal(ended.heroShip.visible, true);
  assert.equal(ended.heroShip.rootId, first.heroShip.rootId);
  assert.equal(ended.heroShip.moduleId, first.heroShip.moduleId);
  assert.equal(ended.heroShip.model, first.heroShip.model);
  assert.equal(ended.heroShip.paint, selected);
});

test('optional launch skip preserves live ship identity, clock and escort visibility', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: true });
  t.after(() => h.close());
  h.game.start();
  const before = h.game.snapshot();
  assert.ok(before.fiveCats.intro > 0);
  assert.equal(h.elements.get('launchSkip').hidden, false);
  h.elements.get('launchSkip').onclick();
  const after = h.game.snapshot();
  assert.equal(after.fiveCats.intro, 0);
  assert.equal(after.fiveCats.visible.length, 0);
  assert.equal(after.heroShip.rootId, before.heroShip.rootId);
  assert.equal(after.heroShip.moduleId, before.heroShip.moduleId);
  assert.equal(after.seconds, before.seconds);
  assert.equal(h.elements.get('launchSkip').hidden, true);
  assert.equal(h.document.body.classList.contains('launch-cinematic'), false);
  h.advance(0.3);
  assert.ok(h.game.snapshot().seconds > 0, 'gameplay starts immediately after skip');
});

test('Y triggers physical plasma barrage, spends arcana; cooldown prevents immediate repeat', (t) => {
  const h = harness({ spawnEncounters: false, enableSquadIntro: true });
  t.after(() => h.close());
  h.game.start();
  h.advance(SQUAD_INTRO_DURATION + 0.1);
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
  const h = harness({ spawnEncounters: false, enableSquadIntro: true });
  t.after(() => h.close());
  h.game.start();
  h.advance(SQUAD_INTRO_DURATION + 0.1);
  h.key('KeyO');
  assert.ok(h.game.snapshot().fiveCats.overdriveTime > 0);
  h.advance(0.1);
  assert.equal(h.game.snapshot().fiveCats.visible.length, 4);
  h.advance(3.6);
  assert.ok(h.game.snapshot().fiveCats.overdriveTime > 5, 'the team attack now lasts ten seconds');
  h.advance(6.7);
  assert.equal(h.game.snapshot().fiveCats.overdriveTime, 0);
});
