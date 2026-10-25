import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import { launchOrbitReady } from '../src/flight.js';
import { createOrbitalLaunch, ORBITAL_LAUNCH } from '../src/orbital-launch.js';
import { routeAt } from '../src/route.js';
import { fighter } from '../src/visuals.js';

test('launch keeps the extended city mission and does not reveal orbit before BOOST exhaustion', () => {
  const duration = SECTORS[0].duration;
  assert.ok(duration >= 120, 'first mission needs a longer playable route');
  assert.equal(launchAmount(duration * 0.4, duration), 0);
  assert.ok(launchAmount(duration * 0.65, duration) < 0.5);
  assert.equal(launchOrbitReady(launchAmount(duration * 0.65, duration)), false);
  assert.ok(routeAt(0, duration * 0.85, duration, false, 0.85).ascent > 0.6);
});

test('enemy fighter archetypes have distinct detailed meshes', () => {
  const shapes = [0, 1, 2].map((variant) => fighter(true, variant));
  const counts = shapes.map((shape) => {
    let meshes = 0;
    shape.traverse((node) => {
      if (node.isMesh) meshes++;
    });
    return meshes;
  });
  counts.forEach((count) => assert.ok(count > 20));
  const profiles = shapes.map((shape) => {
    const detail = shape.children.at(-1);
    return detail.children
      .map((node) =>
        [
          node.type,
          node.geometry?.type ?? 'none',
          node.position.x.toFixed(2),
          node.position.y.toFixed(2),
          node.position.z.toFixed(2),
        ].join(':'),
      )
      .join('|');
  });
  assert.equal(
    new Set(profiles).size,
    3,
    'fighter variants should differ in silhouette and detail',
  );
});
