import test from 'node:test';
import assert from 'node:assert/strict';
import { CINEMATIC_FLEET, cinematicFormationPosition } from '../src/cinematic-formation.js';
import { CINEMATICS, cinematicBeat, cinematicDuration } from '../src/cinematics.js';
import { renderCinematicPortrait } from '../src/radio-portraits.js';

test('all five ships form symmetric formation with Bia ahead in center', () => {
  assert.equal(CINEMATIC_FLEET.length, 5);
  assert.equal(new Set(CINEMATIC_FLEET.map((p) => p.id)).size, 5);
  assert.equal(CINEMATIC_FLEET.find((p) => p.slot === 0).id, 'bia');
  assert.deepEqual(
    CINEMATIC_FLEET.map((p) => p.slot).sort((left, right) => left - right),
    [-2, -1, 0, 1, 2],
  );
  const center = cinematicFormationPosition(0, 6, 16 / 9);
  for (const slot of [1, 2]) {
    const left = cinematicFormationPosition(-slot, 6, 16 / 9);
    const right = cinematicFormationPosition(slot, 6, 16 / 9);
    assert.equal(left.x, -right.x);
    assert.equal(left.z, right.z);
    assert.ok(center.z > right.z, 'Bia leads the formation closest to camera');
    const tall = cinematicFormationPosition(slot, 6, 390 / 844);
    assert.ok(Math.abs(tall.x) < Math.abs(right.x), 'portrait compresses fleet into view');
  }
});

test('every Five Cats character speaks during the updated cinematic, with narrator caption-only', () => {
  const names = new Set([...CINEMATICS.intro, ...CINEMATICS.campaign].map((x) => x.speaker));
  for (const name of ['BIA', 'BOB', 'JENIFER', 'CHRISTOPHER', 'CALVINHO'])
    assert.ok(names.has(name), name);
  assert.equal(cinematicDuration(CINEMATICS.intro), 15);
  assert.equal(cinematicDuration(CINEMATICS.campaign), 11);
  assert.equal(cinematicBeat(CINEMATICS.intro, 8).speaker, 'BIA');
  assert.equal(cinematicBeat(CINEMATICS.campaign, 6).speaker, 'BOB');
});

test('cutscene portraits follow speaker identity without showing narrator as Bia', () => {
  const portrait = {
    hidden: true,
    dataset: {},
    setAttribute(name, value) {
      this[name] = value;
    },
  };
  const doc = { getElementById: (id) => (id === 'cinematicPortrait' ? portrait : null) };
  assert.equal(renderCinematicPortrait(doc, 'NARRADOR'), null);
  assert.equal(portrait.hidden, true);
  assert.equal(renderCinematicPortrait(doc, 'CALVINHO'), 'calvin');
  assert.equal(portrait.hidden, false);
  assert.equal(portrait.dataset.pilot, 'calvin');
  assert.match(portrait['aria-label'], /CALVINHO/);
  assert.equal(renderCinematicPortrait(doc, 'JENIFER'), 'jenifer');
  assert.equal(portrait.dataset.pilot, 'jenifer');
  assert.equal(renderCinematicPortrait(null, 'BOB'), 'bob');
});
