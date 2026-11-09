import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './harness.mjs';

test('equipped scatter cannon keeps its cone and mech recoil through transformation and pause', (t) => {
  const runs = [false, true].map((fire) => {
    let robot;
    const data = JSON.stringify({
      version: 1,
      sector: 1,
      credits: 0,
      weapon: 0,
      armor: 0,
      pods: 0,
      volley: 1,
      rapid: 1,
      scatterOwned: true,
      fireMode: 'scatter',
    });
    const h = harness({
      storage: { getItem: (key) => (key === 'nova-wing-3d-v1' ? data : null) },
      observeScene(scene) {
        robot = scene.getObjectByName('five-cats-flight-mech') ?? robot;
      },
    });
    t.after(() => h.close());
    h.game.start(true);
    h.key('KeyT');
    h.key('KeyT', false);
    h.advance(1);
    assert.equal(robot.visible, true);
    if (fire) h.game.fire();
    h.advance(0.02);
    const shotCount = h.game.snapshot().entities.shots;
    assert.equal(
      shotCount,
      fire ? 5 : 0,
      'scatter keeps five pellets instead of pulse multishot count',
    );
    const arms = robot.userData.mechRig.arms.map((arm) => arm.rotation.x);
    h.game.pause();
    h.advance(1);
    assert.deepEqual(
      robot.userData.mechRig.arms.map((arm) => arm.rotation.x),
      arms,
    );
    assert.equal(h.game.snapshot().entities.shots, shotCount);
    h.game.pause();
    h.advance(1.6);
    h.key('KeyT');
    h.key('KeyT', false);
    assert.equal(robot.visible, false);
    assert.equal(h.game.snapshot().fireMode, 'scatter');
    assert.equal(h.game.snapshot().volley, 1);
    h.game.fire();
    assert.equal(
      h.game.snapshot().entities.shots,
      5,
      'returning to fighter preserves the equipped weapon',
    );
    return arms;
  });
  assert.notDeepEqual(runs[0], runs[1], 'actual scatter fire must animate the mech arm recoil');
});
