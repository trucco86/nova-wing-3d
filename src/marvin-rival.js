import * as T from 'three';
import { fighter, createFlyingRobot } from './visuals.js';

// A continuous rival arc; stages 1–3 are deliberately untouched.
// Brief duels are capped and never change campaign progression, trophies or
// ranking; the actual mission boss still guards each sector completion.
export const MARVIN_ARC = Object.freeze({
  4: Object.freeze({ type: 'intercept', start: 31, end: 53, form: 'fighter',
    notice: 'CONTATO HOSTIL · MARVIN PILOTA UM CAÇA NEGRO!', speaker: 'bob' }),
  5: Object.freeze({ type: 'transformation', start: 37, end: 59, form: 'robot',
    notice: 'MARVIN TRANSFORMOU O CAÇA EM ROBÔ · PREPARE-SE!', speaker: 'christopher' }),
  6: Object.freeze({ type: 'boss-support', start: 31, end: Infinity, form: 'fighter',
    notice: 'MARVIN ESTÁ PROTEGENDO A COLMEIA · DOIS INIMIGOS!', speaker: 'bia' }),
  7: Object.freeze({ type: 'ambush', start: 41, end: 61, form: 'fighter',
    notice: 'MARVIN RETORNOU · INTERCEPÇÃO NO BLOQUEIO!', speaker: 'bob' }),
  8: Object.freeze({ type: 'monster-pilot', start: 46, end: Infinity, form: 'robot',
    notice: 'MARVIN ASSUMIU O CONTROLE DO BASTIÃO!', speaker: 'calvin' }),
  9: Object.freeze({ type: 'pursuit', start: 8, end: Infinity, form: 'fighter',
    notice: 'ALVO PRINCIPAL · PERSIGA O CAÇA DE MARVIN!', speaker: 'bia' }),
});
const smooth = (v) => {
  const n = Math.max(0, Math.min(1, v));
  return n * n * (3 - 2 * n);
};
export function marvinBeatAt(sector, elapsed, duration, bossActive = false, forcedRetreat = false) {
  const arc = MARVIN_ARC[sector];
  if (!arc || !Number.isFinite(elapsed) || elapsed < arc.start || forcedRetreat)
    return { active: false, type: arc?.type ?? 'none', phase: 'hidden', shoot: false };
  const end = Math.min(duration - 5, arc.end);
  if (arc.type === 'monster-pilot') {
    return { active: false, type: arc.type, phase: bossActive ? 'piloting-boss' : 'foreshadow',
      shoot: false };
  }
  if (arc.type === 'boss-support' && !bossActive) {
    return { active: false, type: arc.type, phase: 'await-boss', shoot: false };
  }
  if (arc.type === 'pursuit' && bossActive) {
    return { active: false, type: arc.type, phase: 'final-duel', shoot: false };
  }
  const age = elapsed - arc.start;
  if (arc.type !== 'boss-support' && elapsed >= end) {
    return { active: false, type: arc.type, phase: 'escaped', shoot: false };
  }
  const entry = smooth(age / 2.7);
  const retreat = arc.type === 'boss-support' ? 0 : smooth((elapsed - end + 4) / 4);
  const robot = arc.type === 'transformation' && age >= 6 && age <= 17;
  // Unlike randomly spinning enemies, Marvin executes a legible series of
  // lateral feints, controlled attack passes and deliberate retreats.
  const x = Math.sin(age * (arc.type === 'pursuit' ? 0.47 : 0.32)) * (arc.type === 'pursuit' ? 19 : 23);
  const y = 12 + Math.sin(age * 0.59) * 8 + (robot ? 5 : 0);
  const z = -195 + 90 * entry - 370 * retreat + (arc.type === 'pursuit' ? -18 * Math.sin(age * 0.18) : 0);
  return {
    active: true, type: arc.type, phase: retreat ? 'escaping' : robot ? 'robot' : 'attack',
    form: robot ? 'robot' : 'fighter', x, y, z, age,
    shoot: entry > 0.9 && retreat < 0.1,
    retreat,
  };
}

export function createMarvinRival(scene) {
  const root = new T.Group();
  root.name = 'marvin-rival-encounter';
  const ship = fighter(true);
  ship.name = 'marvin-obsidian-fighter';
  ship.scale.setScalar(3.3);
  // Distinct custom paint: a large black Five Cats-derived silhouette with
  // vivid crimson navigation lines. Clone before repainting shared templates.
  const cloned = new Map();
  ship.traverse((part) => {
    if (!part.material) return;
    const materials = Array.isArray(part.material) ? part.material : [part.material];
    const local = materials.map((m) => {
      if (!cloned.has(m)) {
        const copy = m.clone();
        if (copy.isMeshStandardMaterial || copy.isMeshPhysicalMaterial) {
          copy.color.set(m.metalness > 0.6 ? '#11151e' : '#29202b');
          if (copy.emissive) copy.emissive.set('#2b0711');
          copy.roughness = 0.25;
          copy.metalness = 0.84;
        }
        cloned.set(m, copy);
      }
      return cloned.get(m);
    });
    part.material = Array.isArray(part.material) ? local : local[0];
  });
  root.add(ship);
  const robot = createFlyingRobot();
  robot.name = 'marvin-obsidian-mecha';
  robot.scale.setScalar(3.0);
  const mechaMats = new Map();
  robot.traverse((part) => {
    if (!part.material) return;
    const materials = Array.isArray(part.material) ? part.material : [part.material];
    const local = materials.map((m) => {
      if (!mechaMats.has(m)) {
        const copy = m.clone();
        if (copy.isMeshStandardMaterial || copy.isMeshPhysicalMaterial) {
          copy.color.set('#181822');
          if (copy.emissive) copy.emissive.set('#a10c27');
        } else if (copy.color && !copy.isSpriteMaterial) {
          copy.color.set('#f13b55');
        }
        mechaMats.set(m, copy);
      }
      return mechaMats.get(m);
    });
    part.material = Array.isArray(part.material) ? local : local[0];
  });
  robot.visible = false;
  root.add(robot);
  const muzzleMaterial = new T.MeshBasicMaterial({ color: '#ff304b', toneMapped: false });
  for (const side of [-1, 1]) {
    const muzzle = new T.Mesh(new T.SphereGeometry(0.36, 10, 8), muzzleMaterial);
    muzzle.name = side < 0 ? 'marvin-rival-muzzle-left' : 'marvin-rival-muzzle-right';
    muzzle.position.set(side * 8.0, 0, 12);
    root.add(muzzle);
  }
  scene.add(root);
  root.visible = false;
  let lastSector = -1;
  let lastVolley = -1;
  let announced = false;
  let retreat = false;
  let hp = 135;
  let state = null;
  return {
    reset() {
      lastSector = -1;
      lastVolley = -1;
      announced = false;
      retreat = false;
      hp = 135;
      state = null;
      root.visible = false;
    },
    update({ sector, elapsed, duration, bossActive = false, player, fire, notify }) {
      if (sector !== lastSector) {
        lastSector = sector;
        lastVolley = -1;
        announced = false;
        retreat = false;
        hp = 135;
      }
      const arc = MARVIN_ARC[sector];
      state = marvinBeatAt(sector, elapsed, duration, bossActive, retreat);
      if (arc && elapsed >= arc.start && !announced && (arc.type !== 'boss-support' || bossActive)) {
        announced = true;
        notify?.(arc.notice, arc.speaker);
      }
      root.visible = state.active;
      if (!state.active) return state;
      root.position.set(state.x, state.y, state.z);
      ship.visible = state.form === 'fighter';
      robot.visible = state.form === 'robot';
      root.rotation.set(0, Math.sin(state.age * 0.44) * 0.24, Math.sin(state.age * 0.78) * 0.18);
      ship.rotation.z = Math.sin(state.age * 1.2) * 0.09;
      robot.rotation.z = Math.sin(state.age * 0.7) * 0.12;
      if (state.shoot && typeof fire === 'function' && player) {
        const volley = Math.floor(state.age / (state.type === 'pursuit' ? 2.2 : 3.2));
        if (volley > lastVolley) {
          lastVolley = volley;
          root.updateMatrixWorld(true);
          for (const side of ['left', 'right']) {
            const muzzle = root.getObjectByName('marvin-rival-muzzle-' + side);
            fire(muzzle.getWorldPosition(new T.Vector3()), player.clone(), 'fire');
          }
        }
      }
      return state;
    },
    hit(amount) {
      if (!state?.active || !Number.isFinite(amount) || amount <= 0) return 0;
      const damage = Math.min(hp, amount);
      hp -= damage;
      if (hp <= 0 && state.type !== 'pursuit') retreat = true;
      // During the pursuit Marvin cannot be destroyed before the last boss
      // encounter: pressure forces defensive flight but not a false victory.
      if (hp <= 0 && state.type === 'pursuit') hp = 1;
      return damage;
    },
    target() {
      return state?.active ? root.position.clone() : null;
    },
    snapshot() {
      return { visible: root.visible, phase: state?.phase ?? 'hidden',
        form: state?.form ?? null, type: state?.type ?? 'none', hp, position: root.position.toArray() };
    },
    destroy() {
      scene.remove(root);
      const geos = new Set();
      root.traverse((o) => { if (o.geometry && !ship.getObjectByName(o.name)) geos.add(o.geometry); });
      geos.forEach((g) => g.dispose());
      for (const m of cloned.values()) m.dispose();
      for (const m of mechaMats.values()) m.dispose();
      muzzleMaterial.dispose();
    },
  };
}
