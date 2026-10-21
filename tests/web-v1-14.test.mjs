import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PET_ITEMS, readPetCare, collectPetItem } from '../src/pet-collectibles.js';
import { CINEMATICS, cinematicBeat, cinematicDuration } from '../src/cinematics.js';
import { AUDIO_CUES } from '../src/audio-cues.js';

test('pet care defaults and collect are safe for legacy saves', () => {
  assert.deepEqual(PET_ITEMS.map(({id}) => id), ['can', 'treat', 'toy', 'litter']);
  assert.deepEqual(readPetCare({can:-1, toy:Infinity}), {can:0,treat:0,toy:0,litter:0});
  assert.equal(collectPetItem({}, 'bad'), null);
  const save = {can:998};
  const pickup = collectPetItem(save, 'can');
  assert.equal(pickup.care.can,999);
  assert.equal(save.can,998);
  assert.equal(collectPetItem(pickup.care,'can').care.can,999);
});

test('prologue stays chronological and does not reveal sector count', () => {
  for (const scenes of Object.values(CINEMATICS)) {
    for (let i=1;i<scenes.length;i++) assert.ok(scenes[i].time>scenes[i-1].time);
    for (const scene of scenes) assert.doesNotMatch(scene.text, /10 setores|dez setores/i);
    assert.ok(cinematicDuration(scenes)>scenes.at(-1).time);
  }
  assert.match(CINEMATICS.intro[1].text,/suprimentos/);
  assert.equal(cinematicBeat(CINEMATICS.intro,9).speaker,'BIA');
});

test('audio cues have bounded gains and separate attack signatures', () => {
  assert.notDeepEqual(AUDIO_CUES.shot.tones,AUDIO_CUES.plasmaRelease.tones);
  assert.ok(AUDIO_CUES.critical.cooldown>=2);
  for (const cue of Object.values(AUDIO_CUES))
    for (const tone of cue.tones) {
      assert.ok(tone.from>=30 && tone.to>=30 && tone.from<=1500 && tone.to<=1500);
      assert.ok(tone.gain>0 && tone.gain<=0.1);
    }
});
