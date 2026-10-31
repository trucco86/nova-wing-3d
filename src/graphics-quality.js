/** Browser-only render budgets; never change gameplay physics. */
export const GRAPHICS_OPTIONS = Object.freeze(['auto', 'medium', 'high']);
export function resolveGraphicsQuality(mode, { coarsePointer = false, deviceMemory = null } = {}) {
  if (mode === 'medium' || mode === 'high') return mode;
  return coarsePointer || (Number.isFinite(deviceMemory) && deviceMemory <= 4) ? 'medium' : 'high';
}
export function graphicsPixelRatioLimit(quality, { coarsePointer = false } = {}) {
  // A high-DPI mobile panel can cost 2–3x the pixels of a laptop even at an
  // identical CSS size. Start conservatively; runtime adaptation may go lower.
  if (quality === 'high') return coarsePointer ? 1.12 : 1.7;
  return coarsePointer ? 0.98 : 1.2;
}

/**
 * Adaptive 3D budget controlled by measured, active *render-frame* pacing.
 * Ignore background tabs, pause, menu, and long unrepresentative frame gaps.
 * Manual HIGH retains its geometry but can downscale internal resolution to
 * protect FPS; AUTO may downgrade geometry High -> Medium as a last resort.
 * The chosen user setting is never mutated/persisted by this controller.
 */
export function createAdaptiveGraphics({
  mode = 'auto',
  coarsePointer = false,
  deviceMemory = null,
  hardwareConcurrency = null,
} = {}) {
  let quality = resolveGraphicsQuality(mode, { coarsePointer, deviceMemory });
  if (
    mode === 'auto' &&
    Number.isFinite(hardwareConcurrency) &&
    hardwareConcurrency <= 4
  ) quality = 'medium';
  let resolutionScale = 1;
  let lastFrame = null;
  let windowElapsed = 0;
  let samples = [];
  let activeElapsed = 0;
  let cooldown = 0;
  let slowWindows = 0;
  let fastWindows = 0;
  const MIN_SCALE = coarsePointer ? 0.68 : 0.75;
  const result = () => ({
    quality,
    resolutionScale: Number(resolutionScale.toFixed(3)),
    adaptive: resolutionScale < 0.99 ||
      (mode === 'auto' && quality !== 'high'),
  });

  function reset(nextMode = mode) {
    mode = nextMode;
    quality = resolveGraphicsQuality(mode, { coarsePointer, deviceMemory });
    if (mode === 'auto' && Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4)
      quality = 'medium';
    resolutionScale = 1;
    lastFrame = null;
    windowElapsed = 0;
    activeElapsed = 0;
    samples = [];
    cooldown = 0;
    slowWindows = 0;
    fastWindows = 0;
    return result();
  }
  function sample(time, active) {
    if (!Number.isFinite(time) || !active) {
      lastFrame = null;
      windowElapsed = 0;
      samples = [];
      slowWindows = 0;
      fastWindows = 0;
      return null;
    }
    if (lastFrame === null) {
      lastFrame = time;
      return null;
    }
    const delta = time - lastFrame;
    lastFrame = time;
    // Realized frame interval includes CPU/GPU/OS throttling, not clamped
    // simulation delta. Ignore gaps from browser stalls/tab switches.
    if (delta <= 0 || delta > 240) return null;
    activeElapsed += delta;
    windowElapsed += delta;
    samples.push(delta);
    if (windowElapsed < 2200 || samples.length < 28) return null;
    const ordered = samples.slice().sort((a, b) => a - b);
    const p75 = ordered[Math.floor(ordered.length * 0.75)];
    const currentFps = 1000 / Math.max(1, p75);
    const coverage = samples.length / (windowElapsed / 1000);
    samples = [];
    windowElapsed = 0;
    if (activeElapsed < 4500 || coverage < 18) return null;
    cooldown = Math.max(0, cooldown - 2.2);
    if (cooldown > 0) return null;
    const struggling = currentFps < 42;
    const stable = currentFps > 57;
    slowWindows = struggling ? slowWindows + 1 : 0;
    fastWindows = stable ? fastWindows + 1 : 0;
    if (slowWindows >= 2) {
      slowWindows = 0;
      fastWindows = 0;
      if (resolutionScale > MIN_SCALE + 0.015)
        resolutionScale = Math.max(MIN_SCALE, Number((resolutionScale - 0.13).toFixed(2)));
      else if (quality === 'high' &&
        (mode === 'auto' || currentFps < 34)) {
        // Even the minimum resolution could not sustain smooth gameplay.
        // This safety override also applies to manually selected High,
        // while preserving that preference in Settings for later sessions.
        quality = 'medium';
        resolutionScale = 0.9;
      } else return null;
      cooldown = 7;
      return result();
    }
    // Recover deliberately slowly: stability over multiple independent windows
    // prevents visual flicker and rapid quality thrashing as the user turns.
    if (fastWindows >= 5) {
      fastWindows = 0;
      if (resolutionScale < 0.99) {
        resolutionScale = Math.min(1, Number((resolutionScale + 0.08).toFixed(2)));
      } else if (mode === 'auto' && quality === 'medium' &&
        !(Number.isFinite(deviceMemory) && deviceMemory <= 4) &&
        (!coarsePointer || (
          Number.isFinite(deviceMemory) && deviceMemory >= 8 &&
          Number.isFinite(hardwareConcurrency) && hardwareConcurrency >= 8 &&
          activeElapsed >= 30000
        ))) {
        quality = 'high';
      } else return null;
      cooldown = 10;
      return result();
    }
    return null;
  }
  return { sample, reset, current: result };
}
