import { dodgeDecision } from './gameplay-boss-dodge-policy.mjs';

// Conservative first combat policy. Attack only outside an indicated danger zone.
// Uses the same visible radar guidance as the dodge policy; no hidden damage oracle.
export function combatDecision(state) {
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
  if (state.state !== 'playing' || !state.boss) {
    return { ...move, fire: false, action: 'idle' };
  }
  return {
    ...move,
    fire: true,
    action: state.phase === 'recovery' ? 'fire-recovery' : 'fire',
  };
}
