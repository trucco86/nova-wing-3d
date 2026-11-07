import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { bridgeOccludesSight, createCityBridgeCameraFade } from '../src/city-camera-occlusion.js';
import { createCityUpperBridges } from '../src/city-upper-bridges.js';
import { createCityLocalSolids } from '../src/city-local-solids.js';

function tile() {
  const root = new T.Group();
  root.name = 'launch-city';
  const premium = new T.Group();
  premium.name = 'city-high-details';
  premium.add(new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial()));
  premium.children[0].name = 'city-elevated-crossings';
  root.add(premium);
  const transit = new T.Mesh(new T.BoxGeometry(266, 3.1, 12), new T.MeshStandardMaterial());
  transit.name = 'city32-maglev-crossing-guideway';
  root.add(transit);
  root.add(createCityUpperBridges());
  return root;
}
const camera = new T.Vector3(0, 60, 43);
const pilot = new T.Vector3(0, 53, 9);

function obstacle(tile, kind = 'overpass-deck') {
  return {
    tile,
    kind,
    center: new T.Vector3(0, 59, 24),
    half: new T.Vector3(71, 3, 6.5),
    previousX: 0,
    previousY: 59,
    previousZ: 24,
    active: true,
    solid: true,
  };
}

test('only a physical bridge between camera and pilot can obscure chase vision', () => {
  const root = tile();
  const blocker = obstacle(root);
  assert.equal(bridgeOccludesSight(camera, pilot, blocker), true);
  assert.equal(bridgeOccludesSight(camera, pilot, { ...blocker, active: false }), false);
  assert.equal(bridgeOccludesSight(camera, pilot, { ...blocker, solid: false }), false);
  assert.equal(
    bridgeOccludesSight(camera, pilot, {
      ...blocker,
      center: new T.Vector3(0, 59, -250),
    }),
    false,
    'far background must not trigger an unrelated fade',
  );
  assert.equal(
    bridgeOccludesSight(camera, pilot, {
      ...blocker,
      center: new T.Vector3(160, 59, 24),
    }),
    false,
    'structures on another street must remain opaque',
  );
  assert.equal(
    bridgeOccludesSight(new T.Vector3(0, 80, 43), new T.Vector3(0, 80, 9), blocker),
    false,
    'open sky above bridge does not trigger fade',
  );
});

test('faded upper/lower/transit materials never mutate physical collision or hide the mesh', () => {
  const near = tile();
  const far = near.clone();
  far.name = 'launch-city-far';
  const originalSteel = near.getObjectByName('city-elevated-crossings').material;
  const fade = createCityBridgeCameraFade([near, far]);
  const lower = near.getObjectByName('city-elevated-crossings');
  const farLower = far.getObjectByName('city-elevated-crossings');
  assert.notEqual(lower.material, originalSteel, 'only camera-aware surfaces use cloned materials');
  assert.notEqual(
    lower.material,
    farLower.material,
    'fading one tile must not fade distant cloned city',
  );
  const hull = obstacle(near);
  fade.update(camera, pilot, [hull], 0.5);
  assert.ok(lower.material.opacity < 0.25);
  assert.equal(lower.visible, true, 'the underlying structure remains visible');
  assert.equal(hull.active, true);
  assert.equal(hull.solid, true);
  assert.equal(farLower.material.opacity, 1);
  assert.equal(lower.material.depthWrite, false);
  assert.equal(fade.snapshot().filter((item) => item.occluding).length, 1);

  fade.update(new T.Vector3(0, 89, 43), new T.Vector3(0, 88, 9), [hull], 0.5);
  assert.ok(lower.material.opacity > 0.95);
  assert.equal(lower.material.transparent, false);
  assert.equal(lower.material.depthWrite, true);
  assert.equal(hull.active, true);

  const upper = near.getObjectByName('city-upper-skybridge-solids');
  const sky = {
    ...obstacle(near, 'upper-bridge-deck'),
    center: new T.Vector3(0, 92, 24),
    half: new T.Vector3(63, 2.1, 6),
  };
  fade.update(new T.Vector3(0, 92, 44), new T.Vector3(0, 87, 9), [sky], 0.5);
  assert.ok(upper.material.opacity < 0.25);
  assert.equal(lower.material.opacity, 1, 'lower bridges unaffected by an upper skybridge');
  assert.equal(upper.visible, true);
  fade.reset();
  assert.equal(upper.material.opacity, 1);
  assert.equal(upper.material.transparent, false);
});

test('real upper bridge solidity stays active even while its camera-facing render material fades', () => {
  const root = tile();
  root.position.z = 294;
  const physics = createCityLocalSolids([root]);
  physics.update();
  const solid = physics.colliders().find((item) => item.kind === 'upper-bridge-deck');
  assert.ok(solid);
  const facade = createCityBridgeCameraFade([root]);
  const cam = new T.Vector3(0, 93, 43);
  const ship = new T.Vector3(0, 87, 9);
  facade.update(cam, ship, physics.colliders(), 0.5);
  assert.ok(facade.snapshot().some((x) => x.kind === 'upper' && x.occluding));
  assert.ok(physics.colliders().includes(solid), 'fading is not a collision flag');
  const material = root.getObjectByName('city-upper-skybridge-solids').material;
  assert.ok(material.opacity < 0.3);
  root.visible = false;
  physics.update();
  facade.update(cam, ship, physics.colliders(), 0.5, false);
  assert.equal(material.opacity, 1);
  assert.equal(physics.colliders().length, 0);
});
