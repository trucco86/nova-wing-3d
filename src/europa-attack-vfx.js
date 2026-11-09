import * as T from 'three';

// Colossus attacks use articulated, telescoping physical-looking arms. The
// telegraphed target is latched by boss-combat-ai at windup: the claw does not
// secretly follow the pilot after they dodge. The existing melee predicate
// owns damage; these meshes never introduce a second/invisible hitbox.
const FORWARD = new T.Vector3(0, 0, 1);
const scratch = new T.Vector3();
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function segment(mesh, a, b) {
  scratch.subVectors(b, a);
  const length = scratch.length();
  mesh.position.copy(a).addScaledVector(scratch, 0.5);
  mesh.quaternion.setFromUnitVectors(FORWARD, scratch.normalize());
  mesh.scale.z = Math.max(0.01, length);
}

function makeStriker(side, materials) {
  const node = new T.Group();
  node.name = side < 0 ? 'europa-left-cryo-arm' : 'europa-right-cryo-arm';
  const upper = new T.Mesh(new T.BoxGeometry(12, 11, 1), materials.armor);
  upper.name = node.name + '-upper-piston';
  const forearm = new T.Mesh(new T.BoxGeometry(9, 8, 1), materials.dark);
  forearm.name = node.name + '-telescopic-forearm';
  const elbow = new T.Mesh(new T.SphereGeometry(6, 10, 8), materials.joint);
  const hand = new T.Group();
  hand.name = side < 0 ? 'europa-left-claw-tip' : 'europa-right-claw-tip';
  const palm = new T.Mesh(new T.BoxGeometry(16, 10, 12), materials.armor);
  hand.add(palm);
  const talons = [];
  for (const finger of [-1, 0, 1]) {
    const knuckle = new T.Group();
    knuckle.position.set(finger * 5.8, finger === 0 ? 4 : -2, 5);
    const iceBlade = new T.Mesh(new T.ConeGeometry(2.8, 18, 7), materials.ice);
    iceBlade.rotation.x = Math.PI / 2;
    iceBlade.position.z = 8;
    knuckle.add(iceBlade);
    hand.add(knuckle);
    talons.push(knuckle);
  }
  const impact = new T.Mesh(new T.SphereGeometry(8, 10, 8), materials.flash);
  impact.name = 'europa-claw-contact-flash';
  impact.position.z = 17;
  hand.add(impact);
  node.add(upper, forearm, elbow, hand);
  node.traverse((item) => {
    item.userData.visualOnly = true;
  });
  return { node, upper, forearm, elbow, hand, talons, impact, side };
}

function poseStriker(striker, target, state, kind, reach, charge) {
  const { side, upper, forearm, elbow, hand, talons, impact } = striker;
  const shoulder = new T.Vector3(side * 22, 4, 8);
  const rest = new T.Vector3(side * 40, -14, 36);
  const quake = kind === 'ice-quake';
  // Windup silhouettes are distinct: high raised hammer vs wide closing
  // pincers. Only the appendage approaches the ship; the body stays put.
  const prepared = quake
    ? new T.Vector3(target.x + side * 16, target.y + 56, target.z - 82)
    : new T.Vector3(target.x + side * 44, target.y + 8, target.z - 78);
  const contact = quake
    ? new T.Vector3(target.x, target.y - 3, target.z - 3)
    : new T.Vector3(target.x + side * 6.5, target.y, target.z - 3);
  const end = rest.clone().lerp(prepared, state === 'windup' ? 0.42 + charge * 0.58 : 1);
  if (state === 'attack') end.lerp(contact, reach);

  const joint = shoulder.clone().lerp(end, 0.47);
  joint.x += side * (quake ? 13 : 22);
  joint.y += quake ? 27 : 12;
  joint.z -= 7;
  segment(upper, shoulder, joint);
  segment(forearm, joint, end);
  elbow.position.copy(joint);
  hand.position.copy(end);
  hand.rotation.set(
    quake ? -0.18 - reach * 0.45 : 0.03,
    side * (quake ? 0.05 : 0.15 + reach * 0.18),
    side * (quake ? -0.11 : -0.2 * reach),
  );
  talons.forEach((finger, i) => {
    const offset = i - 1;
    finger.rotation.y = -offset * (state === 'attack' ? 0.32 * reach : -0.16);
    finger.rotation.x = quake ? -reach * 0.15 : 0;
  });
  impact.visible = state === 'attack' && reach > 0.91;
  // The transient is attached to the exact visible contact tip, not the body.
  impact.scale.setScalar(impact.visible ? 0.75 + 0.45 * reach : 0.01);
  striker.userData = { target: contact.clone(), reach };
}

// The visual-only ice shock and segmented arms reuse shared geometries and
// materials. No new per-frame mesh allocation or projectile simulation.
export function createEuropaAttackVfx() {
  const root = new T.Group();
  root.name = 'boss-europa-attack-vfx';
  root.userData.visualOnly = true;
  const shock = new T.MeshBasicMaterial({
    color: '#8de6ff',
    transparent: true,
    opacity: 0,
    blending: T.AdditiveBlending,
    depthWrite: false,
  });
  const materials = {
    armor: new T.MeshStandardMaterial({
      color: '#668ca6',
      roughness: 0.32,
      metalness: 0.82,
      emissive: '#163f58',
      emissiveIntensity: 0.3,
    }),
    dark: new T.MeshStandardMaterial({
      color: '#25475f',
      roughness: 0.26,
      metalness: 0.9,
    }),
    joint: new T.MeshStandardMaterial({
      color: '#89c4d7',
      metalness: 0.72,
      roughness: 0.3,
    }),
    ice: new T.MeshStandardMaterial({
      color: '#d6f7ff',
      metalness: 0.5,
      roughness: 0.24,
      emissive: '#3bc9f2',
      emissiveIntensity: 0.78,
    }),
    flash: new T.MeshBasicMaterial({
      color: '#9fffff',
      transparent: true,
      opacity: 0.55,
      blending: T.AdditiveBlending,
      depthWrite: false,
    }),
  };
  const quake = new T.Mesh(new T.TorusGeometry(22, 1.65, 6, 28), shock);
  quake.name = 'europa-impact-charge';
  quake.position.set(0, -24, 27);
  quake.scale.y = 0.5;
  quake.userData.visualOnly = true;
  root.add(quake);

  const strikers = [-1, 1].map((side) => makeStriker(side, materials));
  const arms = strikers.map((item) => item.node);
  root.add(...arms);

  const shards = [];
  const shardGeometry = new T.ConeGeometry(3.3, 23, 6);
  for (let i = 0; i < 6; i++) {
    const shard = new T.Mesh(shardGeometry, shock);
    shard.name = 'europa-ice-quake-spike-' + i;
    shard.position.set((i - 2.5) * 13, -29, 28 + (i % 2) * 7);
    shard.rotation.z = (i % 2 ? -1 : 1) * 0.19;
    shard.scale.y = 0.1;
    shard.userData.visualOnly = true;
    root.add(shard);
    shards.push(shard);
  }
  Object.assign(root.userData, {
    shock,
    quake,
    arms,
    strikers,
    shards,
    materials: [shock, ...Object.values(materials)],
  });
  animateEuropaAttackVfx(root, 0);
  return root;
}

export function animateEuropaAttackVfx(
  root,
  time,
  phase = 1,
  state = 'maneuver',
  kind = null,
  pose = null,
  target = null,
  generators = [true, true],
  cycle = 0,
) {
  if (!root || !Number.isFinite(time)) return;
  const live = state === 'windup' || state === 'attack';
  const quakeOn = live && kind === 'ice-quake';
  const pincerOn = live && kind === 'cryo-pincer';
  const striking = state === 'attack';
  const pulse = 0.78 + Math.sin(time * 7) * 0.22;
  const strength = 1 + Math.max(0, Math.min(2, phase - 1)) * 0.1;
  const { shock, quake, arms, shards, strikers } = root.userData;
  const aim = target?.isVector3 ? target : new T.Vector3(0, 12, 170);
  const charge = clamp01((pose?.claw ?? (striking ? 0.85 : 0.22)) / 0.3);
  const reach = striking ? smooth((pose?.claw ?? 0.85) / 0.85) : 0;
  const preferredArm = Math.abs(Math.floor(cycle)) % 2;
  const strikingArm = generators[preferredArm] !== false ? preferredArm : 1 - preferredArm;

  for (let i = 0; i < arms.length; i++) {
    const enabled = generators[i] !== false;
    const active = enabled && (pincerOn || (quakeOn && i === strikingArm));
    arms[i].visible = active;
    if (active) poseStriker(strikers[i], aim, state, kind, reach, charge);
    else strikers[i].impact.visible = false;
  }
  for (const [i, shard] of shards.entries()) {
    shard.visible = quakeOn;
    if (quakeOn) {
      shard.position.set(aim.x + (i - 2.5) * 13, aim.y - 27, aim.z - 14 + (i % 2) * 7);
      shard.scale.y = (striking ? 1.45 : 0.12 + 0.2 * pulse) * strength;
      shard.rotation.z = (i % 2 ? -1 : 1) * (striking ? 0.32 : 0.17);
    }
  }
  shock.opacity = quakeOn ? Math.min(0.9, (striking ? 0.84 : 0.48) * pulse * strength) : 0;
  quake.visible = quakeOn;
  if (quakeOn) {
    quake.position.set(aim.x, aim.y - 19, aim.z - 12);
    quake.rotation.z = time * 0.65;
    quake.scale.x = (striking ? 1.4 : 0.8) * strength;
    quake.scale.y = (striking ? 0.8 : 0.42) * strength;
  }
}
