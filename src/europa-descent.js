// Europa cinematic arrival uses the same continuous staged timing as Mars:
// space -> orbit -> entry -> descent -> surface. Europa has almost no
// substantial atmosphere, so the crossing is ice debris / fissure mist,
// never a fiery Mars-style reentry or a second invented planet.
export const EUROPA_TOUCHDOWN_SECONDS = 25;

const smooth = (v) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};

export function europaDescentAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0)
    throw new RangeError('Invalid Europa arrival time');
  const phase =
    seconds < 6
      ? 'space'
      : seconds < 12
        ? 'orbit'
        : seconds < 19
          ? 'entry'
          : seconds < EUROPA_TOUCHDOWN_SECONDS
            ? 'descent'
            : 'surface';
  // Terrain begins coming into sight before the moon globe fades, avoiding
  // the old blank interval from t=12s until roughly t=18s.
  const terrainReveal = smooth((seconds - 14) / 11);
  const planetOpacity = 1 - smooth((seconds - 17) / 8);
  const orbit = smooth((seconds - 6) / 6);
  const entry = smooth((seconds - 12) / 7);
  const iceMist = smooth((seconds - 12) / 4) * (1 - smooth((seconds - 19.5) / 5.5));
  const cameraDive = smooth((seconds - 12) / 4) * (1 - smooth((seconds - 20) / 5));
  return Object.freeze({
    phase,
    seconds,
    combatReady: seconds >= EUROPA_TOUCHDOWN_SECONDS,
    terrainReveal,
    terrainVisible: seconds >= 14.5,
    terrainLift: terrainReveal === 1 ? 0 : -240 * (1 - terrainReveal),
    planetOpacity,
    planetScale: 0.74 + orbit * 0.55 + entry * 0.34,
    // Keep the moon in the camera at approach, then let the ice floor become
    // the primary point of reference without a screen-filling planet.
    planetX: -24 - 112 * smooth((seconds - 13) / 12),
    planetY: 105 + 40 * terrainReveal,
    iceMist,
    starOpacity: 0.75 * (1 - smooth((seconds - 12) / 12)),
    cameraAscent: cameraDive === 0 ? 0 : -0.32 * cameraDive,
    label: {
      space: 'EUROPA À VISTA · APROXIMAÇÃO',
      orbit: 'ÓRBITA DE EUROPA · FENDA GLACIAL IDENTIFICADA',
      entry: 'ENTRANDO NA FENDA · CRISTAIS À FRENTE',
      descent: 'DESCIDA CONTROLADA · CÂNION CONGELADO',
      surface: 'EUROPA · CÂNION CRISTALINO · COMBATE',
    }[phase],
  });
}
