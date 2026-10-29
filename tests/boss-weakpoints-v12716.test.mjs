import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import { createBossModel } from '../src/bosses.js';
import { weakPointOpen } from '../src/strategy.js';
import {
  REAR_WEAKPOINT_SECTORS,
  bossRearGenerator,
  bossGeneratorAngle,
  bossGeneratorLocation,
} from '../src/boss-weakpoints.js';

test('four bosses require genuine orbit to physically rear-mounted right generator', () => {
  assert.deepEqual(REAR_WEAKPOINT_SECTORS, [5, 6, 8, 9]);
  for (let sector = 0; sector < 10; sector++) {
    const rear = REAR_WEAKPOINT_SECTORS.includes(sector);
    assert.equal(bossRearGenerator(sector, 1), rear);
    assert.equal(bossRearGenerator(sector, 0), false);
    assert.equal(weakPointOpen(-Math.PI / 3, 0, sector), true);
    assert.equal(weakPointOpen(Math.PI / 3, 1, sector), !rear);
    assert.equal(weakPointOpen(bossGeneratorAngle(sector, 1), 1, sector), true);
    const model = createBossModel(SECTORS[sector], sector, true);
    assert.equal(model.userData.parts.length, 2);
    const battery = model.userData.parts[1];
    assert.equal(battery.mesh.position.z, rear ? -19 : 19);
    assert.equal(battery.marker.position.z, rear ? -22 : 22);
    assert.equal(battery.location.rear, rear);
    assert.equal(battery.location.label, rear ? 'TRASEIRO' : 'DIREITO');
    assert.equal(battery.marker.rotation.y, rear ? Math.PI : 0);
  }
  assert.throws(() => bossGeneratorLocation(9, 2), RangeError);
});

test('existing frontal core and old flank rule are unchanged for all legacy callers', () => {
  assert.equal(weakPointOpen(0), true);
  assert.equal(weakPointOpen(0, -1, 9), true);
  assert.equal(weakPointOpen(Math.PI, -1, 9), false);
  assert.equal(weakPointOpen(Math.PI / 3, 1), true);
  assert.equal(weakPointOpen(-Math.PI / 3, 0), true);
  assert.equal(weakPointOpen(Math.PI / 3, 1, 9), false);
  assert.equal(bossGeneratorLocation(0, 0).label, 'ESQUERDO');
});
