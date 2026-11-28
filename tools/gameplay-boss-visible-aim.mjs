// Use screen positions of the actual player reticle and visible weakpoint cues.
// The reticle and marker may project at different depths: alignment is a
// heuristic, not proof of a hit or a substitute for projectile collision.
const valid = (p) => p?.visible === true && Number.isFinite(p.x) && Number.isFinite(p.y);

export function visibleAim({ reticle, cues, width, height }, { deadzone = 0.035 } = {}) {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return { status: 'unavailable', x: 0, y: 0 };
  }
  if (!valid(reticle) || !Array.isArray(cues)) return { status: 'unavailable', x: 0, y: 0 };
  const candidates = cues
    .filter((cue) => valid(cue) && cue.state === 'open' && typeof cue.id === 'string')
    .map((cue) => ({
      id: cue.id,
      dx: (cue.x - reticle.x) / width,
      dy: (cue.y - reticle.y) / height,
    }))
    .sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy) || a.id.localeCompare(b.id));
  const target = candidates[0];
  if (!target) return { status: 'no-visible-open-target', x: 0, y: 0 };
  const x = Math.abs(target.dx) > deadzone ? Math.sign(target.dx) : 0;
  const y = Math.abs(target.dy) > deadzone ? -Math.sign(target.dy) : 0;
  return { ...target, status: x || y ? 'adjust' : 'aligned', x, y };
}

export function applyVisibleAim(decision, aim) {
  // Danger, approach and special activation take precedence over aiming.
  if (!decision.fire || aim.status !== 'adjust') return decision;
  return { ...decision, x: aim.x, y: aim.y, fire: false, action: 'aim-weakpoint' };
}
