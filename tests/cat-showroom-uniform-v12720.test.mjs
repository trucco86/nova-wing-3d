import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShowroomPilot, disposeShowroomModel } from '../src/showroom-models.js';

test('pilot uniforms add physical cat-face crests and rank decorations without changing cat identity', () => {
  for (const id of ['bia', 'bob', 'christopher', 'calvin', 'jenifer']) {
    const rookie = createShowroomPilot(id, 0, 0);
    const officer = createShowroomPilot(id, 3, 2);
    assert.equal(rookie.userData.uniformGrade, 0);
    assert.equal(officer.userData.uniformGrade, 3);
    assert.ok(rookie.getObjectByName('pilot-feline-rank-insignia'));
    assert.ok(officer.getObjectByName('pilot-feline-rank-insignia'));
    assert.equal(
      officer.children.filter((node) => node.name === 'pilot-earned-cat-medal').length,
      2,
    );
    assert.ok(officer.getObjectByName('pilot-command-wing'));
    assert.ok(
      officer.children.filter((node) => node.name === 'pilot-cat-service-stripe').length >= 2,
    );
    assert.ok(rookie.getObjectByName('head'));
    assert.ok(officer.getObjectByName('head'));
    assert.equal(officer.scale.x, rookie.scale.x);
    disposeShowroomModel(rookie);
    disposeShowroomModel(officer);
  }
});

test('invalid uniform grades are clamped, making the render deterministic', () => {
  const pilot = createShowroomPilot('bia', 1000, 500);
  assert.equal(pilot.userData.uniformGrade, 4);
  assert.equal(pilot.userData.medalCount, 3);
  assert.equal(pilot.children.filter((node) => node.name === 'pilot-earned-cat-medal').length, 3);
  disposeShowroomModel(pilot);
});
