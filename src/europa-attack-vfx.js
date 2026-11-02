import * as T from 'three';

// Three visual-only pieces, no added collision. Radar and melee intent own damage.
export function createEuropaAttackVfx() {
  const root = new T.Group();
  root.name = 'boss-europa-attack-vfx';
  root.userData.visualOnly = true;
  const shock = new T.MeshBasicMaterial({
    color: '#8de6ff', transparent: true, opacity: 0,
    blending: T.AdditiveBlending, depthWrite: false,
  });
  const pincer = new T.MeshBasicMaterial({
    color: '#b9f6ff', transparent: true, opacity: 0,
    blending: T.AdditiveBlending, depthWrite: false,
  });
  const quake = new T.Mesh(new T.TorusGeometry(22, 1.65, 6, 28), shock);
  quake.name = 'europa-impact-charge';
  quake.position.set(0, -24, 27);
  quake.scale.y = 0.5;
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new T.Mesh(new T.BoxGeometry(4, 32, 3), pincer);
    arm.name = side < 0 ? 'europa-left-cryo-arm' : 'europa-right-cryo-arm';
    arm.position.set(side * 42, -11, 23);
    arms.push(arm);
  }
  for (const node of [quake, ...arms]) {
    node.userData.visualOnly = true;
    root.add(node);
  }
  Object.assign(root.userData, { shock, pincer, quake, arms, materials: [shock, pincer] });
  animateEuropaAttackVfx(root, 0);
  return root;
}

export function animateEuropaAttackVfx(root, time, phase = 1, state = 'maneuver', kind = null) {
  if (!root || !Number.isFinite(time)) return;
  const live = state === 'windup' || state === 'attack';
  const quakeOn = live && kind === 'ice-quake';
  const pincerOn = live && kind === 'cryo-pincer';
  const striking = state === 'attack';
  const pulse = 0.78 + Math.sin(time * 7) * 0.22;
  const strength = 1 + Math.max(0, Math.min(2, phase - 1)) * 0.1;
  const { shock, pincer, quake, arms } = root.userData;
  quake.visible = quakeOn;
  for (const arm of arms) arm.visible = pincerOn;
  shock.opacity = quakeOn ? Math.min(0.9, (striking ? 0.84 : 0.48) * pulse * strength) : 0;
  pincer.opacity = pincerOn ? Math.min(0.9, (striking ? 0.8 : 0.45) * pulse * strength) : 0;
  if (quakeOn) {
    quake.rotation.z = time * 0.65;
    quake.scale.x = (striking ? 1.4 : 0.8) * strength;
    quake.scale.y = (striking ? 0.8 : 0.42) * strength;
  }
  if (pincerOn) {
    for (const [i, arm] of arms.entries()) {
      const side = i === 0 ? -1 : 1;
      arm.position.x = side * (striking ? 23 : 42);
      arm.rotation.z = -side * (striking ? 0.25 : 0.06);
      arm.scale.y = (striking ? 1.3 : 0.9) * strength;
    }
  }
}
