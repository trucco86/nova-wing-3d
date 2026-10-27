/** Declarative, side-effect-free stage journey planner. No scene objects are created here. */
export const JOURNEY_PHASES = Object.freeze([
  'approach',
  'transition',
  'interior',
  'boss',
  'escape',
]);

export const STAGE_JOURNEYS = Object.freeze(
  [
    { destination: 'orbital-ascent', entry: 'atmosphere', arena: 'orbit', exit: 'deep-space' },
    {
      destination: 'submerged-port',
      entry: 'ocean-dive',
      arena: 'underwater-facility',
      exit: 'surface',
    },
    {
      destination: 'mega-asteroid',
      entry: 'cavern-mouth',
      arena: 'asteroid-core',
      exit: 'collapse-tunnel',
    },
    { destination: 'orbital-station', entry: 'hangar', arena: 'reactor', exit: 'airlock' },
    { destination: 'storm-planet', entry: 'atmospheric-descent', arena: 'canyon', exit: 'orbit' },
    { destination: 'frozen-moon', entry: 'ice-rift', arena: 'glacial-cavern', exit: 'surface' },
    { destination: 'living-hive', entry: 'organic-tunnel', arena: 'hive-heart', exit: 'breach' },
    {
      destination: 'mothership',
      entry: 'battle-hangar',
      arena: 'command-deck',
      exit: 'escape-bay',
    },
    {
      destination: 'orion-abyss',
      entry: 'accretion-corridor',
      arena: 'gravity-anomaly',
      exit: 'portal',
    },
    { destination: 'marvin-fortress', entry: 'fortress-gate', arena: 'throne', exit: 'victory' },
  ].map((journey) => Object.freeze(journey)),
);

export function journeyForSector(sectorIndex) {
  if (!Number.isInteger(sectorIndex) || sectorIndex < 0 || sectorIndex >= STAGE_JOURNEYS.length) {
    throw new RangeError('Invalid journey sector');
  }
  return STAGE_JOURNEYS[sectorIndex];
}

/**
 * Deterministic transition rules for the stage director.
 * The boss gate cannot be bypassed by elapsed time or distance.
 */
export function advanceJourney(state, event) {
  if (!state || !JOURNEY_PHASES.includes(state.phase)) throw new TypeError('Invalid journey state');
  const transitions = {
    approach: { destinationReached: 'transition' },
    transition: { entryCompleted: 'interior' },
    interior: { arenaReached: 'boss' },
    boss: { bossDefeated: 'escape' },
    escape: { exitReached: 'complete' },
  };
  const next = transitions[state.phase]?.[event];
  return next ? { ...state, phase: next } : state;
}

/** Time gates are intentionally capped before the boss; defeating the boss is an explicit event. */
export function journeyPhaseAt(elapsedSeconds, stageDuration) {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0)
    throw new RangeError('Invalid elapsed time');
  if (!Number.isFinite(stageDuration) || stageDuration <= 0)
    throw new RangeError('Invalid stage duration');
  const progress = Math.min(1, elapsedSeconds / stageDuration);
  if (progress < 0.2) return 'approach';
  if (progress < 0.35) return 'transition';
  if (progress < 0.78) return 'interior';
  return 'boss';
}

export function initialJourney(sectorIndex) {
  return { sectorIndex, destination: journeyForSector(sectorIndex).destination, phase: 'approach' };
}
