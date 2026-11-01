import test from 'node:test';
import assert from 'node:assert/strict';
import { developerLabLoadout, QA_EVOLUTION_STAGES } from '../src/developer-lab.js';
import { ARSENAL, SPECIALS } from '../src/strategy.js';
import { SHIP_MODELS } from '../src/pilots.js';
import {
  fighterAllowedDuringArrival,
  arrivalFighterDepth,
  fighterArrivalAge,
  fighterMayFireAtDepth,
  shouldKeepArrivalCooldown,
} from '../src/encounter-arrival-flow.js';
import { harness } from './harness.mjs';

test('QA laboratory represents every visual evolution, hull, weapon and RPG power', () => {
  assert.deepEqual(QA_EVOLUTION_STAGES, [0, 3, 6, 9, 12, 18]);
  for (const level of QA_EVOLUTION_STAGES)
    for (const ship of SHIP_MODELS)
      for (const [w] of ARSENAL.entries())
        for (const [special] of SPECIALS.entries()) {
          const loadout = developerLabLoadout(String(level), ship.id, String(w), String(special));
          assert.ok(loadout, ship.id + ':' + level + ':' + w + ':' + special);
          assert.equal(loadout.ship, ship.id);
          assert.equal(loadout.arsenal, w);
          assert.equal(loadout.special, special);
          assert.ok(loadout.pods >= 1 && loadout.pods <= 3);
        }
  for (const bad of [
    ['999', 'nova7', 0, 0],
    [9, 'unknown', 0, 0],
    [9, 'nova7', 5, 0],
    [9, 'nova7', 0, 3],
    [null, 'nova7', 0, 0],
  ])
    assert.equal(developerLabLoadout(...bad), null);
});

test('stage 4 stays in chase view with early but distant and staggered late-sector waves', () => {
  assert.equal(fighterAllowedDuringArrival(3, 15, true), false);
  assert.equal(fighterAllowedDuringArrival(3, 18, true), true);
  assert.equal(shouldKeepArrivalCooldown(3, 12, true), true);
  assert.equal(shouldKeepArrivalCooldown(3, 19, true), false);
  assert.equal(fighterAllowedDuringArrival(0, 18, true), false);
  assert.equal(fighterAllowedDuringArrival(1, 18, true), false);
  assert.equal(fighterAllowedDuringArrival(2, 18, true), false);
  assert.ok(arrivalFighterDepth(3, 0) < -300);
  assert.ok(arrivalFighterDepth(3, 3) < arrivalFighterDepth(3, 0) - 100);
  assert.equal(arrivalFighterDepth(0, 0), -200);
  assert.equal(fighterArrivalAge(3, 1, 0), 1);
  assert.equal(fighterArrivalAge(3, 1, 2), 0);
  assert.equal(fighterArrivalAge(3, 3, 2), 1.5);
  assert.equal(fighterArrivalAge(0, 1, 3), 1, 'stages 1–3 keep original cadence');
  assert.equal(fighterMayFireAtDepth(3, -300), false);
  assert.equal(fighterMayFireAtDepth(3, -125), true);
  assert.equal(fighterMayFireAtDepth(3, -8), false);
});

test('QA stage can be launched with all upgrades; sandbox mode saves nothing', (t) => {
  const events = new Map();
  let written = 0;
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      written++;
    },
  };
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    storage,
    spawnEncounters: false,
    onStageFinished(event) {
      events.set('finished', event);
    },
  });
  t.after(() => h.close());
  h.elements.get('developerTier').value = '18';
  h.elements.get('developerShip').value = 'aegis';
  h.elements.get('developerArsenal').value = '4';
  h.elements.get('developerSpecial').value = '2';
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  const start = h.game.snapshot();
  assert.equal(start.developerSession, true);
  assert.equal(start.loadout.ship, 'aegis');
  assert.equal(start.strategy.stage, 18);
  assert.equal(start.strategy.arsenal, 4);
  assert.equal(start.strategy.special, 2);
  assert.equal(start.pods, 3);
  assert.equal(start.rapid, 2);
  assert.equal(start.volley, 2);
  assert.equal(start.bombs, 8);
  assert.equal(start.mecha.active, false);
  assert.equal(h.elements.get('developerFlightLab').hidden, false);
  assert.equal(written, 0);
});

test('pause QA lab swaps ship/weapon/RPG and triggers real robot transformation and pods', (t) => {
  const h = harness({
    hostname: 'dev.nova-wing-preview.pages.dev',
    spawnEncounters: false,
  });
  t.after(() => h.close());
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), true);
  h.game.pause();
  assert.equal(h.game.snapshot().state, 'paused');
  for (const [id, value] of [
    ['qaLabLevel', '9'],
    ['qaLabShip', 'specter'],
    ['qaLabArsenal', '3'],
    ['qaLabSpecial', '1'],
    ['qaLabForm', 'robot'],
    ['qaLabPods', 'deployed'],
  ])
    h.elements.get(id).value = value;
  h.elements.get('qaLabApply').onclick();
  const after = h.game.snapshot();
  assert.equal(after.state, 'playing');
  assert.equal(after.loadout.ship, 'specter');
  assert.equal(after.strategy.arsenal, 3);
  assert.equal(after.strategy.special, 1);
  assert.equal(after.mecha.active, true);
  assert.equal(after.podsDetached, true);
  assert.equal(after.bombs, 8);
  assert.equal(after.strategy.arcana, 100);
  h.game.pause();
  h.elements.get('qaLabApply').onclick(); // Same form must not re-transform.
  assert.equal(h.game.snapshot().mecha.active, true);
});

test('production hostname cannot open the laboratory or use developer stage flow', (t) => {
  const h = harness({ hostname: 'nova-wing-preview.pages.dev' });
  t.after(() => h.close());
  assert.equal(h.game.snapshot().developerAvailable, false);
  assert.equal(h.elements.get('developerPanel').hidden, true);
  assert.equal(h.elements.get('menuQA').hidden, true);
  assert.equal(h.game.startDeveloperScenario(3, 'stage'), false);
});
