import * as T from 'three';

// One authored destructive sequence: no random spawns, no object creation in
// the render loop, and no colliders detached from the visible falling geometry.
export const CITY_GROUND_Y = -7;
export const CITY_DESTRUCTION_BEATS = Object.freeze([
  { kind: 'billboard', at: 4.2, x: -36, z: -390, y: 40, w: 16, h: 8, d: 2.4, drift: 7, tilt: 0.44 },
  { kind: 'car', at: 8, x: 29, z: -630, y: 31, w: 9.4, h: 4.4, d: 17, drift: -8, tilt: -0.19 },
  { kind: 'facade', at: 11.4, x: -42, z: -820, y: 49, w: 19, h: 24, d: 4, drift: 12, tilt: -0.64 },
  { kind: 'train', at: 15.3, x: 31, z: -990, y: 48, w: 13, h: 7, d: 43, drift: -7, tilt: 0.46 },
]);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => t * t * (3 - 2 * t);
const metal = (color, roughness = 0.4) =>
  new T.MeshStandardMaterial({ color, metalness: 0.72, roughness });
const emissive = (color) => new T.MeshBasicMaterial({ color, toneMapped: false });
const unitBox = new T.BoxGeometry(1, 1, 1);
function block(group, material, x, y, z, w, h, d, name) {
  const mesh = new T.Mesh(unitBox, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  if (name) mesh.name = name;
  group.add(mesh);
  return mesh;
}

export function cityDebrisSupportY(width, height, tilt, groundY = CITY_GROUND_Y) {
  // A rotated rectangle's support extent, including the pivot/feet.
  return groundY + (Math.abs(Math.cos(tilt)) * height) / 2 + (Math.abs(Math.sin(tilt)) * width) / 2;
}

export function cityDebrisPose(beat, elapsed, groundY = CITY_GROUND_Y) {
  const age = elapsed - beat.at;
  if (age < 0)
    return { active: false, x: beat.x, y: beat.y, tilt: 0, landing: false, settled: false };
  if (beat.kind === 'train') {
    // Broken suspension arrests the train well ABOVE the road. The hinge
    // dampens into an exposed, dodgeable obstruction on the right lane.
    const t = clamp01(age / 1.45);
    return {
      active: true,
      x: beat.x + beat.drift * ease(t),
      y: 48 - 34 * ease(t) + Math.sin(age * 7) * 2.2 * Math.exp(-age * 1.45),
      tilt: beat.tilt * ease(t) + Math.sin(age * 6) * 0.11 * Math.exp(-age * 1.3),
      landing: false,
      settled: age >= 1.45,
    };
  }
  const gravity = 59;
  const targetTilt = beat.tilt;
  const originalDrop = beat.y - cityDebrisSupportY(beat.w, beat.h, targetTilt, groundY);
  const contact = Math.sqrt((2 * Math.max(0, originalDrop)) / gravity);
  const t = clamp01(age / Math.max(0.01, contact));
  const tilt = targetTilt * ease(t);
  const support = cityDebrisSupportY(beat.w, beat.h, tilt, groundY);
  const ballistic = beat.y - (gravity * Math.min(age, contact) ** 2) / 2;
  const after = Math.max(0, age - contact);
  // Positive-only impact rebound avoids the floor-penetration defect.
  const bounce = Math.pow(Math.sin(after * 8), 2) * Math.exp(-after * 4) * 1.45;
  return {
    active: true,
    x: beat.x + beat.drift * ease(t),
    y: Math.max(support, ballistic) + bounce,
    tilt,
    landing: age >= contact,
    settled: after >= 1.3,
    contact,
  };
}

/** Individual authored meshes make the destruction read as pieces of a city. */
function buildProp(group, beat, mats) {
  const { armor, dark, glass, cyan, amber, red } = mats;
  if (beat.kind === 'billboard') {
    block(group, dark, 0, 0, 0, 16, 8, 2.4, 'city-fallen-advertising-frame');
    block(group, glass, 0, 0, -1.28, 14.4, 6.2, 0.3);
    block(group, cyan, 0, 3.7, -1.5, 16.5, 0.38, 0.33);
    block(group, amber, -6.8, 0, -1.5, 0.4, 7, 0.35);
    block(group, amber, 6.8, 0, -1.5, 0.4, 7, 0.35);
    for (let i = 0; i < 4; i++) block(group, cyan, -4.9 + i * 3.1, -1.5, -1.52, 1.4, 2.2, 0.12);
  } else if (beat.kind === 'car') {
    block(group, armor, 0, 0, 0, 9.4, 4.4, 17, 'city-falling-hovercar-hull');
    block(group, glass, 0, 2.1, -1.1, 7, 1.2, 10.5);
    for (const side of [-1, 1]) {
      block(group, cyan, side * 4.9, -0.65, 1, 0.36, 0.42, 12);
      block(group, amber, side * 3.0, -0.4, 8.6, 1.3, 1, 0.45);
    }
    block(group, red, 0, 0.6, -8.5, 6.4, 0.7, 0.3);
  } else if (beat.kind === 'facade') {
    block(group, armor, 0, 0, 0, 19, 24, 4, 'city-collapsed-building-facade');
    for (let floor = 0; floor < 5; floor++) {
      block(group, glass, 0, -9.4 + floor * 4.4, -2.13, 15, 2.5, 0.34);
      block(group, cyan, 0, -7.7 + floor * 4.4, -2.36, 18, 0.2, 0.13);
    }
    for (const x of [-8, 0, 8]) block(group, dark, x, 0, -2.43, 0.9, 24.2, 0.4);
    block(group, red, 2, 10.2, -2.3, 8.5, 0.8, 0.24);
  } else if (beat.kind === 'train') {
    block(group, armor, 0, 0, 0, 13, 7, 43, 'city-broken-maglev-carriage');
    block(group, glass, 0, 1.6, 0, 11.4, 2.9, 41.8);
    for (const side of [-1, 1]) {
      block(group, cyan, side * 6.65, -2.1, 0, 0.25, 0.55, 43);
      block(group, amber, side * 6.65, 3.2, 0, 0.25, 0.35, 43);
      for (let i = 0; i < 5; i++)
        block(group, dark, side * 6.76, 0.8, -15 + i * 7.5, 0.3, 4.2, 0.6);
    }
    block(group, red, 0, -0.9, 21.65, 9, 1.1, 0.3);
    group.userData.hanging = true;
  }
}

function buildImpactFX(beat) {
  const fx = new T.Group();
  fx.name = 'city-ground-impact-' + beat.kind;
  const flash = new T.Mesh(
    new T.IcosahedronGeometry(1, 1),
    new T.MeshBasicMaterial({
      color: beat.kind === 'car' ? '#ffd394' : '#89ecff',
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  flash.name = 'city-explosion-flash';
  const ring = new T.Mesh(
    new T.TorusGeometry(1, 0.19, 6, 22),
    new T.MeshBasicMaterial({
      color: '#ffb36a',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: T.AdditiveBlending,
      toneMapped: false,
    }),
  );
  ring.name = 'city-impact-shockwave';
  ring.rotation.x = -Math.PI / 2;
  fx.add(flash, ring);
  // Single instanced draw call for all 18 authored sparks.
  const sparks = new T.InstancedMesh(
    new T.IcosahedronGeometry(0.42, 0),
    new T.MeshBasicMaterial({ color: '#ffca7b', toneMapped: false }),
    18,
  );
  sparks.name = 'city-impact-sparks';
  const transform = new T.Object3D();
  for (let i = 0; i < 18; i++) {
    const angle = i * 2.399963229728653;
    const radius = 2.2 + (i % 4) * 1.3;
    transform.position.set(Math.cos(angle) * radius, 1.2 + (i % 5) * 0.9, Math.sin(angle) * radius);
    transform.scale.setScalar(0.35 + (i % 3) * 0.12);
    transform.updateMatrix();
    sparks.setMatrixAt(i, transform.matrix);
  }
  sparks.instanceMatrix.needsUpdate = true;
  fx.add(sparks);
  fx.visible = false;
  return { fx, flash, ring, sparks };
}

export function createCityCatastrophe() {
  const root = new T.Group();
  root.name = 'city-destruction-premium';
  const mats = {
    armor: metal('#647e94', 0.31),
    dark: metal('#263a4e'),
    glass: metal('#174e77', 0.16),
    cyan: emissive('#3beaff'),
    amber: emissive('#ffb86e'),
    red: emissive('#ff674f'),
  };
  const beats = CITY_DESTRUCTION_BEATS.map((spec) => {
    const o = new T.Group();
    o.name = 'city-destruction-' + spec.kind;
    buildProp(o, spec, mats);
    root.add(o);
    const { fx, flash, ring, sparks } = buildImpactFX(spec);
    root.add(fx);
    const collider = {
      kind: spec.kind,
      center: o.position,
      half: new T.Vector3(spec.w / 2, spec.h / 2, spec.d / 2),
      previousZ: spec.z,
      previousX: spec.x,
      previousY: spec.y,
      active: false,
      solid: true, // Every visible falling object is physically solid.
    };
    const cable =
      spec.kind === 'train'
        ? new T.Mesh(new T.CylinderGeometry(0.21, 0.29, 1, 7), mats.dark)
        : null;
    if (cable) {
      cable.name = 'city-maglev-torn-suspension-cable';
      root.add(cable);
    }
    return {
      spec,
      o,
      fx,
      flash,
      ring,
      sparks,
      collider,
      cable,
      impactTime: null,
      wasActive: false,
    };
  });
  const activeColliders = [];
  const up = new T.Vector3(0, 1, 0);
  const tmp = new T.Vector3();
  const cableVector = new T.Vector3();
  function reset() {
    activeColliders.length = 0;
    for (const b of beats) {
      b.o.position.set(b.spec.x, b.spec.y, b.spec.z);
      b.o.rotation.set(0, 0, 0);
      b.o.visible = true;
      b.fx.visible = false;
      if (b.cable) b.cable.visible = true;
      b.collider.active = false;
      b.collider.previousZ = b.spec.z;
      b.collider.previousX = b.spec.x;
      b.collider.previousY = b.spec.y;
      b.impactTime = null;
      b.wasActive = false;
    }
  }
  function update(dt, elapsed, speed, enabled = true) {
    root.visible = enabled;
    if (!enabled || !Number.isFinite(dt) || dt < 0) return;
    activeColliders.length = 0;
    for (const b of beats) {
      const { spec, o, collider } = b;
      collider.previousZ = o.position.z;
      collider.previousX = o.position.x;
      collider.previousY = o.position.y;
      o.position.z += Math.max(0, speed) * dt;
      const pose = cityDebrisPose(spec, elapsed);
      o.position.x = pose.x;
      o.position.y = pose.y;
      o.rotation.z = pose.tilt;
      collider.active = pose.active && o.position.z < 55 && o.position.z > -570;
      if (collider.active) activeColliders.push(collider);
      // Conservative AABB for the actual rotated box (not an invisible wall).
      collider.half.set(
        (Math.abs(Math.cos(pose.tilt)) * spec.w) / 2 + (Math.abs(Math.sin(pose.tilt)) * spec.h) / 2,
        (Math.abs(Math.cos(pose.tilt)) * spec.h) / 2 + (Math.abs(Math.sin(pose.tilt)) * spec.w) / 2,
        spec.d / 2,
      );
      if (pose.landing && b.impactTime === null) b.impactTime = elapsed;
      const impactAge = b.impactTime === null ? -1 : elapsed - b.impactTime;
      const alive = impactAge >= 0 && impactAge < 0.85;
      b.fx.visible = alive;
      if (alive) {
        const fade = (1 - impactAge / 0.85) ** 2;
        b.fx.position.set(o.position.x, CITY_GROUND_Y + 1.7, o.position.z);
        b.flash.material.opacity = fade * 0.92;
        b.flash.scale.setScalar(1.4 + impactAge * 17);
        b.ring.material.opacity = fade * 0.87;
        b.ring.scale.setScalar(1 + impactAge * 23);
        b.sparks.scale.setScalar(0.8 + impactAge * 1.8);
      }
      if (b.cable) {
        b.cable.visible = o.position.z < 60 && o.position.z > -570;
        // Suspended carriage remains physically attached by a visible strut.
        cableVector.set(40 - o.position.x, 59 - o.position.y, 0);
        const length = cableVector.length();
        b.cable.position.set((40 + o.position.x) / 2, (59 + o.position.y) / 2, o.position.z);
        b.cable.scale.set(1, length, 1);
        b.cable.quaternion.setFromUnitVectors(up, tmp.copy(cableVector).normalize());
      }
      o.visible = o.position.z < 60 && o.position.z > -570;
    }
  }
  reset();
  root.visible = false; // No urban rubble floating in the main menu or non-city sectors.
  return {
    root,
    reset,
    update,
    colliders() {
      return activeColliders; // Reused array; no frame-loop allocation.
    },
    snapshot() {
      return beats.map((b) => ({
        kind: b.spec.kind,
        active: b.collider.active,
        x: b.o.position.x,
        y: b.o.position.y,
        z: b.o.position.z,
        tilt: b.o.rotation.z,
        groundClearance: b.o.position.y - cityDebrisSupportY(b.spec.w, b.spec.h, b.o.rotation.z),
        impact: b.impactTime !== null,
        fx: b.fx.visible,
        cable: b.cable?.visible ?? false,
      }));
    },
  };
}
