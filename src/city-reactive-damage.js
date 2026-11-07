import * as T from 'three';
import { crossesSolid } from './flight.js';
import { cityDebrisSupportY } from './city-catastrophe.js';

// Two authored, reachable side-facade hardpoints. The street/rail layout from
// the approved concept remains intact; these structures sit beside its lane.
export const CITY_DAMAGE_SITES = Object.freeze([
  Object.freeze({ side: -1, x: -37, y: 12, z: -248, w: 12, h: 19, d: 4, hp: 8 }),
  Object.freeze({ side: 1, x: 37, y: 13, z: -522, w: 12, h: 20, d: 4, hp: 8 }),
]);
const smooth = (v) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
const unit = new T.BoxGeometry(1, 1, 1);
const zero = new T.Vector3();
const bulletFrom = new T.Vector3();
const bulletTo = new T.Vector3();
const material = (color, roughness = 0.35) =>
  new T.MeshStandardMaterial({ color, metalness: 0.73, roughness });
const glow = (color) => new T.MeshBasicMaterial({ color, toneMapped: false });

function panel(group, mat, x, y, z, w, h, d, name) {
  const mesh = new T.Mesh(unit, mat);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  if (name) mesh.name = name;
  group.add(mesh);
  return mesh;
}

function buildDamageBay(spec, mats, index) {
  const shell = new T.Group();
  shell.name = 'city-reactive-bay-' + index;
  panel(shell, mats.steel, 0, 0, 0, spec.w, spec.h, spec.d, 'city-reactive-shootable-facade');
  panel(shell, mats.glass, 0, 0, -spec.d / 2 - 0.18, spec.w - 1.6, spec.h - 2, 0.3);
  panel(
    shell,
    mats.orange,
    0,
    spec.h / 2 - 1.05,
    -spec.d / 2 - 0.4,
    spec.w - 0.7,
    0.65,
    0.28,
    'city-reactive-weakpoint-marker',
  );
  for (const x of [-spec.w / 2 + 1.3, spec.w / 2 - 1.3]) {
    panel(shell, mats.dark, x, 0, -spec.d / 2 - 0.6, 0.85, spec.h - 1.4, 0.35);
  }
  for (let i = 0; i < 4; i++)
    panel(
      shell,
      mats.cyan,
      0,
      -spec.h / 2 + 3 + i * 4,
      -spec.d / 2 - 0.4,
      spec.w - 2.8,
      0.33,
      0.24,
    );
  // Distinct persistent damage states: fractured glazing, exposed armored
  // frame, glowing severed conduit. No textures/meshes added on hit.
  const crack = new T.Group();
  crack.name = 'city-reactive-bullet-scars';
  for (let i = 0; i < 5; i++) {
    const segment = panel(
      crack,
      mats.dark,
      -3 + i * 1.55,
      2 - i * 1.85,
      -spec.d / 2 - 0.76,
      0.56,
      5,
      0.18,
    );
    segment.rotation.z = (i % 2 ? 1 : -1) * 0.58;
  }
  crack.visible = false;
  shell.add(crack);
  const exposed = new T.Group();
  exposed.name = 'city-reactive-exposed-wiring';
  for (const side of [-1, 1]) {
    panel(exposed, mats.orange, side * 3.6, 0, -spec.d / 2 - 0.9, 0.55, 13, 0.5);
    panel(exposed, mats.red, side * 2.5, -2.6, -spec.d / 2 - 0.9, 0.3, 9, 0.4);
  }
  exposed.visible = false;
  shell.add(exposed);

  const scaffold = new T.Group();
  scaffold.name = 'city-reactive-broken-structure';
  for (const side of [-1, 1]) {
    panel(scaffold, mats.dark, side * (spec.w / 2 - 0.9), 0, 0, 1.4, spec.h, 4);
    panel(scaffold, mats.red, side * (spec.w / 2 - 1.4), 1, -2.4, 0.3, spec.h - 3, 0.3);
  }
  panel(scaffold, mats.steel, 0, spec.h / 2 - 1.3, 0, spec.w, 2.6, 4);
  scaffold.position.set(spec.x, spec.y, spec.z);
  scaffold.visible = false;

  const fx = new T.Group();
  fx.name = 'city-reactive-localized-explosion';
  const flash = new T.Mesh(
    new T.IcosahedronGeometry(1, 1),
    new T.MeshBasicMaterial({
      color: '#ffae6e',
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  flash.name = 'city-reactive-explosion-flash';
  const shock = new T.Mesh(
    new T.TorusGeometry(1, 0.17, 6, 20),
    new T.MeshBasicMaterial({
      color: '#ffdba5',
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  shock.name = 'city-reactive-shockwave';
  const smoke = new T.Mesh(
    new T.IcosahedronGeometry(1, 1),
    new T.MeshBasicMaterial({
      color: '#3c5364',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  smoke.name = 'city-reactive-smoke';
  fx.add(flash, shock, smoke);
  fx.visible = false;

  shell.position.set(spec.x, spec.y, spec.z);
  return { shell, scaffold, fx, flash, shock, smoke, crack, exposed };
}

export function createCityReactiveDamage() {
  const root = new T.Group();
  root.name = 'city-reactive-architecture';
  root.visible = false;
  const mats = {
    steel: material('#6e879d'),
    dark: material('#2c4254'),
    glass: material('#224b72', 0.18),
    cyan: glow('#56eaff'),
    orange: glow('#ffaf62'),
    red: glow('#ff6252'),
  };
  const nodes = CITY_DAMAGE_SITES.map((spec, index) => {
    const models = buildDamageBay(spec, mats, index);
    root.add(models.shell, models.scaffold, models.fx);
    const collider = {
      kind: 'bay-' + index,
      center: models.shell.position,
      half: new T.Vector3(spec.w / 2, spec.h / 2, spec.d / 2),
      previousX: spec.x,
      previousY: spec.y,
      previousZ: spec.z,
      active: false,
      solid: true,
    };
    return {
      ...models,
      spec,
      index,
      collider,
      hp: spec.hp,
      hits: 0,
      destroyedAt: -1,
      lastImpactAt: -1,
    };
  });
  const activeColliders = [];
  const targets = [];
  function reset() {
    activeColliders.length = 0;
    targets.length = 0;
    for (const n of nodes) {
      n.hp = n.spec.hp;
      n.hits = 0;
      n.destroyedAt = -1;
      n.lastImpactAt = -1;
      n.shell.position.set(n.spec.x, n.spec.y, n.spec.z);
      n.shell.rotation.set(0, 0, 0);
      n.shell.visible = true;
      n.scaffold.position.set(n.spec.x, n.spec.y, n.spec.z);
      n.scaffold.visible = false;
      n.crack.visible = false;
      n.exposed.visible = false;
      n.fx.visible = false;
      n.collider.active = false;
      n.collider.half.set(n.spec.w / 2, n.spec.h / 2, n.spec.d / 2);
      n.collider.previousX = n.spec.x;
      n.collider.previousY = n.spec.y;
      n.collider.previousZ = n.spec.z;
    }
  }

  function update(dt, seconds, speed, enabled = true) {
    root.visible = enabled;
    activeColliders.length = 0;
    targets.length = 0;
    if (!enabled || !Number.isFinite(dt) || dt < 0) return;
    for (const n of nodes) {
      const { spec, shell, collider } = n;
      collider.previousX = shell.position.x;
      collider.previousY = shell.position.y;
      collider.previousZ = shell.position.z;
      const distance = Math.max(0, speed) * dt;
      shell.position.z += distance;
      n.scaffold.position.z += distance;
      if (n.destroyedAt >= 0) {
        const age = Math.max(0, seconds - n.destroyedAt);
        const progress = smooth(age / 0.84);
        const tilt = -spec.side * 0.64 * progress;
        shell.rotation.z = tilt;
        shell.position.x = spec.x - spec.side * 10 * progress;
        const support = cityDebrisSupportY(spec.w, spec.h, tilt);
        const fall = spec.y - (42 * Math.min(age, 0.9) ** 2) / 2;
        const after = Math.max(0, age - 0.8);
        const rebound = Math.sin(after * 8) ** 2 * Math.exp(-after * 4.1) * 0.9;
        shell.position.y = Math.max(fall, support) + rebound;
        collider.half.set(
          (Math.abs(Math.cos(tilt)) * spec.w + Math.abs(Math.sin(tilt)) * spec.h) / 2,
          (Math.abs(Math.cos(tilt)) * spec.h + Math.abs(Math.sin(tilt)) * spec.w) / 2,
          spec.d / 2,
        );
      }
      const visible = shell.position.z > -650 && shell.position.z < 80;
      shell.visible = visible;
      n.scaffold.visible = n.destroyedAt >= 0 && visible;
      collider.active = visible;
      if (visible) {
        activeColliders.push(collider);
        if (n.destroyedAt < 0) targets.push(n);
      }
      const impactAge = n.lastImpactAt < 0 ? -1 : seconds - n.lastImpactAt;
      n.fx.visible = visible && impactAge >= 0 && impactAge < 0.78;
      if (n.fx.visible) {
        const intensity = (1 - impactAge / 0.78) ** 2;
        n.fx.position.copy(shell.position);
        n.flash.scale.setScalar(1.5 + impactAge * (n.destroyedAt >= 0 ? 15 : 6));
        n.flash.material.opacity = intensity * 0.95;
        n.shock.scale.setScalar(1.3 + impactAge * 13);
        n.shock.material.opacity = intensity * 0.82;
        n.smoke.position.y = 2 + impactAge * 10;
        n.smoke.scale.setScalar(1.8 + impactAge * 13);
        n.smoke.material.opacity = intensity * 0.42;
      }
    }
  }

  /** Segment CCD against actual mesh bounds. One hit can damage one bay. */
  function strike(from, to, damage, seconds) {
    if (!root.visible || !Number.isFinite(damage) || damage <= 0) return null;
    for (const n of targets) {
      const c = n.collider;
      bulletFrom.copy(from).sub(c.center);
      bulletFrom.x += c.center.x - c.previousX;
      bulletFrom.y += c.center.y - c.previousY;
      bulletFrom.z += c.center.z - c.previousZ;
      bulletTo.copy(to).sub(c.center);
      if (!crossesSolid(bulletFrom, bulletTo, zero, c.half, 0.4)) continue;
      n.hp = Math.max(0, n.hp - Math.max(1, damage));
      n.hits++;
      n.lastImpactAt = seconds;
      n.crack.visible = n.hp <= n.spec.hp * 0.7;
      n.exposed.visible = n.hp <= n.spec.hp * 0.35;
      const destroyed = n.hp <= 0;
      if (destroyed) {
        n.destroyedAt = seconds;
        n.scaffold.visible = true;
        // A collapsed panel blocks later projectiles and the player through
        // the normal city solid solver. Stop its hitbox from being targeted.
        const i = targets.indexOf(n);
        if (i !== -1) targets.splice(i, 1);
      }
      return { kind: c.kind, destroyed, damage: Math.min(damage, n.spec.hp), hp: n.hp };
    }
    return null;
  }
  reset();
  return {
    root,
    reset,
    update,
    strike,
    colliders: () => activeColliders,
    snapshot: () =>
      nodes.map((n) => ({
        kind: n.collider.kind,
        x: n.shell.position.x,
        y: n.shell.position.y,
        z: n.shell.position.z,
        active: n.collider.active,
        hp: n.hp,
        hits: n.hits,
        destroyed: n.destroyedAt >= 0,
        impact: n.fx.visible,
        groundClearance:
          n.shell.position.y - cityDebrisSupportY(n.spec.w, n.spec.h, n.shell.rotation.z),
        cracks: n.crack.visible,
        exposed: n.exposed.visible,
      })),
  };
}
