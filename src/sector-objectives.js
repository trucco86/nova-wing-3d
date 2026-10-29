// Optional flight objectives, authored for individual sector geography.
// The mission never blocks a boss, takes health or changes enemy density.
const PLANS = Object.freeze({
  1: { id: 'harbor-escort', label: 'ESCOLTA DO PORTO', x: 26, y: 22 },
  4: { id: 'solar-slit', label: 'FENDA SEGURA DE PLASMA', x: -26, y: 30 },
  5: { id: 'ice-corridor', label: 'CORREDOR GLACIAL', x: 27, y: 14 },
  7: { id: 'fleet-gap', label: 'ABERTURA DA FROTA', x: -28, y: 20 },
  8: { id: 'orion-high-pass', label: 'PASSAGEM SUPERIOR DE ÓRION', x: 0, y: 35 },
});
const START = 0.34;
const END = 0.63;
const HOLD_SECONDS = 3;
const EPSILON = 1e-8;

export function sectorObjectiveAt(sector) {
  if (!Number.isInteger(sector) || sector < 0 || sector > 9)
    throw new RangeError('Invalid sector');
  const plan = PLANS[sector];
  return plan
    ? Object.freeze({
        ...plan,
        startFraction: START,
        endFraction: END,
        requiredSeconds: HOLD_SECONDS,
        rewardCredits: 40,
        rewardXP: 22,
      })
    : null;
}

export function initialSectorObjective(sector) {
  return { status: sectorObjectiveAt(sector) ? 'pending' : 'none', hold: 0 };
}

export function advanceSectorObjective(state, plan, seconds, duration, position, dt) {
  if (!plan || !state || state.status === 'none') {
    return { state: { status: 'none', hold: 0 }, event: null };
  }
  if (['completed', 'missed'].includes(state.status))
    return { state: { ...state }, event: null };
  if (!Number.isFinite(dt) || dt < 0 || !Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0)
    throw new RangeError('Invalid objective timing');
  const beginning = duration * plan.startFraction;
  const deadline = duration * plan.endFraction;
  if (seconds >= deadline) return { state: { status: 'missed', hold: 0 }, event: 'missed' };
  if (seconds < beginning) return { state: { status: 'pending', hold: 0 }, event: null };
  const dx = position.x - plan.x;
  const dy = position.y - plan.y;
  const inLane = (dx * dx) / (14 * 14) + (dy * dy) / (11 * 11) <= 1;
  const hold = inLane ? Math.min(HOLD_SECONDS, state.hold + dt) : Math.max(0, state.hold - dt * 1.5);
  if (hold + EPSILON >= HOLD_SECONDS)
    return { state: { status: 'completed', hold: HOLD_SECONDS }, event: 'completed' };
  return {
    state: { status: 'active', hold },
    event: state.status === 'pending' ? 'started' : null,
  };
}
