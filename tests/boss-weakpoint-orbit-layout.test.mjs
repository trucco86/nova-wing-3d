import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bossWeakPointPlan,
  bossWeakPointAngle,
  bossWeakPointOpen,
  bossRadarTarget,
} from '../src/boss-weakpoint-layout.js';

test('each of ten chiefs has two physical batteries with valid, aimable attack arcs', () => {
  for (let sector = 0; sector < 10; sector++) {
    const points = bossWeakPointPlan(sector);
    assert.equal(points.length, 2, 'sector ' + sector);
    for (const [i, point] of points.entries()) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
      assert.equal(bossWeakPointAngle(sector, i), point.arc);
      assert.equal(bossWeakPointOpen(sector, point.arc, i), true);
      assert.equal(bossWeakPointOpen(sector, 0, i), false, 'front armor remains protective');
    }
  }
});

test('later bosses reward flank and stern orbit views, never just repeat frontal eyes', () => {
  for (const sector of [1, 2, 4, 6, 7, 8, 9]) {
    const [side, rear] = bossWeakPointPlan(sector);
    assert.ok(side.arc < -Math.PI / 2, 'left flank at sector ' + sector);
    assert.ok(rear.arc > 2.5, 'rear view at sector ' + sector);
    assert.ok(side.z <= 0 && rear.z < 0);
    assert.notEqual(side.type, rear.type);
    assert.notEqual(side.type, bossWeakPointPlan(0)[0].type);
  }
});

test('boss radar uses the genuine flank/stern angles and only exposes observable targets', () => {
  for (const sector of [1, 2, 4, 5, 6, 7, 8, 9]) {
    const alive = [{ hp: 100 }, { hp: 100 }];
    const [side, stern] = bossWeakPointPlan(sector);
    assert.equal(bossRadarTarget(sector, alive, [], 0, false), null);
    assert.deepEqual(bossRadarTarget(sector, alive, [], side.arc), {
      index: 0,
      angle: side.arc,
    });
    assert.deepEqual(bossRadarTarget(sector, alive, [], stern.arc), {
      index: 1,
      angle: stern.arc,
    });
    assert.deepEqual(bossRadarTarget(sector, alive, [], 0, true), {
      index: 0,
      angle: side.arc,
    });
    assert.deepEqual(bossRadarTarget(sector, alive, [{}, { revealed: true }], 0), {
      index: 1,
      angle: stern.arc,
    });
    alive[0].hp = 0;
    assert.deepEqual(bossRadarTarget(sector, alive, [], 0, true), {
      index: 1,
      angle: stern.arc,
    });
    alive[1].hp = 0;
    assert.equal(bossRadarTarget(sector, alive, [], 0, true), null);
  }
});
