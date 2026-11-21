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
  // The same glacier rises as Europa exits the shot. The short ice veil
  // bridges the handoff without hiding the next fifteen seconds of scenery.
  const terrainReveal = smooth((seconds - 6) / 9.5);
  const planetOpacity = 1 - smooth((seconds - 6) / 2);
  const approach = smooth(seconds / 6);
  const orbit = smooth((seconds - 6) / 6);
  const entry = smooth((seconds - 12) / 7);
  const iceMist = smooth((seconds - 6.1) / 1.15) * (1 - smooth((seconds - 8.2) / 2.15));
  const cameraDive = smooth((seconds - 11) / 3.5) * (1 - smooth((seconds - 17.5) / 4));
  return Object.freeze({
    phase,
    seconds,
    // Automatic cinematic super boost only during the initial approach.
    // Energy, damage, scoring and player input remain under game control.
    approachBoost: seconds < 6,
    approachProgress: approach,
    approachBoostVisual:
      seconds < 6 ? smooth(seconds / 0.9) * (1 - smooth((seconds - 5.1) / 0.9)) : 0,
    combatReady: seconds >= EUROPA_TOUCHDOWN_SECONDS,
    terrainReveal,
    // Simulation advances in 50ms steps, so a screenshot targeting exactly
    // 8s can land at 7.999999...; preload the canyon behind the ice veil.
    terrainVisible: seconds >= 7.4,
    // Small camera-relative lift shows the glacier horizon at 8s without
    // a sudden ground pop. Floor reaches its gameplay height by 20s.
    // Higher early horizon makes the approach readable inside the blue mist.
    // The floor reaches its unchanged gameplay elevation at 20 seconds.
    terrainLift: seconds >= 15.5 ? 0 : -35 * (1 - smooth((seconds - 6) / 9.5)),
    planetOpacity,
    // The moon must visibly grow WHILE the automatic super boost is active.
    // Previously growth started after the boost had already stopped.
    // Larger, closer moon without intersecting the chase camera.
    planetScale: 0.8 + approach * 1.22 + orbit * 0.04 + entry * 0.02,
    planetZ: -920 + approach * 315,
    // Keep the moon in the camera at approach, then let the ice floor become
    // the primary point of reference without a screen-filling planet.
    planetX: -12 - 80 * smooth((seconds - 6) / 2),
    planetY: 78 + 34 * smooth((seconds - 6) / 2),
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
