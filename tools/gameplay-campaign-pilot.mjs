// First mission navigation policy, using own flight position and the actual
// launch status. Authored route sweep is not a collision avoidance oracle.
export function campaignFlight(state) {
  if (state.state !== 'playing' || state.launchCinematic || state.boss) {
    return { x: 0, y: 0, fire: false, boost: false };
  }
  const phase = state.orbitalLaunch?.phase;
  if (phase === 'boost') return { x: 0, y: 0, fire: true, boost: true };
  const xTarget = Math.sin(state.seconds * 0.65) * 20;
  const yTarget = phase === 'city' ? 22 : 8;
  const x = Math.abs(state.player.x - xTarget) > 4 ? Math.sign(xTarget - state.player.x) : 0;
  const y = Math.abs(state.player.y - yTarget) > 3 ? Math.sign(yTarget - state.player.y) : 0;
  return { x, y, fire: true, boost: false };
}
