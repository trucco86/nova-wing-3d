import * as T from 'three';
import { createDevastadorGrandHall, updateDevastadorGrandHall } from './devastador-grand-hall.js';

// Devastador is the mission objective, NOT a generic enemy boss.
// The last chamber is a destructible orbital machine with ordered circuits:
// power regulators -> coolant valves -> main drives -> exposed reactor.
export const SABOTAGE_SYSTEMS = Object.freeze([
  { name: 'power', label: 'CIRCUITOS DE ENERGIA', count: 4, hp: 70 },
  { name: 'coolant', label: 'REFRIGERAÇÃO', count: 2, hp: 95 },
  { name: 'drive', label: 'MOTORES PRINCIPAIS', count: 2, hp: 115 },
  { name: 'core', label: 'NÚCLEO CENTRAL', count: 1, hp: 0 },
]);

export const sabotagedSystem = (parts) => {
  for (const system of SABOTAGE_SYSTEMS.slice(0, 3)) {
    const pending = parts.filter((part) => part.type === system.name && part.hp > 0);
    if (pending.length)
      return { system: system.name, label: system.label, remaining: pending.length };
  }
  return { system: 'core', label: 'NÚCLEO CENTRAL EXPOSTO', remaining: 0 };
};

/**
 * Current sabotage objective on the actual 360-degree ring. A destroyed or
 * not-yet-unlocked system is never shown as the active radar target.
 */
export function sabotageRadarTarget(parts, orbit = 0) {
  if (!Array.isArray(parts)) return null;
  const system = sabotagedSystem(parts).system;
  if (system === 'core') return null;
  let target = null;
  for (const [index, part] of parts.entries()) {
    if (part?.type !== system || part.hp <= 0 || !Number.isFinite(part.angle)) continue;
    const delta = Math.atan2(Math.sin(part.angle - orbit), Math.cos(part.angle - orbit));
    const distance = Math.abs(delta);
    if (!target || distance < target.distance) target = { index, angle: part.angle, distance };
  }
  return target ? { index: target.index, angle: target.angle } : null;
}

export const sabotageTargetOpen = (parts, index, orbit = 0) => {
  const part = parts[index];
  if (!part || part.hp <= 0 || part.type !== sabotagedSystem(parts).system) return false;
  // The player physically orbits to find each side/rear system, never eye-rings on the front.
  const angle = Math.atan2(Math.sin(orbit - part.angle), Math.cos(orbit - part.angle));
  return Math.abs(angle) < 0.98;
};

export function createDevastadorSabotageCore() {
  const root = new T.Group();
  root.name = 'devastador-reactor-sabotage';
  root.userData.sabotage = true;
  const ownedMaterials = [];
  const grandHall = createDevastadorGrandHall();
  root.add(grandHall);
  const mat = (color, emissive = false) => {
    const m = emissive
      ? new T.MeshBasicMaterial({ color, toneMapped: false })
      : new T.MeshStandardMaterial({ color, metalness: 0.82, roughness: 0.28 });
    ownedMaterials.push(m);
    return m;
  };
  const armor = mat('#2b3e51');
  const steel = mat('#718999');
  const dark = mat('#111b28');
  const conduits = mat('#44ccff', true);
  const charge = mat('#ff9954', true);
  const mint = mat('#a0ffe8', true);
  const cube = new T.BoxGeometry(1, 1, 1);
  const addBox = (parent, name, material, pos, size) => {
    const mesh = new T.Mesh(cube, material);
    mesh.name = name;
    mesh.position.set(...pos);
    mesh.scale.set(...size);
    parent.add(mesh);
    return mesh;
  };
  // Broad cylindrical reactor with segmented armor, conductor ribs and visible engines.
  const drum = new T.Mesh(new T.CylinderGeometry(29, 34, 76, 28, 1, true), armor);
  drum.name = 'devastador-reactor-chamber-housing';
  drum.rotation.x = Math.PI / 2;
  root.add(drum);
  const rotors = [];
  for (let layer = 0; layer < 5; layer++) {
    const ring = new T.Mesh(
      new T.TorusGeometry(32 + (layer % 2) * 2, 1.6, 7, 36),
      layer % 2 ? steel : conduits,
    );
    ring.name = 'reactor-induction-circuit-' + layer;
    ring.position.z = -28 + layer * 14;
    root.add(ring);
    rotors.push(ring);
  }
  for (let tooth = 0; tooth < 12; tooth++) {
    const a = (tooth / 12) * Math.PI * 2;
    const x = Math.sin(a) * 33;
    const y = Math.cos(a) * 33;
    const rib = addBox(root, 'reactor-armor-rib-' + tooth, steel, [x, y, -7], [3.1, 4.5, 65]);
    rib.rotation.z = -a;
    for (let k = 0; k < 3; k++) {
      const x2 = Math.sin(a) * (36.2 + k * 1.1);
      const y2 = Math.cos(a) * (36.2 + k * 1.1);
      addBox(
        root,
        'reactor-circuit-trace',
        k === 2 ? charge : conduits,
        [x2, y2, -24 + k * 23],
        [0.8, 1, 13],
      );
    }
  }
  const entries = [
    ['power', -2.45, -14, 70],
    ['power', -0.87, 19, 70],
    ['power', 0.87, -14, 70],
    ['power', 2.45, 18, 70],
    ['coolant', -1.65, 10, 95],
    ['coolant', 1.65, -10, 95],
    ['drive', -2.83, 10, 115],
    ['drive', 2.83, -10, 115],
  ];
  const parts = [];
  const alarmMaterial = mat('#ff3925', true);
  for (let i = 0; i < entries.length; i++) {
    const [type, angle, height, hp] = entries[i];
    const radius = type === 'drive' ? 55 : type === 'coolant' ? 46 : 41;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const cradle = new T.Group();
    cradle.position.set(x, height, z);
    cradle.rotation.y = angle;
    cradle.name = 'sabotage-' + type + '-cradle-' + i;
    root.add(cradle);
    addBox(cradle, 'machine-conduit-base', dark, [0, 0, -5], [17, 16, 12]);
    const target = addBox(
      cradle,
      'sabotage-target-' + type + '-' + i,
      type === 'power' ? conduits : type === 'coolant' ? mint : charge,
      [0, 0, 3],
      type === 'drive' ? [13, 11, 12] : [10, 9, 8],
    );
    const marker = new T.Group();
    marker.name = 'sabotage-vulnerability-marker';
    const arc = new T.Mesh(new T.TorusGeometry(9, 0.55, 6, 24), charge);
    marker.add(arc);
    marker.position.set(0, 0, 10);
    cradle.add(marker);
    // Pipes, circuit traces, cooling pistons and motor fins are physically modeled.
    for (const side of [-1, 1]) {
      addBox(cradle, 'sabotage-hydraulic-piston', steel, [side * 9, 0, -1], [2.4, 16, 3]);
      addBox(cradle, 'sabotage-harness-cable', conduits, [side * 11, 7, -1], [1.1, 2.1, 15]);
    }
    let fan = null;
    if (type === 'drive') {
      fan = new T.Mesh(new T.CylinderGeometry(8, 8, 10, 12), steel);
      fan.name = 'sabotage-main-drive-turbine';
      fan.rotation.x = Math.PI / 2;
      fan.position.z = -12;
      cradle.add(fan);
    }
    // Each failed system leaves an intermittent localized electrical short.
    // It uses the same cube geometry/material; no particle system or lights.
    const shortCircuit = addBox(
      cradle,
      'sabotage-failed-' + type + '-arc-' + i,
      alarmMaterial,
      [0, 9, 6],
      [1.4, 5.5, 1.8],
    );
    shortCircuit.visible = false;
    const warning = addBox(
      cradle,
      'sabotage-warning-beacon-' + i,
      alarmMaterial,
      [0, -9, 2],
      [5, 0.9, 1],
    );
    warning.visible = false;
    parts.push({
      mesh: target,
      marker,
      cradle,
      type,
      angle,
      hp,
      max: hp,
      fan,
      shortCircuit,
      warning,
      battery: null,
    });
  }
  const core = new T.Mesh(new T.IcosahedronGeometry(12, 2), charge);
  core.name = 'devastador-destroyable-central-reactor';
  core.position.set(0, 0, 43);
  root.add(core);
  const coreMarker = new T.Group();
  coreMarker.name = 'devastador-reactor-core-marker';
  coreMarker.position.copy(core.position);
  coreMarker.add(new T.Mesh(new T.TorusGeometry(16, 0.8, 7, 32), mint));
  root.add(coreMarker);
  core.visible = false;
  coreMarker.visible = false;
  const coreMuzzle = new T.Object3D();
  coreMuzzle.position.copy(core.position);
  root.add(coreMuzzle);
  root.userData = {
    sabotage: true,
    parts,
    grandHall,
    core,
    coreMarker,
    coreMuzzle,
    rotors,
    batteries: [],
    vents: [],
    organic: [],
    jaw: new T.Object3D(),
    driveShockPlumes: [],
    materials: [...ownedMaterials, ...grandHall.userData.materials],
    reactorVisual: {
      powerOnline: 4,
      coolantOnline: 2,
      drivesOnline: 2,
      blackout: 0,
      alarm: false,
      driveSpeed: 1,
    },
    owned: true,
  };
  return root;
}

export function updateDevastadorSabotageCore(root, { orbit = 0, time = 0, active = true } = {}) {
  if (!root?.userData.sabotage) return null;
  const parts = root.userData.parts;
  const stage = sabotagedSystem(parts);
  const online = (type) => parts.filter((p) => p.type === type && p.hp > 0).length;
  const powerOnline = online('power');
  const coolantOnline = online('coolant');
  const drivesOnline = online('drive');
  const damageRatio = (8 - powerOnline - coolantOnline - drivesOnline) / 8;
  const driveSpeed = drivesOnline / 2;
  const alarmsOn = damageRatio > 0;
  root.userData.reactorVisual = {
    powerOnline,
    coolantOnline,
    drivesOnline,
    blackout: damageRatio,
    alarm: alarmsOn,
    driveSpeed,
  };
  // The ship visibly loses electrical distribution as its controllers fail.
  // Cooling lines warn orange, drive turbines slow independently, and failed
  // components arc/flash instead of simply disappearing.
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const open = active && sabotageTargetOpen(parts, i, orbit);
    part.marker.visible = open;
    part.mesh.visible = part.hp > 0;
    part.mesh.scale.set(open ? 1.12 : 1, 1 + Math.sin(time * 2.2 + i) * 0.03, 1);
    const failed = part.hp <= 0;
    part.cradle.rotation.z = failed ? 0.14 : 0;
    part.shortCircuit.visible = failed && Math.sin(time * 16 + i * 2.9) > -0.18;
    part.shortCircuit.scale.y = 3.5 + 3 * Math.abs(Math.sin(time * 13 + i));
    part.warning.visible =
      active && (failed || (open && alarmsOn)) && Math.sin(time * 8 + i * 1.9) > -0.2;
    if (part.fan && !failed) part.fan.rotation.z = time * (0.35 + 2 * driveSpeed);
    if (part.fan && failed) part.fan.rotation.z = 0;
  }
  root.userData.core.visible = stage.system === 'core';
  root.userData.coreMarker.visible = stage.system === 'core';
  root.userData.coreMarker.rotation.z = time * 0.7;
  updateDevastadorGrandHall(root.userData.grandHall, {
    orbit,
    time,
    driveSpeed,
    blackout: damageRatio,
  });
  for (const [i, rotor] of root.userData.rotors.entries()) {
    rotor.rotation.z =
      (i % 2 ? 1 : -1) * time * (stage.system === 'core' ? 2.3 : 0.45 * (1 - damageRatio * 0.68));
    rotor.visible =
      stage.system === 'core' ||
      powerOnline > 0 ||
      Math.sin(time * (5 + i) + i) > 0.18 + damageRatio * 0.65;
  }
  return stage;
}
