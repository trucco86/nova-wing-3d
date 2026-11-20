import * as T from 'three';

// A grounded visual continuation of stage 04's Devastador carrier interior.
// All parts are cosmetic: no new quest triggers, occluding walls, or collision volumes.
// Reuse one geometry and one GPU instanced draw call per finish, including on mobile.
export const ORBIT9_DEVASTADOR_PALETTE = Object.freeze({
  hull: '#34475b',
  armor: '#677a91',
  plating: '#151f33',
  glass: '#5b889b',
  cyan: '#73e8ff',
  amber: '#e4b572',
  hazard: '#fa755c',
  conduit: '#2c6072',
});

export const ORBIT9_ART_LANDMARKS = Object.freeze([
  Object.freeze({ id: 'central', name: 'armored-reactor-atrium', x: 0, z: -44 }),
  Object.freeze({ id: 'science', name: 'devastador-signal-laboratory', x: -45, z: -28 }),
  Object.freeze({ id: 'reactor', name: 'devastador-cooling-plaza', x: 47, z: -62 }),
  Object.freeze({ id: 'archive', name: 'devastador-archive-banks', x: -49, z: -83 }),
]);

const FORMATS = Object.keys(ORBIT9_DEVASTADOR_PALETTE);
const boxGeometry = () => new T.BoxGeometry(1, 1, 1);

export function createOrbit9StageArt() {
  const root = new T.Group();
  root.name = 'orbit9-devastador-stage-art';
  root.userData.visualOnly = true;
  root.userData.referencesStage = 3; // Sector 04 in zero-based mission indexing.
  root.userData.landmarks = ORBIT9_ART_LANDMARKS;

  const cubes = boxGeometry();
  const definitions = Object.fromEntries(FORMATS.map((key) => [key, []]));
  const emit = (type, x, y, z, w, h, d, ry = 0) => {
    if (!definitions[type]) throw new Error('Unrecognized carrier material');
    definitions[type].push({ x, y, z, w, h, d, ry });
  };

  // A deck with meaningful structure, not the repeated glowing-ring corridor.
  // Panels are below feet, and all rails are shallow enough not to obstruct the walk.
  for (let col = -4; col <= 4; col++) {
    for (let row = 0; row < 13; row++) {
      const x = col * 12.2;
      const z = 11 - row * 8.4;
      emit('plating', x, 0.005, z, 11.7, 0.08, 7.95);
      if ((col + row + 20) % 3 === 0) emit('armor', x, 0.065, z - 3.4, 10.4, 0.055, 0.13);
    }
  }
  for (const side of [-1, 1]) {
    // Devastador armored walls, segmented bulkheads and service balconies.
    for (let i = 0; i < 9; i++) {
      const z = 9 - i * 13.4;
      emit('armor', side * 55.2, 11, z, 3.8, 20, 1.8);
      emit('plating', side * 54.5, 13, z - 4.8, 0.45, 11, 6);
      emit('glass', side * 54.0, 14, z - 4.8, 0.24, 7, 4.1);
      emit(i % 3 ? 'cyan' : 'hazard', side * 53.75, 17.9, z - 4.8, 0.2, 0.23, 5.2);
      emit('conduit', side * 52.6, 22, z - 5, 1.35, 2.2, 10);
    }
    // The old 4.5m balcony crossed the follow camera when facing the reactor.
    // Lift the galleries above the pilot and keep their horizontal profile narrow.
    emit('plating', side * 52, 23.5, -43, 4.2, 2, 111);
    emit('cyan', side * 49.3, 22.3, -43, 0.32, 0.35, 110);
    emit('armor', side * 53, 15, -43, 3.0, 0.95, 110);
    emit('amber', side * 51.1, 14.4, -43, 0.3, 0.22, 108);
    for (const z of [-7, -35, -63, -91]) {
      // Docking cranes visually echo the flight-stage carrier's maintenance bays.
      emit('armor', side * 48, 18.5, z, 2.5, 10, 2.5);
      emit('plating', side * 44, 21, z, 11, 2.6, 4);
      emit('hazard', side * 42, 20.9, z, 1.3, 0.4, 2);
    }
    // Landing-pad direction markers are thin floor decals, never obstacles.
    for (let k = 0; k < 5; k++) {
      const z = 7 - k * 23;
      emit(k % 2 ? 'amber' : 'cyan', side * 22, 0.095, z, 0.35, 0.09, 8);
    }
  }

  // Exposed spines/bulkheads communicate the scale of a massive damaged ship.
  for (const z of [9, -16, -67, -97]) {
    emit('armor', 0, 26, z, 106, 3.2, 3.1);
    emit('plating', 0, 28.3, z, 57, 1.5, 6);
    emit('cyan', 0, 24, z, 28, 0.35, 0.35);
  }

  // Atrium: preserve the original central collider. Build UP and OUT from it,
  // never replace its blocker or introduce an opaque wall across the travel lane.
  for (const side of [-1, 1]) {
    emit('armor', side * 8.8, 12, -44, 1.4, 17, 19);
    emit('hazard', side * 8.85, 16, -44, 0.34, 8, 15);
    emit('plating', side * 10, 19.5, -44, 4, 2, 19);
  }
  emit('armor', 0, 18.2, -44, 17.5, 2.8, 22);
  emit('cyan', 0, 20, -44, 10, 0.4, 12);
  // Laboratory: terminals and diagnostic glass close to the WEST wall.
  for (const z of [-18, -28, -38]) {
    emit('plating', -50, 3.3, z, 3.7, 5.4, 5.8);
    emit('glass', -47.9, 4.4, z, 0.3, 2.3, 4.2);
    emit('cyan', -47.6, 5.4, z, 0.24, 0.2, 3.7);
    emit('conduit', -52, 7.4, z, 2.2, 1.1, 7.4);
  }
  emit('armor', -45, 11, -28, 13, 2.6, 3.4);
  emit('cyan', -45, 9.6, -28, 10, 0.26, 0.5);

  // Reactor plaza: open-framed cooling racks replace solid 8m crates in the
  // foreground. Keep every frame beside the EAST wall, clear of (39,-55).
  for (const z of [-42, -78]) {
    for (const offset of [-2.9, 2.9]) {
      emit('armor', 53.8, 6.8, z + offset, 1.1, 12.6, 1.2);
      emit('plating', 52.6, 7.6, z + offset, 2.2, 0.4, 1.4);
    }
    emit('armor', 53.8, 13.2, z, 3.8, 1.15, 8.3);
    emit('cyan', 51.6, 10.6, z, 0.3, 4.1, 5.3);
    emit('hazard', 51.4, 4.8, z, 0.25, 3.2, 5.3);
  }
  emit('conduit', 55.0, 16, -60, 1.8, 1.8, 43);
  emit('amber', 53.7, 15.9, -60, 0.33, 0.28, 39);
  // Archive district: protected memory stacks and recognizable vertical grilles.
  for (const z of [-72, -80, -88, -96]) {
    emit('plating', -51, 5, z, 4.9, 9, 5.7);
    emit('armor', -48.3, 5.1, z, 0.5, 8.5, 5.8);
    for (let y = 2; y <= 8; y += 2) emit('cyan', -48.0, y, z, 0.25, 0.22, 4.5);
  }
  // A clearly legible end-of-station bulkhead, behind the survivor, not a portal.
  emit('plating', 0, 9, -101.4, 108, 19, 2);
  emit('armor', 0, 10, -100.0, 24, 15, 2.2);
  for (const side of [-1, 1]) {
    emit('hazard', side * 13.6, 9.5, -98.7, 0.5, 12.5, 0.6);
    emit('amber', side * 11.7, 15.5, -98.5, 4, 0.45, 0.6);
  }

  const finishes = {};
  for (const name of FORMATS) {
    const glow = ['cyan', 'amber', 'hazard'].includes(name);
    finishes[name] = glow
      ? new T.MeshBasicMaterial({
          color: ORBIT9_DEVASTADOR_PALETTE[name],
          toneMapped: false,
        })
      : new T.MeshStandardMaterial({
          color: ORBIT9_DEVASTADOR_PALETTE[name],
          // Without a baked environment map, fully metallic pieces render
          // nearly black on mobile. Keep the carrier steel legible under fill light.
          metalness: name === 'glass' ? 0.36 : 0.53,
          roughness: name === 'glass' ? 0.3 : 0.43,
          emissive: name === 'plating' ? '#162839' : '#263b4c',
          emissiveIntensity: name === 'plating' ? 0.18 : 0.25,
        });
    const parts = definitions[name];
    if (!parts.length) continue;
    const mesh = new T.InstancedMesh(cubes, finishes[name], parts.length);
    mesh.name = 'orbit9-carrier-' + name;
    mesh.userData.visualOnly = true;
    const dummy = new T.Object3D();
    parts.forEach(({ x, y, z, w, h, d, ry }, i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(w, h, d);
      dummy.rotation.set(0, ry, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    root.add(mesh);
  }

  // A small animated reactor dial makes the atrium feel alive.
  const dialMaterial = new T.MeshBasicMaterial({
    color: ORBIT9_DEVASTADOR_PALETTE.cyan,
    toneMapped: false,
  });
  const dial = new T.Mesh(new T.TorusGeometry(8.9, 0.28, 8, 36), dialMaterial);
  dial.name = 'orbit9-reactor-diagnostic-dial';
  dial.position.set(0, 19, -44);
  dial.userData.visualOnly = true;
  root.add(dial);
  root.userData.diagnosticDial = dial;
  root.userData.instanceCounts = Object.fromEntries(
    FORMATS.map((name) => [name, definitions[name].length]),
  );
  return root;
}

export function updateOrbit9StageArt(root, elapsed) {
  if (!root?.userData?.diagnosticDial) return;
  const t = Number.isFinite(elapsed) ? elapsed : 0;
  root.userData.diagnosticDial.rotation.z = t * 0.16;
}
