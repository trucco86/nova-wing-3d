import * as T from 'three';

// Presentation-only weapon signatures. Real muzzle world coordinates remain
// inside boss-battery-(left|right)-muzzle and boss-core-muzzle, and generator
// HP remains the single source of truth for active guns.
const COLORS = Object.freeze([
  '#ff974f', // Rok · converging pincer
  '#55ecff', // Stingray · high/low scissor
  '#ffd05e', // Carbide · drill helix
  '#72d6ff', // Devastador · reactor vents
  '#ff5739', // Phoenix · solar feathers
  '#c7f5ff', // Europa · glacial hammer
  '#a4ff76', // Hydra · venom heads
  '#ff4d87', // Omega · broadside
  '#b989ff', // Orion · gravitational iris
  '#ffc06d', // Marvin · eclipse
]);
export const BOSS_WEAPON_COLORS = COLORS;

export function bossWeaponColor(index) {
  if (!Number.isInteger(index) || index < 0 || index >= COLORS.length)
    throw new RangeError('Invalid boss weapon index');
  return COLORS[index];
}

// The model already owns the true muzzle anchors. Added meshes are children of
// the existing turrets, so they cannot drift away from emitted projectiles.
export function installBossWeaponVfx(g, index) {
  const color = bossWeaponColor(index);
  const materials = [];
  const material = (value, opacity = 1) => {
    const m = new T.MeshBasicMaterial({
      color: value,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity >= 1,
      blending: opacity < 1 ? T.AdditiveBlending : T.NormalBlending,
      toneMapped: false,
      side: T.DoubleSide,
    });
    materials.push(m);
    return m;
  };
  const rimMat = material(color);
  const coreMat = material('#07111d');
  const flashMat = material(color, 0.85);
  const trimMat = material('#e8faff', 0.92);
  const bore = new T.CylinderGeometry(2.5, 3.25, 10.8, 12);
  bore.rotateX(Math.PI / 2);
  const aperture = new T.CircleGeometry(2.4, 16);
  const ringGeo = new T.TorusGeometry(2.95, 0.62, 8, 24);
  const innerGeo = new T.TorusGeometry(1.55, 0.36, 7, 20);
  const flashGeo = new T.SphereGeometry(3.1, 10, 8);

  const addRig = (holder, muzzle, scale = 1) => {
    // Boring starts on the parent weapon and terminates at the *actual*
    // emission point, not in a floating visual effect.
    const sleeve = new T.Mesh(bore, coreMat);
    sleeve.name = 'boss-weapon-bore';
    sleeve.position.copy(muzzle.position);
    sleeve.position.z -= 5.65 * scale;
    sleeve.scale.setScalar(scale);
    holder.add(sleeve);
    const mouth = new T.Mesh(aperture, coreMat);
    mouth.name = 'boss-weapon-mouth';
    mouth.position.copy(muzzle.position);
    mouth.position.z -= 0.11 * scale;
    mouth.scale.setScalar(scale);
    holder.add(mouth);
    const rim = new T.Mesh(ringGeo, rimMat);
    rim.name = 'boss-weapon-visible-rim';
    rim.position.copy(muzzle.position);
    rim.position.z -= 0.04;
    rim.scale.setScalar(scale);
    holder.add(rim);
    const charge = new T.Mesh(innerGeo, trimMat);
    charge.name = 'boss-weapon-charge';
    charge.position.copy(muzzle.position);
    charge.position.z += 0.15;
    charge.scale.setScalar(scale);
    holder.add(charge);
    const flash = new T.Mesh(flashGeo, flashMat);
    flash.name = 'boss-weapon-flash';
    flash.position.copy(muzzle.position);
    flash.position.z += 2.0 * scale;
    flash.visible = false;
    flash.scale.setScalar(0.1);
    holder.add(flash);
    holder.userData.weaponVfx = { rim, charge, flash, flashAge: 0, scale };
  };
  for (let i = 0; i < 2; i++) {
    const turret = g.userData.batteries[i];
    const muzzle = turret.getObjectByName(
      i === 0 ? 'boss-battery-left-muzzle' : 'boss-battery-right-muzzle',
    );
    addRig(turret, muzzle, index === 7 ? 1.16 : index === 5 ? 1.12 : 1);
    // Distinct guard fins give these cannons a defined industrial silhouette.
    // These are decorative and never receive damage or affect collisions.
    for (const side of [-1, 1]) {
      const fin = new T.Mesh(
        new T.BoxGeometry(index % 3 === 0 ? 2.7 : 1.5, 4.2 + (index % 3) * 2, 10),
        rimMat,
      );
      fin.position.set(side * 4.8, 0, 5.2);
      fin.rotation.z = side * (index % 2 ? 0.35 : -0.15);
      fin.name = 'boss-weapon-guard-fin';
      turret.add(fin);
    }
  }
  const muzzle = g.userData.coreMuzzle;
  addRig(g, muzzle, 0.72);
  // The emergency gun is a separate rig anchored on g; its flash is only
  // enabled after both destructible side generators stop firing.
  g.userData.coreWeaponVfx = {
    ...g.userData.weaponVfx,
  };
  delete g.userData.weaponVfx;
  return materials;
}

export function flashBossWeapon(g, side) {
  const rig =
    side === 0
      ? g?.userData.coreWeaponVfx
      : g?.userData.batteries[side < 0 ? 0 : 1]?.userData.weaponVfx;
  if (!rig) return false;
  rig.flashAge = 0.18;
  rig.flash.visible = true;
  return true;
}

export function animateBossWeaponVfx(g, time, charge = 0, dt = 0) {
  if (!g || !Number.isFinite(time) || !Number.isFinite(charge) || !Number.isFinite(dt) || dt < 0)
    return;
  const rigs = [
    g.userData.batteries[0]?.userData.weaponVfx,
    g.userData.batteries[1]?.userData.weaponVfx,
    g.userData.coreWeaponVfx,
  ];
  const generators = g.userData.parts.map((part) => part.hp > 0);
  for (const [i, rig] of rigs.entries()) {
    if (!rig) continue;
    const active = i < 2 ? generators[i] : !generators.some(Boolean);
    const preload = active ? Math.max(0, Math.min(1, charge)) : 0;
    rig.rim.scale.setScalar(rig.scale * (1 + 0.08 * Math.sin(time * 6) + preload * 0.18));
    rig.charge.scale.setScalar(rig.scale * (0.65 + preload * 0.85));
    rig.charge.visible = active;
    rig.flashAge = Math.max(0, rig.flashAge - dt);
    rig.flash.visible = active && rig.flashAge > 0;
    if (rig.flash.visible) {
      const pulse = rig.flashAge / 0.18;
      rig.flash.scale.setScalar(rig.scale * (0.9 + (1 - pulse) * 1.35));
    }
  }
}
