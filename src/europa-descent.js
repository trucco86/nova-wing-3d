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
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid Europa arrival time');
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
  // At orbit handoff the moon leaves the shot completely, as on Mars.
  // A dense but short blue/white ice curtain masks the descent into the fissure.
  // Browser evidence at 8-10s showed blank blue sky after moon fade.
  // Bring the SAME canyon into view from the first orbit-crossing frames;
  // the ice curtain still masks the slow-rise, not an empty scene.
  const terrainReveal = smooth((seconds - 6) / 19);
  const planetOpacity = 1 - smooth((seconds - 6) / 2);
  const approach = smooth(seconds / 6);
  const orbit = smooth((seconds - 6) / 6);
  const entry = smooth((seconds - 12) / 7);
  const iceMist = smooth((seconds - 6) / 2) * (1 - smooth((seconds - 20) / 5));
  const cameraDive = smooth((seconds - 12) / 4) * (1 - smooth((seconds - 20) / 5));
  return Object.freeze({
    phase,
    seconds,
    // Automatic cinematic super boost only during the initial approach.
    // Energy, damage, scoring and player input remain under game control.
    approachBoost: seconds < 6,
    approachProgress: approach,
    approachBoostVisual: seconds < 6 ? smooth(seconds / 0.9) * (1 - smooth((seconds - 5.1) / 0.9)) : 0,
    combatReady: seconds >= EUROPA_TOUCHDOWN_SECONDS,
    terrainReveal,
    terrainVisible: seconds >= 8,
    // Small camera-relative lift shows the glacier horizon at 8s without
    // a sudden ground pop. Floor reaches its gameplay height by 20s.
    terrainLift: -65 * (1 - smooth((seconds - 6) / 14)),
    planetOpacity,
    // The moon must visibly grow WHILE the automatic super boost is active.
    // Previously growth started after the boost had already stopped.
    planetScale: 0.74 + approach * 0.8 + orbit * 0.07 + entry * 0.03,
    planetZ: -920 + approach * 205,
    // Keep the moon in the camera at approach, then let the ice floor become
    // the primary point of reference without a screen-filling planet.
    planetX: -24 - 68 * smooth((seconds - 6) / 2),
    planetY: 105 + 22 * smooth((seconds - 6) / 2),
    iceMist,
    starOpacity: 0.75 * (1 - smooth((seconds - 12) / 12)),
    cameraAscent: cameraDive === 0 ? 0 : -0.32 * cameraDive,
    label: {
      space: 'SUPER BOOST AUTOMÁTICO · APROXIMANDO DE EUROPA',
      orbit: 'ÓRBITA DE EUROPA · PREPARAR MERGULHO NA FENDA',
      entry: 'ENTRANDO NA FENDA · CRISTAIS À FRENTE',
      descent: 'DESCIDA CONTROLADA · CÂNION CONGELADO',
      surface: 'EUROPA · CÂNION CRISTALINO · COMBATE',
    }[phase],
  });
}
