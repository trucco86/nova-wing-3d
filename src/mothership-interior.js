import * as T from 'three';

// Sector 4: an actual carrier interior, not generic luminous rings.
// All structures are decorative; the flight corridor, aiming, reactor-grid
// mission, collision geometry and camera controls remain unchanged.
const WINDOW_START = 21;
const TRAVEL_SPEED = 34;
const SPAN = 1080;
const SECTION_COUNT = 6;
const BASE_Z = -165;
const STEP_Z = 180;

function material(color, emissive = false) {
  return emissive
    ? new T.MeshBasicMaterial({ color, toneMapped: false })
    : new T.MeshStandardMaterial({ color, metalness: 0.78, roughness: 0.36 });
}
function block(parent, name, geo, mat, x, y, z, w, h, d) {
  const object = new T.Mesh(geo, mat);
  object.name = name;
  object.position.set(x, y, z);
  object.scale.set(w, h, d);
  object.castShadow = false;
  object.receiveShadow = false;
  parent.add(object);
  return object;
}
export function carrierInteriorState(elapsed) {
  const time = Math.max(0, Number.isFinite(elapsed) ? elapsed - WINDOW_START : 0);
  return {
    visible: elapsed >= WINDOW_START,
    time,
    zone: time < 18 ? 'hangar' : time < 43 ? 'industrial' : 'reactor',
    offset: time * TRAVEL_SPEED,
  };
}
export function createMothershipInterior() {
  const root = new T.Group();
  root.name = 'marvin-mothership-interior';
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  root.userData.sector = 3;
  const hull = material('#34475b');
  const armor = material('#677a91');
  const plating = material('#151f33');
  const hazard = material('#fa755c', true);
  const cyan = material('#73e8ff', true);
  const warm = material('#e4b572', true);
  const cube = new T.BoxGeometry(1, 1, 1);
  const sections = [];
  for (let i = 0; i < SECTION_COUNT; i++) {
    const section = new T.Group();
    section.name = 'carrier-interior-module-' + i;
    section.userData.baseZ = BASE_Z - i * STEP_Z;
    for (const side of [-1, 1]) {
      // Vast walls, tall ribs and separate observation decks define scale.
      block(section, 'carrier-side-hull', cube, hull, side * 81, 13, 0, 11, 95, 174);
      block(section, 'carrier-side-bulkhead', cube, armor, side * 73, 20, -60, 4, 83, 9);
      block(section, 'carrier-service-balcony', cube, plating, side * 63, -10, 0, 29, 5, 150);
      block(section, 'carrier-ceiling-rail', cube, cyan, side * 58, 64, -5, 1.1, 1.2, 150);
      block(section, 'carrier-deck-runway', cube, warm, side * 42, -21, 0, 1.4, 1.3, 150);
      // Visible ships in maintenance bays: not duplicates of enemy fighters.
      for (let j = 0; j < 3; j++) {
        const z = -56 + j * 53;
        block(section, 'carrier-docking-crane', cube, armor, side * 63, 38, z, 3, 48, 5);
        block(section, 'carrier-docking-arm', cube, plating, side * 51, 43, z, 20, 4, 5);
        block(section, 'carrier-docking-beacon', cube, j % 2 ? hazard : cyan,
          side * 60, 53, z, 2, 5, 1.3);
      }
      for (let j = 0; j < 4; j++) {
        block(section, 'carrier-hangar-window', cube, cyan,
          side * 74, 20 + j * 10, -42, 1.6, 4, 16);
      }
    }
    block(section, 'carrier-ceiling-armored-spine', cube, plating, 0, 73, 0, 160, 13, 160);
    block(section, 'carrier-floor-armored-grid', cube, hull, 0, -32, 0, 156, 9, 160);
    for (let lane = -2; lane <= 2; lane++) {
      block(section, 'carrier-hangar-runway-lights', cube, lane % 2 ? cyan : warm,
        lane * 23, -26, -56, 2, 1, 114);
    }
    // A distinct reactor and exposed machinery at the far end, never across
    // the center aiming line or the navigable floor.
    if (i >= 3) {
      for (const side of [-1, 1]) {
        const core = new T.Mesh(new T.CylinderGeometry(8, 9, 40, 14), hazard);
        core.name = 'carrier-reactor-coolant-core';
        core.position.set(side * 68, 10, -30);
        section.add(core);
        block(section, 'carrier-reactor-shield-frame', cube, armor,
          side * 68, 10, -55, 23, 51, 4);
      }
    }
    section.position.z = section.userData.baseZ;
    sections.push(section);
    root.add(section);
  }
  // Entrance silhouette remains distant during orbital approach.
  const threshold = new T.Group();
  threshold.name = 'carrier-boarding-gate';
  for (const side of [-1, 1]) {
    block(threshold, 'carrier-gate-pillar', cube, armor, side * 67, 14, 0, 10, 96, 13);
    block(threshold, 'carrier-gate-edge', cube, hazard, side * 60, 11, 3, 2, 60, 3);
  }
  block(threshold, 'carrier-gate-top', cube, plating, 0, 62, 0, 136, 12, 14);
  threshold.position.z = -240;
  root.add(threshold);
  root.userData.sections = sections;
  root.userData.threshold = threshold;
  root.visible = false;
  return root;
}

export function updateMothershipInterior(root, elapsed) {
  if (!root) return null;
  const s = carrierInteriorState(elapsed);
  root.visible = s.visible;
  root.userData.zone = s.zone;
  root.userData.time = s.time;
  if (!s.visible) return s;
  for (const section of root.userData.sections) {
    const distance = section.userData.baseZ + s.offset;
    // Deterministic recycled modules: there is never a missing wall when the
    // pilot moves through the 3D interior at a variable frame rate.
    section.position.z = ((((distance - 85) % SPAN) + SPAN) % SPAN) - (SPAN - 85);
  }
  root.userData.threshold.position.z = -240 + Math.min(290, s.time * 20);
  root.userData.threshold.visible = s.time < 18;
  return s;
}
