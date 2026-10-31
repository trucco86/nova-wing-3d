/** Deterministic attack entrance for enemy ground and hover mechs. Pure gameplay timing. */
const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const ROBOT_DEPLOY_SECONDS = 1.9;
export const ROBOT_EYE_WARNING_SECONDS = 0.7;
export function robotAttackPose(age, x, y, variant, playerX, airborne = false) {
  const t = clamp01(age / ROBOT_DEPLOY_SECONDS);
  const landed = t * t * (3 - 2 * t);
  const flank = variant % 2 ? -1 : 1;
  const sideApproach = flank * 16 * (1 - landed);
  const pursuit = clamp01((age - ROBOT_DEPLOY_SECONDS) / 4);
  const tracking = (playerX - x) * 0.12 * pursuit;
  const strafe = Math.sin(age * (1.75 + variant * 0.09) + variant * 1.3) * (2.6 + 5 * landed);
  return {
    x: x + sideApproach + strafe + tracking,
    y: airborne
      ? y + (1 - landed) * 17 + Math.sin(age * 1.65 + variant) * 3
      : -7 + (1 - landed) * (27 + (variant % 3) * 6),
    bank: -flank * (1 - landed) * 0.24 + Math.sin(age * 1.3 + variant) * 0.07,
    deployed: age >= ROBOT_DEPLOY_SECONDS,
    windup: t >= 1 ? 1 : 0,
  };
}
export function robotEyeBurstReady(age, forwardZ, cooldown) {
  return age >= ROBOT_DEPLOY_SECONDS && forwardZ > -190 && forwardZ < -15 && cooldown <= 0;
}
