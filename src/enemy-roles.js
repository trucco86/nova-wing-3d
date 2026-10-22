export const FIGHTER_ROLES = ['pursuer', 'interceptor', 'bomber'];

// Coordinates remain in the same local collision frame as the rest of the mission.
export function fighterMotion(role, age, originX, originY, playerX, phase = 0) {
  const wave = Math.sin(age * (role === 'interceptor' ? 2.8 : 1.2) + phase);
  const x =
    role === 'pursuer'
      ? originX + Math.max(-12, Math.min(12, playerX - originX)) * Math.min(1, age / 2)
      : originX + wave * (role === 'interceptor' ? 16 : 4);
  return {
    x,
    y: originY + Math.sin(age * 1.5 + phase) * (role === 'bomber' ? 1 : 3),
    bank: role === 'interceptor' ? wave * 0.3 : 0,
  };
}

export function fighterAdvance(z, age, dt, routeSpeed) {
  return age < 3.2 ? Math.min(-90, z + 150 * dt) : z + routeSpeed * dt;
}

export function fighterAimOffsets(role) {
  return role === 'bomber' ? [-12, 0, 12] : role === 'interceptor' ? [-5, 5] : [0];
}
