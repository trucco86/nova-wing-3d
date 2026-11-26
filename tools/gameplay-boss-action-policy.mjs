import { dodgeDecision } from './gameplay-boss-dodge-policy.mjs';

// Read public radar and the availability of the player's own special controls.
// Never modify damage, target positions, cooldowns or energy.
export function combatDecision(state, { tactical = false } = {}) {
  if (state.state !== 'playing' || !state.boss) {
    return { x: 0, y: 0, reason: 'inactive', fire: false, action: 'idle' };
  }
  const move = dodgeDecision(state);
  if (move.x || move.y) return { ...move, fire: false, action: 'dodge' };
  if (
    state.mode === 'physical' &&
    state.danger !== false &&
    ['windup', 'attack'].includes(state.phase)
  ) {
    return { ...move, fire: false, action: 'observe-danger' };
  }
  if (state.phase === 'approach') return { ...move, fire: false, action: 'observe-approach' };
  if (tactical && state.phase === 'recovery' && !state.specialActive) {
    const special =
      state.plasmaReady === true ? 'plasma' : state.overdriveReady === true ? 'overdrive' : null;
    if (special) return { ...move, fire: false, action: 'special-' + special, special };
  }
  return {
    ...move,
    fire: true,
    action: state.phase === 'recovery' ? 'fire-recovery' : 'fire',
  };
}
