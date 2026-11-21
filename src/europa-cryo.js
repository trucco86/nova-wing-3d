// Europa cryogenic laser debuff. Small, deterministic state machine that
// never changes damage protection, physics collision or other sectors.
export const EUROPA_CRYO_MAX_STACKS = 3;
export const EUROPA_CRYO_THAW_SECONDS = 16;
export function europaCryoHit(stacks) {
  if (!Number.isInteger(stacks) || stacks < 0 || stacks > EUROPA_CRYO_MAX_STACKS)
    throw new RangeError('Invalid cryogenic ice stacks');
  return Math.min(EUROPA_CRYO_MAX_STACKS, stacks + 1);
}
export function europaCryoRoll(stacks) {
  if (!Number.isInteger(stacks) || stacks < 0 || stacks > EUROPA_CRYO_MAX_STACKS)
    throw new RangeError('Invalid cryogenic ice stacks');
  return Math.max(0, stacks - 1);
}
export function europaCryoMovement(stacks) {
  if (!Number.isInteger(stacks) || stacks < 0 || stacks > EUROPA_CRYO_MAX_STACKS)
    throw new RangeError('Invalid cryogenic ice stacks');
  return 1 - stacks * 0.1;
}
export function europaCryoBoost(stacks) {
  if (!Number.isInteger(stacks) || stacks < 0 || stacks > EUROPA_CRYO_MAX_STACKS)
    throw new RangeError('Invalid cryogenic ice stacks');
  return 1 - stacks * 0.065;
}
