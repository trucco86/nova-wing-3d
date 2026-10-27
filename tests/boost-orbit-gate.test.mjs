import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrbitalLaunch, ORBITAL_LAUNCH } from '../src/orbital-launch.js';

test('boost depletion is mandatory; elapsed time cannot skip the city', () => {
  const launch = createOrbitalLaunch();
  for (let i = 0; i < 600; i++)
    launch.advance({
      seconds: i * 0.1,
      dt: 0.1,
      boosting: false,
      chargeBefore: 100,
      chargeAfter: 100,
    });
  assert.equal(launch.snapshot().phase, 'boost');
  assert.equal(launch.snapshot().amount, 0);
  // A short boost with charge left does not launch the ship.
  for (let i = 0; i < 15; i++)
    launch.advance({
      seconds: 60 + i * 0.1,
      dt: 0.1,
      boosting: true,
      chargeBefore: 100 - i,
      chargeAfter: 99 - i,
    });
  assert.equal(launch.snapshot().complete, false);
  launch.reset();
  launch.advance({
    seconds: ORBITAL_LAUNCH.armAfterSeconds,
    dt: 0.1,
    boosting: false,
    chargeBefore: 100,
    chargeAfter: 100,
  });
  for (let i = 0; i < 35; i++) {
    const before = 100 - 28 * i * 0.1;
    const after = Math.max(0, before - 2.8);
    launch.advance({
      seconds: 23 + i * 0.1,
      dt: 0.1,
      boosting: true,
      chargeBefore: before,
      chargeAfter: after,
    });
  }
  assert.equal(launch.snapshot().phase, 'atmosphere');
  assert.ok(launch.snapshot().amount < 0.3);
  for (let i = 0; i < 200; i++)
    launch.advance({
      seconds: 30 + i * 0.1,
      dt: 0.1,
      boosting: false,
      chargeBefore: 5,
      chargeAfter: 5,
    });
  assert.equal(launch.snapshot().complete, false, 'atmospheric climb needs time even after boost');
  for (let i = 0; i < 180; i++)
    launch.advance({
      seconds: 50 + i * 0.1,
      dt: 0.1,
      boosting: false,
      chargeBefore: 5,
      chargeAfter: 5,
    });
  assert.equal(launch.snapshot().complete, true);
  launch.reset();
  assert.equal(launch.snapshot().phase, 'city');
});
