/** Browser-only render budgets; never change gameplay physics. */
export const GRAPHICS_OPTIONS = Object.freeze(['auto', 'medium', 'high']);
// Real screen pixels rendered per frame, NOT CSS or physical screen size.
// A 1920x1080 desktop at DPR 1.7 otherwise draws ~6m pixels plus 4x MSAA
// and three bloom passes. This cap preserves premium geometry, shaders and
// effects while avoiding redundant supersampling on large viewports.
export const HIGH_RENDER_PIXEL_BUDGET = Object.freeze({
  coarse: 900_000,
  desktop: 3_700_000,
});
export function resolveGraphicsQuality(mode, { coarsePointer = false, deviceMemory = null } = {}) {
  if (mode === 'medium' || mode === 'high') return mode;
  return coarsePointer || (Number.isFinite(deviceMemory) && deviceMemory <= 4) ? 'medium' : 'high';
}
export function graphicsPixelRatioLimit(quality, { coarsePointer = false } = {}) {
  // A high-DPI mobile panel can cost 2–3x the pixels of a laptop even at an
  // identical CSS size. Start conservatively; runtime adaptation may go lower.
  // Improved native MSAA coverage for illuminated thin geometry. The
  // adaptive controller still lowers render scale under sustained pressure.
  if (quality === 'high') return coarsePointer ? 1.35 : 1.7;
  return coarsePointer ? 1.1 : 1.25;
}

/**
 * Pure render-budget diff. Changing internal DPR must not reconfigure dozens
 * of high-detail city tiles: only a real geometry quality transition does.
 * Repeated identical settings also avoid synchronous GPU target reallocations.
 */
export function graphicsBudgetTransition(
  previous,
  budget,
  { coarsePointer = false, devicePixelRatio = 1, viewportWidth = null, viewportHeight = null } = {},
) {
  // Apply the physical-pixel budget BEFORE runtime adaptive scaling so a
  // detected slowdown always reduces work, even when the cap is active.
  const validViewport =
    Number.isFinite(viewportWidth) &&
    Number.isFinite(viewportHeight) &&
    viewportWidth > 0 &&
    viewportHeight > 0;
  const maxPixelRatio =
    budget.quality === 'high' && validViewport
      ? Math.sqrt(
          (coarsePointer
            ? HIGH_RENDER_PIXEL_BUDGET.coarse
            : HIGH_RENDER_PIXEL_BUDGET.desktop) /
            (viewportWidth * viewportHeight),
        )
      : Infinity;
  const pixelLimit =
    Math.min(graphicsPixelRatioLimit(budget.quality, { coarsePointer }), maxPixelRatio) *
    budget.resolutionScale;
  const pixelRatio = Math.min(
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1,
    pixelLimit,
  );
  const qualityChanged = !previous || previous.quality !== budget.quality;
  const pixelRatioChanged = !previous || Math.abs(previous.pixelRatio - pixelRatio) >= 0.01;
  return {
    qualityChanged,
    pixelRatioChanged,
    pixelLimit,
    pixelRatio,
    next: { quality: budget.quality, pixelRatio },
  };
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
  if (mode === 'auto' && Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4)
    quality = 'medium';
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
    adaptive: resolutionScale < 0.99 || (mode === 'auto' && quality !== 'high'),
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
    const p95 = ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1)];
    const severeStalls = ordered.filter((ms) => ms >= 50).length;
    const stutterRatio = severeStalls / ordered.length;
    const coverage = samples.length / (windowElapsed / 1000);
    samples = [];
    windowElapsed = 0;
    if (activeElapsed < 4500 || coverage < 8) return null;
    cooldown = Math.max(0, cooldown - 2.2);
    if (cooldown > 0) return null;
    // A smooth p75 can hide repeated 50-100ms frames during city/space
    // transitions. React only to *sustained* jank across two windows, never
    // downscale due to one slow object spawn or background scheduler noise.
    const repeatedStutter = p95 >= 48 && stutterRatio >= 0.065;
    const struggling = currentFps < 42 || repeatedStutter;
    const stable = currentFps > 57 && p95 < 28 && stutterRatio < 0.01;
    slowWindows = struggling ? slowWindows + 1 : 0;
    fastWindows = stable ? fastWindows + 1 : 0;
    if (slowWindows >= 2) {
      slowWindows = 0;
      fastWindows = 0;
      if (resolutionScale > MIN_SCALE + 0.015)
        resolutionScale = Math.max(MIN_SCALE, Number((resolutionScale - 0.13).toFixed(2)));
      else if (quality === 'high' && mode === 'auto') {
        // AUTO may switch geometry detail as a last resort; explicitly
        // selected HIGH never silently discards premium ships/buildings.
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
      } else if (
        mode === 'auto' &&
        quality === 'medium' &&
        !(Number.isFinite(deviceMemory) && deviceMemory <= 4) &&
        (!coarsePointer ||
          (Number.isFinite(deviceMemory) &&
            deviceMemory >= 8 &&
            Number.isFinite(hardwareConcurrency) &&
            hardwareConcurrency >= 8 &&
            activeElapsed >= 30000))
      ) {
        quality = 'high';
      } else return null;
      cooldown = 10;
      return result();
    }
    return null;
  }
  return { sample, reset, current: result };
}
