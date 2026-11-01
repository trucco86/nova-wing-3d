// Deterministic, simulation-clock-only finale for the Devastador sabotage.
// Camera, player controls and legacy eight-second campaign completion remain intact.
export const DEVASTADOR_ESCAPE_BEATS = Object.freeze([
  Object.freeze({
    at: 0,
    phase: 'meltdown',
    speaker: 'bia',
    radio: 'BIA · NÚCLEO DESTRUÍDO! A DEVASTADOR ESTÁ PERDENDO PROPULSÃO!',
    label: 'DEVASTADOR · REATOR EM COLAPSO',
  }),
  Object.freeze({
    at: 1.35,
    phase: 'systems',
    speaker: 'bob',
    radio: 'BOB · FALHA EM CASCATA! MOTORES E SUPORTE DE VIDA DESLIGANDO!',
    label: 'FALHA EM CASCATA · SAÍDA DO NÚCLEO',
  }),
  Object.freeze({
    at: 3.3,
    phase: 'escape',
    speaker: 'calvin',
    radio: 'CALVIN · CORREDOR DE FUGA ABERTO! DESVIE DOS DESTROÇOS!',
    label: 'CORREDOR INDUSTRIAL · EVACUAÇÃO',
  }),
  Object.freeze({
    at: 4.7,
    phase: 'boost',
    speaker: 'christopher',
    radio: 'CHRISTOPHER · AGORA! SEGURE BOOST PARA ESCAPAR DA EXPLOSÃO!',
    label: 'FUGA · SEGURE BOOST',
  }),
  Object.freeze({
    at: 6.45,
    phase: 'warp',
    speaker: 'jenifer',
    radio: 'JENIFER · FIVE CATS EM FORMAÇÃO! ROTA LIVRE, IMPULSO FINAL!',
    label: 'IMPULSO FINAL · SAÍDA DA NAVE-MÃE',
  }),
]);
export const DEVASTADOR_ESCAPE_WARP_START = 6.45;
export const DEVASTADOR_ESCAPE_BOOST_START = 4.7;

export function devastadorEscapeAt(age, { boostedSeconds = 0 } = {}) {
  const t = Math.max(0, Number.isFinite(age) ? age : 0);
  const beat = DEVASTADOR_ESCAPE_BEATS.reduce(
    (last, candidate) => (t >= candidate.at ? candidate : last),
    DEVASTADOR_ESCAPE_BEATS[0],
  );
  const boostWindow = t >= DEVASTADOR_ESCAPE_BOOST_START;
  const boostActivated = boostedSeconds >= 0.25;
  const assistedBoost = t >= DEVASTADOR_ESCAPE_WARP_START && !boostActivated;
  return {
    phase: beat.phase,
    beat: DEVASTADOR_ESCAPE_BEATS.indexOf(beat),
    label: beat.label,
    speaker: beat.speaker,
    radio: beat.radio,
    boostWindow,
    boostActivated,
    assistedBoost,
    warp: t >= DEVASTADOR_ESCAPE_WARP_START,
    hazard: Math.max(0, 1 - t / 8),
    // The emergency thrust is automatic only as a failsafe, never an obstacle
    // that traps the campaign when a controller / phone lacks energy.
    flameScale: t >= DEVASTADOR_ESCAPE_WARP_START ? 3.1 : boostActivated ? 2.2 : 1,
  };
}
