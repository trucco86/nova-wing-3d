import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_CUES } from '../src/audio-cues.js';
import { AUDIO_LAB_KEYS, audioLabCandidate, createAudioLab } from '../src/audio-lab.js';
test('five distinct alternatives preserve originals and reject invalid selections', () => {
  for (const key of AUDIO_LAB_KEYS) {
    const base = AUDIO_CUES[key], original = JSON.stringify(base);
    assert.equal(new Set(Array.from({length:6},(_,i)=>JSON.stringify(audioLabCandidate(base,i)))).size,6);
    assert.equal(JSON.stringify(base),original);
  }
  const lab = createAudioLab(true,AUDIO_CUES);
  assert.equal(lab.select('shot',5),true);
  assert.equal(lab.resolve('shot',false),AUDIO_CUES.shot);
  assert.notEqual(lab.resolve('shot',true),AUDIO_CUES.shot);
  assert.equal(lab.select('shot',6),false);
  assert.equal(createAudioLab(false,AUDIO_CUES).select('shot',1),false);
  lab.reset();
  assert.equal(lab.resolve('shot',true),AUDIO_CUES.shot);
});
