import * as T from 'three';

// Cosmetic, reusable VFX. The collision and radar remain authoritative.
export function createPhoenixAttackVfx() {
  const group = new T.Group();
  group.name = 'boss-phoenix-attack-vfx';
  group.userData.visualOnly = true;
  const solar = new T.MeshBasicMaterial({
    color: '#ffb346',
    transparent: true,
    opacity: 0,
    blending: T.AdditiveBlending,
    depthWrite: false,
  });
  const wing = new T.MeshBasicMaterial({
    color: '#ff5f3d',
    transparent: true,
    opacity: 0,
    blending: T.AdditiveBlending,
    depthWrite: false,
  });
  const core = new T.Mesh(new T.TorusGeometry(13, 1.4, 6, 24), solar);
  core.name = 'phoenix-dive-charge';
  core.position.set(0, 0, 28);
  const dive = new T.Mesh(new T.ConeGeometry(7, 45, 8), solar);
  dive.name = 'phoenix-dive-plasma';
  dive.rotation.x = Math.PI / 2;
  dive.position.set(0, 0, 47);
  const swept = [];
  for (const side of [-1, 1]) {
    const beam = new T.Mesh(new T.BoxGeometry(38, 3, 3), wing);
    beam.name = side < 0 ? 'phoenix-port-wing-telegraph' : 'phoenix-starboard-wing-telegraph';
    beam.position.set(side * 42, 12, 24);
    swept.push(beam);
  }
  for (const part of [core, dive, ...swept]) {
    part.userData.visualOnly = true;
    group.add(part);
  }
  Object.assign(group.userData, { solar, wing, core, dive, swept, materials: [solar, wing] });
  animatePhoenixAttackVfx(group, 0);
  return group;
}

// State and time come from the existing simulation, never from timers.
// All four meshes are invisible outside the corresponding attack.
export function animatePhoenixAttackVfx(group, time, phase = 1, state = 'maneuver', kind = null) {
  if (!group || !Number.isFinite(time)) return;
  const active = state === 'windup' || state === 'attack';
  const diving = active && kind === 'plasma-dive';
  const sweeping = active && kind === 'solar-sweep';
  const strike = state === 'attack';
  const pulse = 0.72 + 0.28 * Math.sin(time * 8);
  const boost = 1 + 0.09 * Math.max(0, Math.min(2, phase - 1));
  const { solar, wing, core, dive, swept } = group.userData;
  core.visible = dive.visible = diving;
  for (const beam of swept) beam.visible = sweeping;
  solar.opacity = diving ? Math.min(0.92, (strike ? 0.82 : 0.44) * pulse * boost) : 0;
  wing.opacity = sweeping ? Math.min(0.9, (strike ? 0.78 : 0.42) * pulse * boost) : 0;
  if (diving) {
    core.scale.setScalar((strike ? 1.25 : 0.9) * boost * (0.95 + pulse * 0.1));
    core.rotation.z = time * 0.85;
    dive.scale.set(0.85 + pulse * 0.3, strike ? 1.4 : 0.45, 0.85 + pulse * 0.3);
  }
  if (sweeping) {
    swept.forEach((beam, i) => {
      const side = i === 0 ? -1 : 1;
      beam.rotation.z = side * (strike ? 0.28 : 0.08);
      beam.scale.x = (strike ? 1.22 : 0.8) * boost;
      beam.scale.y = 0.65 + pulse * 0.6;
    });
  }
}
