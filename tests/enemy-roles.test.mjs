import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fighterMotion, fighterAdvance, fighterAimOffsets } from '../src/enemy-roles.js';
import { harness } from './harness.mjs';

test('fighter roles have bounded distinct movement and centered attack patterns', () => {
  const roles = ['pursuer', 'interceptor', 'bomber'];
  for (const role of roles) {
    for (let age = 0; age < 5; age += 0.05) {
      const motion = fighterMotion(role, age, 10, 12, 72);
      assert.ok(Object.values(motion).every(Number.isFinite));
      assert.ok(Math.abs(motion.x - 10) <= 16);
      assert.ok(Math.abs(motion.y - 12) <= 3);
    }
    const offsets = fighterAimOffsets(role);
    assert.equal(
      offsets.reduce((sum, n) => sum + n, 0),
      0,
    );
    assert.ok(offsets.length <= 3);
  }
  assert.notDeepEqual(
    fighterMotion('interceptor', 1, 0, 10, 20),
    fighterMotion('bomber', 1, 0, 10, 20),
  );
  assert.equal(fighterAdvance(-91, 1, 0.05, 480), -90);
  assert.equal(fighterAdvance(-90, 3.5, 0.05, 480), -66);
});

test('real fighters stay to charge, fire, freeze on pause and remain bomb targets', (t) => {
  const h = harness({ spawnEncounters: true });
  t.after(() => h.close());
  h.game.start();
  h.advance(2.75);
  let s = h.game.snapshot();
  assert.equal(s.targets.length, 1);
  assert.deepEqual(
    s.targets.map((e) => e.role),
    ['pursuer'],
  );
  assert.ok(s.targets.every((e) => e.charging));
  assert.equal(s.entities.hostile, 0);
  h.game.pause();
  const paused = h.game.snapshot();
  h.advance(2);
  assert.deepEqual(h.game.snapshot(), paused);
  h.game.pause();
  h.advance(0.6);
  s = h.game.snapshot();
  assert.equal(s.targets.length, 1);
  assert.ok(s.entities.hostile > 0 && s.entities.hostile <= 3);
  h.game.bomb();
  assert.equal(h.game.snapshot().targets.length, 0);
  h.advance(5.6);
  assert.equal(h.game.snapshot().targets.find((e) => e.role)?.role, 'interceptor');
  h.game.start();
  h.advance(2.05);
  assert.equal(h.game.snapshot().targets[0].role, 'pursuer');
});

test('native lifecycle retains the original short fighter pass', (t) => {
  const h = harness({ spawnEncounters: true, nativeLifecycle: true });
  t.after(() => h.close());
  h.game.start();
  h.advance(2.75);
  assert.ok(h.game.snapshot().targets.every((e) => !e.role));
});
