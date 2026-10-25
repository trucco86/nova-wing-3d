import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS } from '../src/campaign.js';
import { launchAmount, launchOrbitReady } from '../src/flight.js';
import { routeAt } from '../src/route.js';
import { fighter } from '../src/visuals.js';

test('launch is extended and orbital reveal happens late enough to establish atmospheric combat', () => {
  const duration = SECTORS[0].duration;
  assert.ok(duration >= 120, 'first mission needs a longer playable route');
  assert.equal(launchAmount(duration * 0.4, duration), 0);
  assert.ok(launchAmount(duration * 0.65, duration) < 0.5);
  assert.equal(launchOrbitReady(launchAmount(duration * 0.65, duration)), false);
  assert.ok(routeAt(0, duration * 0.85, duration).ascent > 0.6);
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
  assert.equal(new Set(counts).size, 3, 'fighter variants should differ in silhouette and detail');
});
