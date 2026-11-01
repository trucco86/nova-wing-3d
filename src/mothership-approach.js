import * as T from 'three';

// Authored 3D approach to the Devastador in sector 4. The camera stays with
// the pilot: the physical ship advances toward the viewer in perspective,
// its shutters open, and the pilot crosses the SAME hangar aperture that
// leads to the already playable reactor corridor.
export const BOARDING = Object.freeze({
  opening: 8,
  doors: 10,
  entry: 21,
  interior: 25,
  clear: 27,
});

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

export function mothershipApproachAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError('Invalid mothership approach time');
  const distance = smooth(seconds / 22);
  const closure = smooth((seconds - BOARDING.opening) / BOARDING.doors);
  const after = Math.max(0, seconds - 22);
  const z = -900 + distance * 920 + 30 * after * after;
  const opening = closure;
  const frontZ = z + 50 * (0.85 + 0.2 * smooth(seconds / 20));
  const phase =
    seconds < BOARDING.opening
      ? 'sighting'
      : seconds < 16
        ? 'approaching'
        : seconds < BOARDING.entry
          ? 'hangar-alignment'
          : seconds < BOARDING.interior
            ? 'threshold'
            : 'interior';
  return {
    phase,
    z,
    frontZ,
    scale: 0.85 + 0.2 * smooth(seconds / 20),
    x: 32 * (1 - smooth(seconds / 13)),
    y: 8 + 15 * (1 - smooth(seconds / 13)),
    opening,
    visible: seconds < BOARDING.clear,
    inside: seconds >= BOARDING.entry,
    jupiterOpacity: 1 - smooth((seconds - 10) / 12),
    label:
      phase === 'sighting'
        ? 'JÚPITER · NAVE-MÃE DEVASTADOR À VISTA'
        : phase === 'approaching'
          ? 'APROXIMAÇÃO · DEVASTADOR CRESCENDO À FRENTE'
          : phase === 'hangar-alignment'
            ? 'ALINHE O CAÇA · PORTAS DO HANGAR ABRINDO'
            : phase === 'threshold'
              ? 'ENTRADA NO HANGAR · INFILTRAÇÃO'
              : 'INTERIOR DO DEVASTADOR · RUMO AO REATOR',
  };
}

function armor(color, glow = false) {
  return glow
    ? new T.MeshBasicMaterial({ color, toneMapped: false })
    : new T.MeshStandardMaterial({ color, metalness: 0.82, roughness: 0.33 });
}
function block(group, geometry, name, material, x, y, z, sx, sy, sz) {
  const o = new T.Mesh(geometry, material);
  o.name = name;
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  o.castShadow = false;
  o.receiveShadow = false;
  o.userData.visualOnly = true;
  group.add(o);
  return o;
}

export function createMothershipApproach() {
  const root = new T.Group();
  root.name = 'devastador-mothership-boarding';
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  root.userData.sector = 3;
  root.userData.boarding = true;

  const cube = new T.BoxGeometry(1, 1, 1);
  const dark = armor('#0a1425');
  const hull = armor('#27384e');
  const lightHull = armor('#5d7088');
  const shadow = armor('#111c30');
  const red = armor('#ff4a5d', true);
  const orange = armor('#ffbf71', true);
  const cyan = armor('#7ddaff', true);
  const materials = [dark, hull, lightHull, shadow, red, orange, cyan];
  root.userData.materials = materials;
  root.userData.geometry = cube;

  // V-shaped armored silhouette, larger than the Five Cats fighter by an
  // unmistakable scale. No opaque mesh covers the central hangar opening.
  for (const side of [-1, 1]) {
    block(root, cube, 'devastador-dorsal-main-hull', hull,
      side * 65, 26, -27, 67, 21, 130);
    block(root, cube, 'devastador-armored-flank', dark,
      side * 108, 15, -45, 53, 20, 153);
    block(root, cube, 'devastador-lateral-bastion', lightHull,
      side * 136, 17, -22, 16, 44, 68);
    block(root, cube, 'devastador-forward-spur', hull,
      side * 108, 1, 31, 29, 14, 64);
    block(root, cube, 'devastador-ventral-armor', shadow,
      side * 62, -27, -34, 72, 12, 135);
    block(root, cube, 'devastador-hangar-side', lightHull,
      side * 48, 4, 43, 16, 71, 22);
    block(root, cube, 'devastador-hangar-red-guide', red,
      side * 39, 2, 55, 2.8, 53, 4);
    block(root, cube, 'devastador-engine-trench', dark,
      side * 116, 14, -111, 18, 17, 28);
    block(root, cube, 'devastador-engine-plasma', cyan,
      side * 116, 14, -126, 12, 9, 3);
    block(root, cube, 'devastador-hangar-runway', hull,
      side * 31, -34, 8, 20, 5, 110);
    for (let i = 0; i < 4; i++) {
      block(root, cube, 'devastador-armor-plate', lightHull,
        side * (71 + i * 13), 38, 17 - i * 25, 9, 3.4, 24);
      block(root, cube, 'devastador-sensor-line', red,
        side * (77 + i * 13), 40, 18 - i * 25, 3.5, 1.3, 9);
    }
    for (let i = 0; i < 3; i++) {
      block(root, cube, 'devastador-docking-clamp', lightHull,
        side * (52 + i * 31), -12, 38 - i * 32, 9, 16, 15);
      block(root, cube, 'devastador-turret-emplacement', dark,
        side * (75 + i * 20), 39, 14 - i * 29, 10, 10, 15);
      block(root, cube, 'devastador-turret-muzzle', red,
        side * (75 + i * 20), 39, 27 - i * 29, 3, 3, 12);
    }
  }

  // Visible, real 3D aperture: doors retract as the player approaches.
  block(root, cube, 'devastador-hangar-upper-lintel', hull,
    0, 42, 52, 104, 16, 22);
  block(root, cube, 'devastador-hangar-lower-lintel', hull,
    0, -37, 52, 104, 13, 22);
  block(root, cube, 'devastador-bridge-command-deck', lightHull,
    0, 61, -57, 65, 15, 49);
  block(root, cube, 'devastador-bridge-command-glass', cyan,
    0, 63, -26, 41, 5, 2);

  const topDoor = block(root, cube, 'devastador-hangar-upper-shutter', shadow,
    0, 10, 58, 80, 27, 5);
  const bottomDoor = block(root, cube, 'devastador-hangar-lower-shutter', shadow,
    0, -14, 58, 80, 25, 5);
  for (const [door, side] of [[topDoor, 1], [bottomDoor, -1]]) {
    block(door, cube, 'devastador-door-stripe', red, 0, side * 0.47, 0.58,
      0.9, 0.07, 0.25);
  }
  root.userData.shutters = { topDoor, bottomDoor };

  // Hangar depth and red landing guide lights are geometrically behind the
  // door frame. Once it opens, the existing interior modules are visible.
  for (const depth of [14, -16, -43, -76]) {
    for (const side of [-1, 1]) {
      block(root, cube, 'devastador-hangar-tunnel-rail', shadow,
        side * 45, -23, depth, 8, 5, 14);
      block(root, cube, 'devastador-hangar-tunnel-beacon', depth > 0 ? orange : red,
        side * 39, -21, depth, 2, 1, 8);
      block(root, cube, 'devastador-hangar-upper-truss', lightHull,
        side * 42, 32, depth, 12, 7, 7);
    }
  }
  root.userData.motion = mothershipApproachAt(0);
  updateMothershipApproach(root, 0);
  return root;
}

export function updateMothershipApproach(root, seconds) {
  if (!root) return null;
  const state = mothershipApproachAt(seconds);
  root.visible = state.visible;
  root.position.set(state.x, state.y, state.z);
  root.scale.setScalar(state.scale);
  root.rotation.set(0, 0, 0); // never spin the hangar out of the flight path
  const { topDoor, bottomDoor } = root.userData.shutters;
  topDoor.position.y = 10 + 31 * state.opening;
  bottomDoor.position.y = -14 - 31 * state.opening;
  root.userData.motion = state;
  return state;
}
