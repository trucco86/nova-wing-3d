import { test } from 'node:test';
import assert from 'node:assert/strict';
import { combatFeedback } from '../src/combat-feedback.js';

test('confirmed damage gets exact rounded, positive value', () => {
  assert.deepEqual(combatFeedback(5.8), {type:'hit',label:'ACERTO +6',color:'#d7fff2',duration:0.28});
  assert.equal(combatFeedback(0.2).label,'ACERTO +1');
});
test('boss hits differ from weak-point and blocked impact', () => {
  assert.equal(combatFeedback(14,{boss:true}).type,'boss');
  assert.equal(combatFeedback(18,{weak:true}).type,'weak');
  assert.equal(combatFeedback(4, {boss:true,weak:true}).type,'weak');
  assert.equal(combatFeedback(0,{boss:true}).label,'SEM DANO · AJUSTE O ÂNGULO');
});
test('negative, nonfinite and zero values are never communicated as damage', () => {
  for(const x of [-4,0,NaN,Infinity,-Infinity]) {
    const state=combatFeedback(x,{boss:true});
    assert.equal(state.type,'blocked');
    assert.ok(!state.label.includes('+'));
  }
});
