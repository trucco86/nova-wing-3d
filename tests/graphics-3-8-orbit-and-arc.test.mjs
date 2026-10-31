import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { readFileSync } from 'node:fs';
import { ORBIT_REVEAL, orbitRevealAt } from '../src/orbit-reveal.js';
import { createWorld } from '../src/visuals.js';
import { ORBITAL_LAUNCH, createOrbitalLaunch } from '../src/orbital-launch.js';
import { harness } from './harness.mjs';

test('planet and city never share a frame; sky-only night / star / haze has positive duration', () => {
  assert.ok(ORBIT_REVEAL.firstEarth > ORBIT_REVEAL.cityGone);
  assert.ok(ORBIT_REVEAL.firstMoon > ORBIT_REVEAL.firstEarth);
  assert.ok(ORBIT_REVEAL.firstSun > ORBIT_REVEAL.firstEarth);
  let skyOnly = 0, earthSeen = 0;
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000;
    const v = orbitRevealAt(p);
    assert.equal(v.cityVisible && v.planetVisible, false, 'city/planet overlap at ' + p);
    if (v.skyOnly && v.night > 0) skyOnly++;
    if (v.earth > 0) {
      earthSeen++;
      assert.ok(p > ORBIT_REVEAL.cityGone);
    }
  }
  assert.ok(skyOnly > 50);
  assert.ok(earthSeen > 60);
  assert.equal(orbitRevealAt(0.78).cityVisible, false);
  assert.equal(orbitRevealAt(0.78).earth, 0);
  assert.equal(orbitRevealAt(0.78).moon, 0);
  assert.ok(orbitRevealAt(0.78).haze > 0);
  assert.ok(orbitRevealAt(0.80).night > 0);
  assert.equal(orbitRevealAt(1).earth, 1);
  assert.equal(orbitRevealAt(1).moon, 1);
});

test('scene geometry respects the reveal gate for Earth, cloud shell, Moon, Sun and skyline', () => {
  const scene = new T.Scene();
  const world = createWorld(scene, () => .43, true);
  const earth = scene.getObjectByName('launch-earth-horizon');
  const moon = scene.getObjectByName('launch-orbit-moon');
  const sun = scene.getObjectByName('launch-orbit-sun');
  const city = scene.getObjectByName('launch-city');
  const far = scene.getObjectByName('launch-city-far');
  assert.ok(earth && moon && sun && city && far);
  world.setGraphicsQuality('high');
  for (const p of [0, 0.38, 0.62, 0.73, 0.78, 0.83, 0.89, 0.94, 1]) {
    world.setLaunchAscent(p, true);
    assert.equal(city.visible && earth.visible, false, 'near city vs Earth at '+p);
    assert.equal(far.visible && earth.visible, false, 'far city vs Earth at '+p);
    if (p <= 0.83) assert.equal(earth.visible, false);
    if (p <= 0.89) assert.equal(moon.visible, false);
    if (p <= 0.89) assert.equal(sun.visible, false);
  }
  assert.ok(earth.visible);
  assert.ok(moon.visible);
  assert.ok(sun.visible);
  assert.ok(moon.geometry.attributes.position.count > 2300, 'new crater sphere has higher fidelity');
  assert.ok(moon.material.fragmentShader.includes('Crater rim'));
  assert.ok(scene.getObjectByName('launch-earth-clouds').visible);
  world.setGraphicsQuality('medium');
  assert.equal(scene.getObjectByName('launch-earth-clouds').visible, false);
  world.reset();
  assert.equal(earth.visible, false, 'restart hides orbit reveal');
});

test('launch cannot complete before sustained BOOST depletion: SUPER BOOST changes only the prompt', () => {
  const launch = createOrbitalLaunch();
  for (let i = 1; i <= 80; i++) launch.advance({
    seconds: i, dt: 1, boosting: false, chargeBefore: 100, chargeAfter: 100,
  });
  assert.equal(launch.snapshot().phase, 'boost');
  assert.equal(launch.snapshot().complete, false);
  assert.equal(launch.snapshot().amount, 0);
  launch.advance({ seconds: 81, dt: 1, boosting: true, chargeBefore: 100, chargeAfter: 70 });
  assert.equal(launch.snapshot().phase, 'boost');
  launch.advance({ seconds: 83, dt: ORBITAL_LAUNCH.boostClimbSeconds,
    boosting: true, chargeBefore: 70, chargeAfter: 4 });
  assert.equal(launch.snapshot().phase, 'atmosphere');
  launch.advance({ seconds: 130, dt: ORBITAL_LAUNCH.atmosphericSeconds,
    boosting: false, chargeBefore: 4, chargeAfter: 4 });
  assert.equal(launch.snapshot().complete, true);
});

test('button becomes SUPER BOOST only during required orbital climb, then resets', (t) => {
  const h = harness({ spawnEncounters: false, coarsePointer: true });
  t.after(() => h.close());
  h.game.start();
  h.advance(24);
  const boost = h.element('boostTouch');
  assert.equal(boost.textContent, 'SUPER BOOST');
  assert.equal(boost.classList.contains('launch-required'), true);
  h.key('ShiftLeft', true);
  h.advance(3.5);
  h.key('ShiftLeft', false);
  assert.equal(h.game.snapshot().orbitalLaunch.phase, 'atmosphere');
  assert.equal(boost.textContent, 'BOOST');
  assert.equal(boost.classList.contains('launch-required'), false);
  h.advance(39);
  assert.equal(h.game.snapshot().orbitalLaunch.complete, true);
});

test('half moon arcs and tactile SUPER BOOST are intentionally separate from hit targets', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /Mobile Controls 3\.2/);
  assert.match(css, /#boostTouch\.launch-required/);
  assert.match(css, /@keyframes nova-super-boost-aura/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /#boostTouch\s*\{\s*left: 61px;\s*top: 134px;/);
  assert.match(css, /#fireTouch\s*\{\s*left: 123px;\s*top: 58px;/);
});
