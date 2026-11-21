// Mission-04 reactor defense is authored separately from the generic boss AI.
// These are wall-anchored upper-body sentinels, never free-flying stage enemies.
// The four power regulators supply four robots; the remaining coolant/drive
// systems power the central pulse until the reactor is fully exposed.
export const DEVASTADOR_SENTINEL_COUNT = 4;
export const DEVASTADOR_DEFENSE_WARNING = 1.25;

export function createDevastadorDefenseState() {
  return { nextAt: 4.5, volley: 0, armed: null, fired: 0 };
}

export function devastadorDefenseOnline(parts) {
  if (!Array.isArray(parts)) return { sentinels: [], pulse: false, systems: 0 };
  const sentinels = parts
    .slice(0, DEVASTADOR_SENTINEL_COUNT)
    .map((part, index) => (part?.type === 'power' && part.hp > 0 ? index : -1))
    .filter((index) => index >= 0);
  const remaining = parts.filter((p) => p?.hp > 0);
  return {
    sentinels,
    pulse: remaining.some((p) => p.type === 'coolant' || p.type === 'drive'),
    systems: remaining.length,
  };
}

export function advanceDevastadorDefense(state, {
  age,
  phase = 1,
  parts = [],
  playerX = 0,
  playerY = 0,
} = {}) {
  if (!state || !Number.isFinite(age) || age < 0) return { event: null, state };
  const online = devastadorDefenseOnline(parts);
  if (!online.systems) return { event: null, state: { ...state, armed: null } };
  if (state.armed) {
    // Destroying the actual powered circuit cancels that wall robot's attack.
    const active = state.armed.kind !== 'sentinels' ||
      state.armed.indices.some((index) => online.sentinels.includes(index));
    const hasPulse = state.armed.kind !== 'pulse' || online.pulse;
    if (!active || !hasPulse) {
      return { event: { type: 'cancel', kind: state.armed.kind }, state: {
        ...state, armed: null, nextAt: age + 1.15,
      } };
    }
    if (age < state.armed.fireAt) return { event: null, state };
    const armed = state.armed;
    const indices = armed.indices.filter((index) => online.sentinels.includes(index));
    return {
      event: { type: 'fire', kind: armed.kind, indices, target: armed.target },
      state: {
        ...state,
        armed: null,
        fired: state.fired + 1,
        nextAt: age + Math.max(2.55, 4.7 - Math.max(1, Math.min(3, phase)) * 0.48),
      },
    };
  }
  if (age < state.nextAt) return { event: null, state };
  // The reactor changes attack families, not merely fire rate. All volleys
  // telegraph a latched destination, so moving/boosting genuinely dodges.
  const kind = online.sentinels.length && (!online.pulse || state.volley % 3 !== 2)
    ? 'sentinels' : 'pulse';
  const indices = kind === 'sentinels'
    ? [online.sentinels[state.volley % online.sentinels.length],
        ...(online.sentinels.length > 1
          ? [online.sentinels[(state.volley + 1) % online.sentinels.length]]
          : [])]
    : [];
  const armed = {
    kind,
    indices,
    fireAt: age + DEVASTADOR_DEFENSE_WARNING,
    target: {
      x: Number.isFinite(playerX) ? Math.max(-100, Math.min(100, playerX)) : 0,
      y: Number.isFinite(playerY) ? Math.max(-80, Math.min(120, playerY)) : 0,
    },
  };
  return {
    event: { type: 'warning', kind, indices, seconds: DEVASTADOR_DEFENSE_WARNING },
    state: { ...state, armed, volley: state.volley + 1 },
  };
}
