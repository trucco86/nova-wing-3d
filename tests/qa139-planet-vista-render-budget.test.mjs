import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {
  createDestinationVista,
  updateDestinationVista,
  createDestinationEscape,
  updateDestinationEscape,
} from '../src/destination-vista.js';
import {
  createDestinationLandmarks,
  updateDestinationLandmarks,
} from '../src/destination-landmarks.js';

test('QA139: Saturn ring accents use only the principal shader draw', () => {
  const root = createDestinationVista(7);
  const planet = root.getObjectByName('destination-celestial-body');
  const ring = root.getObjectByName('saturn-planetary-ring-system');
  assert.ok(planet && ring);
  assert.equal(planet.children.length, 2, 'only atmospheric rim and ring shader');
  assert.equal(planet.children.filter((x) => x.name === 'saturn-astronomical-band').length, 0);
  assert.equal(ring.geometry.parameters.innerRadius, 205);
  assert.equal(ring.geometry.parameters.outerRadius, 346);
  assert.equal(ring.material.depthWrite, false);
  assert.equal(planet.material.depthWrite, true);
  assert.equal(ring.renderOrder, 2);
  assert.match(ring.material.fragmentShader, /cAccent/);
  assert.match(ring.material.fragmentShader, /bAccent/);
  assert.match(ring.material.fragmentShader, /aAccent/);
  assert.match(ring.material.fragmentShader, /gap=1.-smoothstep/);
  assert.equal(root.getObjectByName('destination-entry-mist').children.length, 3);
  assert.doesNotThrow(() => root.clone(true));
});

test('QA139: cached planetary vista updates do not search scene per frame', () => {
  for (const sector of [3, 4, 5, 6, 7, 8, 9]) {
    const root = createDestinationVista(sector);
    const globe = root.getObjectByName('destination-celestial-body');
    const first = globe.position.x;
    root.getObjectByName = () => {
      throw new Error('unexpected traversal');
    };
    globe.getObjectByName = () => {
      throw new Error('unexpected globe traversal');
    };
    for (const time of [0, 8, 15, 23, 27, 58, 15]) updateDestinationVista(root, sector, time);
    if (sector === 3) assert.equal(globe.visible, false, 'mothership approach must stay ship-only');
    if (sector === 7) assert.equal(globe.visible, true, 'Saturn remains in view');
    if (sector === 7) assert.notEqual(globe.position.x, first);
    assert.doesNotThrow(() =>
      updateDestinationVista(createDestinationVista(sector).clone(true), sector, 19),
    );
  }
});

test('QA139: escape streaks avoid trig per-frame and dormant GPU attribute uploads', () => {
  const root = createDestinationEscape(7);
  const particle = root.getObjectByName('escape-hyperspeed-particles');
  const pos = particle.geometry.getAttribute('position');
  const start = Array.from(pos.array);
  root.getObjectByName = () => {
    throw new Error('unexpected search');
  };
  updateDestinationEscape(root, 7, 0);
  assert.equal(root.visible, false);
  assert.deepEqual(Array.from(pos.array), start, 'inactive streaks stay unmodified');
  updateDestinationEscape(root, 7, 7);
  assert.equal(root.visible, true);
  const atSeven = Array.from(pos.array);
  updateDestinationEscape(root, 7, 7);
  assert.deepEqual(Array.from(pos.array), atSeven, 'pause must be deterministic');
  updateDestinationEscape(root, 7, 0);
  assert.equal(root.visible, false);
  assert.deepEqual(Array.from(pos.array), atSeven, 'inactive exit skips buffer updates');
  updateDestinationEscape(root, 7, 8);
  assert.notDeepEqual(Array.from(pos.array), atSeven);
  const cloned = createDestinationEscape(4).clone(true);
  assert.doesNotThrow(() => updateDestinationEscape(cloned, 4, 7));
});

test('QA139: static Saturn ice offsets are cached; clock still drives every wave', () => {
  const root = createDestinationLandmarks(7);
  const near = root.getObjectByName('saturn-ring-ice-near');
  const far = root.getObjectByName('saturn-ring-ice-far-high');
  const matrix = new T.Matrix4();
  updateDestinationLandmarks(root, 36);
  near.getMatrixAt(3, matrix);
  const first = matrix.clone();
  root.getObjectByName = () => {
    throw new Error('unexpected clouds/lighting traversal');
  };
  updateDestinationLandmarks(root, 36);
  near.getMatrixAt(3, matrix);
  assert.deepEqual(matrix.elements, first.elements, 'replay renders same ring ice');
  updateDestinationLandmarks(root, 72);
  near.getMatrixAt(3, matrix);
  assert.notDeepEqual(matrix.elements, first.elements);
  assert.equal(near.count, 36);
  assert.equal(far.count, 22);
  assert.equal(near.userData.visualOnly, true);
});

test('QA139: Venus and Neptune cloud motion preserves deterministic behavior', () => {
  for (const sector of [4, 6]) {
    const root = createDestinationLandmarks(sector);
    const cloud = root.getObjectByName(
      sector === 4 ? 'venus-sulfur-cloud-columns' : 'neptune-turbulent-cloud-columns',
    );
    root.getObjectByName = () => {
      throw new Error('unexpected search');
    };
    updateDestinationLandmarks(root, 21);
    const x = cloud.position.x;
    const material = cloud.material.opacity;
    updateDestinationLandmarks(root, 21);
    assert.equal(cloud.position.x, x);
    assert.equal(cloud.material.opacity, material);
    updateDestinationLandmarks(root, 30);
    assert.notEqual(cloud.position.x, x);
  }
});
