import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { crossesSolid } from '../src/flight.js';
import { impactPoint } from '../src/tactics.js';

const boxes = [
  { name: 'Marvin rival', half: [13, 10, 16], radius: 0.5 },
  { name: 'boss weakpoint', half: [5, 5, 5], radius: 0.5 },
  { name: 'boss hull', half: [45, 20, 4], radius: 0.2 },
];

test('QA160: shared rival and boss extents preserve swept hits and exact impact points', () => {
  const center = new Vector3(7, 3, -90);
  const rays = [
    [new Vector3(7, 3, -130), new Vector3(7, 3, -50)],
    [new Vector3(90, 3, -130), new Vector3(90, 3, -50)],
    [new Vector3(7, 70, -130), new Vector3(7, 70, -50)],
    [new Vector3(7, 3, -130), new Vector3(7, 3, -115)],
    [new Vector3(7, 3, -60), new Vector3(7, 3, -130)],
    [new Vector3(7, 3, -90), new Vector3(7, 3, -90)],
  ];
  for (const box of boxes) {
    const shared = new Vector3(...box.half);
    const before = shared.toArray();
    for (const [from, to] of rays) {
      const fresh = new Vector3(...box.half);
      const oldHit = crossesSolid(from, to, center, fresh, box.radius);
      assert.equal(crossesSolid(from, to, center, shared, box.radius), oldHit, box.name);
      if (oldHit)
        assert.deepEqual(
          impactPoint(from, to, center, fresh).toArray(),
          impactPoint(from, to, center, shared).toArray(),
          box.name,
        );
      assert.deepEqual(shared.toArray(), before, 'shared dimensions remain immutable');
    }
  }
});

test('QA160: live game collision loop reuses extents instead of per-shot allocations', () => {
  const source = readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
  for (const [name, args] of [
    ['rivalCollisionHalf', '13, 10, 16'],
    ['bossWeakpointCollisionHalf', '5, 5, 5'],
    ['bossHullCollisionHalf', '45, 20, 4'],
  ]) {
    assert.ok(source.includes('const ' + name + ' = new T.Vector3(' + args + ');'));
    assert.equal(
      source.split('new T.Vector3(' + args + ')').length - 1,
      1,
      name + ' must allocate only once per game',
    );
  }
  assert.match(source, /crossesSolid\\([\\s\\S]{0,180}rivalCollisionHalf/);
  assert.match(source, /impactPoint\\([\\s\\S]{0,180}rivalCollisionHalf/);
  assert.match(source, /crossesSolid\\([\\s\\S]{0,180}bossWeakpointCollisionHalf/);
  assert.match(source, /impactPoint\\([\\s\\S]{0,180}bossWeakpointCollisionHalf/);
  assert.ok(source.includes('const hull = bossHullCollisionHalf;'));
});
