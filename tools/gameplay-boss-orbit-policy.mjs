// Strategy driven by visible orbital radar, vulnerable cues and ready controls.
// No internal boss angles, damage calls or modification of player resources.
export function orbitalDelta(player, target) {
  if (!Number.isFinite(player) || !Number.isFinite(target)) return null;
  return Math.atan2(Math.sin(target - player), Math.cos(target - player));
}

export function orbitalDecision(state, decision, initialShield) {
  if (
    state.state !== 'playing' ||
    !state.boss ||
    state.phase === 'approach' ||
    (state.mode === 'physical' && state.danger !== false) ||
    decision.action === 'dodge' ||
    decision.action === 'observe-danger'
  ) {
    return decision;
  }
  const stop = { ...decision, x: 0, y: 0, fire: false, special: undefined, equipment: undefined };
  if (state.repairReady && state.shield < initialShield * 0.65) {
    return { ...stop, action: 'repair', utility: 'repair' };
  }
  if (decision.equipment) return decision;
  const open = state.screen?.cues?.some((cue) => cue.visible && cue.state === 'open');
  if (state.bossParts > 0 && !open) {
    if (!state.targetVisible && state.scanReady && !state.specialActive) {
      return { ...stop, action: 'scan', utility: 'scan' };
    }
    const delta =
      state.mode === 'orbital' && state.targetVisible
        ? orbitalDelta(state.playerAngle, state.targetAngle)
        : null;
    // Physical radar hides the orbital player arrow. Search clockwise instead
    // of reading its hidden position. In orbital mode use the shortest arc.
    return {
      ...stop,
      action: 'orbit-search',
      orbit: delta !== null && delta < -0.2 ? -1 : 1,
    };
  }
  if (decision.special) return decision;
  if (open && state.precisionReady && state.phase === 'recovery') {
    return { ...stop, action: 'precision', utility: 'precision' };
  }
  return decision;
}
