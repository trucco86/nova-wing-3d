// Devastador Stage 04: one continuous mission with a reactor access sequence.
// Three internal modules must be activated before the existing core/boss fight.
// UI and 3D exploration are merely different modes of this one stage.
export const DEVASTADOR_REACTOR_SECTOR = 3;
export const DEVASTADOR_ACCESS_THRESHOLD = 0.74;
export const DEVASTADOR_ACCESS_MODULES = Object.freeze([
  Object.freeze({
    id: 'transmission-a',
    name: 'CIRCUITOS',
    action: 'Restabelecer distribuição de energia',
  }),
  Object.freeze({
    id: 'reactor-map',
    name: 'REFRIGERAÇÃO',
    action: 'Liberar a refrigeração do núcleo',
  }),
  Object.freeze({ id: 'broken-beacon', name: 'MOTORES', action: 'Destravar os propulsores' }),
]);
const ids = new Set(DEVASTADOR_ACCESS_MODULES.map(({ id }) => id));

export function reactorModulesComplete(activated) {
  return (
    Array.isArray(activated) &&
    activated.length === DEVASTADOR_ACCESS_MODULES.length &&
    new Set(activated).size === DEVASTADOR_ACCESS_MODULES.length &&
    activated.every((id) => ids.has(id))
  );
}

export function shouldEnterDevastadorReactorAccess({
  sector,
  elapsed,
  duration,
  completed = false,
  active = false,
  boss = false,
  subbossActive = false,
  encounter = 'stage',
  dynamicFlight = true,
} = {}) {
  return (
    dynamicFlight === true &&
    sector === DEVASTADOR_REACTOR_SECTOR &&
    encounter === 'stage' &&
    Number.isFinite(elapsed) &&
    Number.isFinite(duration) &&
    duration > 0 &&
    elapsed >= duration * DEVASTADOR_ACCESS_THRESHOLD &&
    !completed &&
    !active &&
    !boss &&
    !subbossActive
  );
}
