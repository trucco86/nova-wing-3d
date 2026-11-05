import * as T from 'three';

// Ordered beats deliberately end before the pre-existing mandatory Super Boost.
// The launch/orbit state machine remains the authority over flight progression.
export const CITY_DESTRUCTION_BEATS = Object.freeze([
  { id: 'billboard', at: 5.4, message: 'PLACA SOLTA · ATENÇÃO À ESQUERDA' },
  { id: 'billboardImpact', at: 7.1, message: null },
  { id: 'vehicle', at: 8.5, message: 'TRÁFEGO EM QUEDA · SETOR LESTE' },
  { id: 'vehicleImpact', at: 10.05, message: null },
  { id: 'facade', at: 11.1, message: 'FACHADA EM COLAPSO · MANTENHA A ROTA' },
  { id: 'facadeImpact', at: 12.0, message: null },
  { id: 'trainWarning', at: 13.3, message: 'TREM AVARIADO · DESVIE À DIREITA' },
  { id: 'facadeDebrisImpact', at: 13.65, message: null },
  { id: 'trainSpawn', at: 14.2, message: null },
  { id: 'trainImpact', at: 16.2, message: null },
]);

// The stage-1 plated road is at y≈-6.8. Align falling solid geometry to its
// actual upper face, leaving a tiny gap to avoid z-fighting in mobile GPUs.
export const CITY_COLLISION_FLOOR_Y = -6.7;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const v = clamp01(x);
  return v * v * (3 - 2 * v);
};

export function cityDestructionAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError('Invalid stage-1 destruction time');
  return Object.freeze({
    seconds,
    phase:
      seconds < 5.4
        ? 'city-calm'
        : seconds < 11.1
          ? 'city-under-fire'
          : seconds < 13.3
            ? 'facade-collapse'
            : seconds < 16.2
              ? 'train-failing'
              : seconds < 22
                ? 'train-obstacle'
                : 'orbital-handoff',
    billboard: smooth((seconds - 5.4) / 1.7),
    vehicle: smooth((seconds - 8.5) / 1.6),
    facade: smooth((seconds - 11.1) / 2.8),
    train: smooth((seconds - 14.2) / 2),
    trainSolid: seconds >= 16.2 && seconds < 22,
    safeLane: 'right',
  });
}

// Use actual world-space rotated geometry, not a center-Y guess. The small
// scripted set pieces have <12 meshes; scratch bounds are reused each frame.
const cityContactScratch = new T.Box3();
export function settleCityDebrisOnFloor(object, floorY = CITY_COLLISION_FLOOR_Y) {
  if (!object || !Number.isFinite(floorY)) throw new RangeError('Invalid city floor contact');
  object.updateWorldMatrix(true, true);
  let bottom = Infinity;
  object.traverse((node) => {
    if (!node.isMesh || !node.visible || node.userData.noGroundContact) return;
    const geometry = node.geometry;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    cityContactScratch.copy(geometry.boundingBox).applyMatrix4(node.matrixWorld);
    bottom = Math.min(bottom, cityContactScratch.min.y);
  });
  if (!Number.isFinite(bottom)) return { contacted: false, bottomY: null, correction: 0 };
  const correction = Math.max(0, floorY - bottom);
  if (correction) {
    object.position.y += correction;
    object.updateWorldMatrix(true, true);
  }
  return { contacted: bottom <= floorY + 0.001, bottomY: bottom + correction, correction };
}

export function cityImpactBounce(seconds, impactAt, amplitude = 1.2) {
  if (!Number.isFinite(seconds) || !Number.isFinite(impactAt))
    throw new RangeError('Invalid impact animation time');
  const after = seconds - impactAt;
  if (after <= 0 || after >= 0.72) return 0;
  const phase = after / 0.72;
  return amplitude * (1 - phase) * Math.sin(Math.PI * phase) ** 2;
}

const boxGeo = new T.BoxGeometry(1, 1, 1);
const steel = () =>
  new T.MeshStandardMaterial({ color: '#45677f', metalness: 0.8, roughness: 0.37 });
const glass = () =>
  new T.MeshStandardMaterial({ color: '#11384e', metalness: 0.45, roughness: 0.23 });
const glow = (color) => new T.MeshBasicMaterial({ color, toneMapped: false });
const char = () =>
  new T.MeshStandardMaterial({ color: '#26313a', roughness: 0.87, metalness: 0.2 });
function block(parent, material, name, x, y, z, w, h, d) {
  const mesh = new T.Mesh(boxGeo, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.userData.visualOnly = true;
  parent.add(mesh);
  return mesh;
}

export function createCityDestructionScene() {
  const root = new T.Group();
  root.name = 'city-scripted-destruction';
  root.userData.visualOnly = true;
  root.visible = false;
  const armor = steel(),
    dark = char(),
    lit = glow('#69efff'),
    orange = glow('#ffb367');

  const billboard = new T.Group();
  billboard.name = 'city-falling-advertisement';
  block(billboard, armor, 'city-sign-frame', 0, 0, 0, 26, 13, 1.7);
  block(billboard, dark, 'city-sign-panel', 0, 0, 1.1, 23, 10.2, 0.3);
  block(billboard, lit, 'city-sign-logo', 0, 1.5, 1.45, 19, 2.3, 0.12);
  block(billboard, orange, 'city-sign-lower-illumination', 0, -3.5, 1.42, 16, 0.7, 0.14);
  const signRoot = new T.Group();
  signRoot.name = 'city-sign-structure';
  signRoot.add(billboard);
  root.add(signRoot);

  const car = new T.Group();
  car.name = 'city-falling-hovercar';
  block(car, armor, 'city-hovercar-hull', 0, 0, 0, 12, 3.3, 21);
  block(car, glass(), 'city-hovercar-canopy', 0, 2.15, -1.2, 9.2, 2.5, 12);
  for (const side of [-1, 1]) {
    block(car, lit, 'city-hovercar-thruster', side * 5.5, -1.9, 4, 1.2, 0.9, 5);
    block(car, orange, 'city-hovercar-warning-light', side * 5, 0.3, 10.5, 1.1, 0.8, 0.3);
  }
  const carBurst = new T.Mesh(
    new T.IcosahedronGeometry(6, 1),
    new T.MeshBasicMaterial({
      color: '#ffab5e',
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
    }),
  );
  carBurst.name = 'city-hovercar-impact-fireball';
  carBurst.userData.visualOnly = true;
  carBurst.userData.noGroundContact = true;
  // The fireball is fixed to the STREET rather than inheriting the tumbling
  // car's rotation (which previously buried the explosion below the asphalt).
  root.add(car, carBurst);

  const facade = new T.Group();
  facade.name = 'city-collapsing-facade';
  // Shell bottom is exactly on the city road, never sunk seven units into it.
  block(facade, steel(), 'city-tower-surviving-shell', 0, 57.3, 0, 30, 114, 32);
  for (let level = 0; level < 9; level++) {
    block(facade, glass(), 'city-tower-lit-windows', 0, 12 + level * 10.5, 16.4, 24, 5.7, 0.55);
  }
  const collapse = new T.Group();
  collapse.name = 'city-tower-damaged-crown';
  for (let i = 0; i < 7; i++) {
    const piece = block(
      collapse,
      i % 2 ? armor : dark,
      'city-tower-falling-facade-fragment',
      ((i % 3) - 1) * 9,
      70 + Math.floor(i / 3) * 10,
      17.5 + (i % 2) * 2,
      7.5,
      6 + (i % 2) * 6,
      3.1,
    );
    piece.userData.origin = piece.position.clone();
    piece.userData.fall = (i % 3) * 5 + 12;
    piece.userData.shardIndex = i;
  }
  facade.add(collapse);
  const collapseFlash = new T.Mesh(
    new T.SphereGeometry(13, 8, 6),
    new T.MeshBasicMaterial({
      color: '#ffa65c',
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  );
  collapseFlash.name = 'city-tower-impact-flash';
  collapseFlash.position.set(0, 92, 20);
  collapseFlash.userData.visualOnly = true;
  collapseFlash.userData.noGroundContact = true;
  facade.add(collapseFlash);
  root.add(facade);

  root.userData.nodes = { signRoot, billboard, car, carBurst, facade, collapse, collapseFlash };
  root.userData.impactPositions = {
    billboard: new T.Vector3(),
    vehicle: new T.Vector3(),
    facade: new T.Vector3(),
    debris: new T.Vector3(),
  };
  updateCityDestructionScene(root, 0);
  return root;
}

export function updateCityDestructionScene(root, seconds, visible = true) {
  if (!root) return null;
  const state = cityDestructionAt(seconds);
  root.visible = Boolean(visible) && seconds < 23.5;
  const { signRoot, billboard, car, carBurst, facade, collapse, collapseFlash } =
    root.userData.nodes;
  signRoot.visible = seconds >= 4.8 && seconds < 10.3;
  signRoot.position.set(
    -55 + state.billboard * 10,
    47 - state.billboard * 44,
    -195 + Math.max(0, seconds - 5.4) * 48,
  );
  billboard.rotation.z = -state.billboard * 1.15;
  billboard.rotation.x = state.billboard * 0.4;
  // Billboard can rotate past 60°; its bottommost corner (not its pivot)
  // must land on the road. Small damped rebound follows the impact.
  settleCityDebrisOnFloor(signRoot);
  if (seconds >= 7.1) signRoot.position.y += cityImpactBounce(seconds, 7.1, 1.4);

  car.visible = seconds >= 8.2 && seconds < 12.3;
  car.position.set(
    56 - state.vehicle * 12,
    48 - state.vehicle * 56,
    -185 + Math.max(0, seconds - 8.5) * 48,
  );
  car.rotation.set(state.vehicle * 0.72, 0.14, -state.vehicle * 1.25);
  // The car's rolled hull and canopy have a different footprint every frame.
  // Clamp their transformed boxes before drawing the ground-level fireball.
  carBurst.visible = seconds >= 10.05 && seconds <= 10.65;
  settleCityDebrisOnFloor(car);
  if (seconds >= 10.05) car.position.y += cityImpactBounce(seconds, 10.05, 0.8);
  carBurst.position.set(car.position.x, CITY_COLLISION_FLOOR_Y + 2.3, car.position.z);
  carBurst.scale.setScalar(0.25 + smooth((seconds - 10.05) / 0.55) * 3.4);

  facade.visible = seconds >= 10.2 && seconds < 20.5;
  facade.position.set(-88, -7, -255 + Math.max(0, seconds - 11.1) * 48);
  for (const fragment of collapse.children) {
    const i = fragment.userData.shardIndex;
    // A staggered, accelerated fall moves the shards all the way down, not
    // merely 20–40 units below the upper floors. Each fragment then stops
    // at its own rotated contact point instead of clipping through the road.
    const descent = smooth((seconds - 11.1 - i * 0.08) / (2.0 + i * 0.045));
    const origin = fragment.userData.origin;
    fragment.position.copy(origin);
    const localFloorY = CITY_COLLISION_FLOOR_Y - facade.position.y;
    fragment.position.y = origin.y + (localFloorY - origin.y) * descent;
    fragment.position.x -= descent * (3 + i * 1.2);
    fragment.rotation.z = -descent * (0.2 + fragment.userData.fall * 0.01);
    fragment.rotation.x = descent * 0.36;
    const ground = settleCityDebrisOnFloor(fragment);
    if (ground.contacted && seconds >= 13.1 + i * 0.08)
      fragment.position.y += cityImpactBounce(seconds, 13.1 + i * 0.08, 0.65);
  }
  collapseFlash.visible = seconds >= 12.0 && seconds < 12.75;
  collapseFlash.scale.setScalar(0.4 + 2.4 * smooth((seconds - 12) / 0.5));
  const impacts = root.userData.impactPositions;
  impacts.billboard.set(signRoot.position.x, CITY_COLLISION_FLOOR_Y + 0.35, signRoot.position.z);
  impacts.vehicle.set(car.position.x, CITY_COLLISION_FLOOR_Y + 0.35, car.position.z);
  // The façade is damaged high up, but the *debris* impact is on the road.
  impacts.facade.set(facade.position.x, 74, facade.position.z + 19);
  impacts.debris.set(facade.position.x - 10, CITY_COLLISION_FLOOR_Y + 0.35, facade.position.z + 18);
  return { ...state, impacts };
}

export function createCityHangingTrainObstacle() {
  const root = new T.Group();
  root.name = 'city-hanging-maglev-obstacle';
  root.userData.kind = 'city-hanging-train';
  root.userData.length = 55;
  root.userData.solids = [];
  root.userData.solidOn = false;
  root.userData.safeLane = 'right';

  const armor = steel(),
    windowMat = glass(),
    neon = glow('#51f6eb'),
    warning = glow('#ffca55');
  const tornGuideway = new T.Group();
  tornGuideway.name = 'city-broken-guideway';
  block(tornGuideway, armor, 'city-twisted-track-section', -11, 11, 0, 39, 3.6, 25);
  block(tornGuideway, neon, 'city-track-sparking-rail', -10, 13, 6, 34, 0.6, 2);
  block(tornGuideway, steel(), 'city-broken-rail-pylon', -29, 20, -11, 4.5, 32, 5);
  root.add(tornGuideway);

  const pivot = new T.Group();
  pivot.name = 'city-derailed-hanging-maglev';
  const train = new T.Group();
  train.name = 'city-maglev-damaged-carriages';
  for (const car of [-1, 1]) {
    const z = car * 18;
    block(train, armor, 'city-wreck-maglev-shell', 0, 0, z, 16, 7, 32);
    block(train, windowMat, 'city-wreck-maglev-windows', 0, 2.8, z, 14.3, 3, 29);
    block(train, neon, 'city-wreck-maglev-light-rail', 0, -2.4, z, 14.8, 0.8, 31);
    block(train, steel(), 'city-wreck-maglev-roof', 0, 4.1, z, 12.8, 0.65, 30);
    for (const flank of [-1, 1])
      for (let j = 0; j < 4; j++) {
        block(
          train,
          warning,
          'city-wreck-maglev-broken-window',
          flank * 8.05,
          1.4,
          z - 10.5 + j * 7,
          0.4,
          2.7,
          0.4,
        );
      }
  }
  for (const z of [-36, 36]) {
    const nose = new T.Mesh(new T.ConeGeometry(7, 17, 5), armor);
    nose.name = 'city-wreck-maglev-pointed-nose';
    nose.rotation.x = z < 0 ? -Math.PI / 2 : Math.PI / 2;
    nose.position.z = z;
    nose.userData.visualOnly = true;
    train.add(nose);
  }
  pivot.add(train);
  root.add(pivot);

  const safe = new T.Group();
  safe.name = 'city-train-safe-right-lane-indicator';
  block(safe, warning, 'city-train-alert-rib', 25, 24, 15, 2, 28, 2);
  const arrow = new T.Mesh(new T.ConeGeometry(5, 9, 3), neon);
  arrow.name = 'city-train-right-dodge-arrow';
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(26, 33, 17);
  arrow.userData.visualOnly = true;
  safe.add(arrow);
  root.add(safe);
  root.userData.nodes = { pivot, train, tornGuideway, safe };
  animateCityHangingTrainObstacle(root, 14.2);
  return root;
}

export function animateCityHangingTrainObstacle(root, seconds) {
  if (!root?.userData?.nodes) return null;
  const state = cityDestructionAt(seconds);
  const { pivot, tornGuideway, safe } = root.userData.nodes;
  pivot.position.set(-42, 34 - state.train * 8, 0);
  pivot.rotation.z = -state.train * 0.5;
  pivot.rotation.x = state.train * 0.16;
  pivot.children[0].position.x = 29;
  tornGuideway.rotation.z = -state.train * 0.22;
  tornGuideway.position.y = 18 * (1 - state.train);
  safe.visible = seconds < 21.8;
  safe.scale.setScalar(0.93 + 0.07 * Math.sin(seconds * 8));
  if (state.trainSolid && !root.userData.solidOn) {
    // Visual carriage and torn support become the ACTUAL collision hull.
    // The right-most safe lane (x>=19) is never obstructed.
    root.userData.solids = [
      { center: new T.Vector3(-18, 12, 0), half: new T.Vector3(12, 9, 43) },
      { center: new T.Vector3(-10, 10, 0), half: new T.Vector3(17, 8, 13) },
    ];
    root.userData.solidOn = true;
  }
  return { ...state, collisionActive: root.userData.solidOn };
}
