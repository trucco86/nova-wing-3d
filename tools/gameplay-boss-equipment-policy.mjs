// One deliberate equipment change per control in an observed safe window.
// Preserve the ordinary flight policy when a control is unavailable.
export function equipmentDecision(state, decision, attempted = []) {
  if (
    state.state !== 'playing' ||
    !state.boss ||
    state.phase !== 'recovery' ||
    state.danger === true ||
    !decision.fire ||
    decision.x ||
    decision.y
  ) {
    return decision;
  }
  if (state.pods > 0 && !state.podsDetached && !attempted.includes('pods')) {
    return { ...decision, fire: false, action: 'deploy-pods', equipment: 'pods' };
  }
  if (state.energy >= 25 && !state.robot && !attempted.includes('robot')) {
    return { ...decision, fire: false, action: 'transform-robot', equipment: 'robot' };
  }
  return decision;
}
