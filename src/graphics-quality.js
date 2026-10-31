/** Browser-only render budgets; never change gameplay physics. */
export const GRAPHICS_OPTIONS = Object.freeze(['auto', 'medium', 'high']);
export function resolveGraphicsQuality(mode, { coarsePointer = false, deviceMemory = null } = {}) {
  if (mode === 'medium' || mode === 'high') return mode;
  return coarsePointer || (Number.isFinite(deviceMemory) && deviceMemory <= 4) ? 'medium' : 'high';
}
export function graphicsPixelRatioLimit(quality, { coarsePointer = false } = {}) {
  if (quality === 'high') return coarsePointer ? 1.4 : 1.7;
  return coarsePointer ? 1.05 : 1.2;
}
