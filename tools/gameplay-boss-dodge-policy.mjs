// A synthetic player consumes the same visible HUD guidance as a human.
// This module never accesses the damage predicate or hidden boss coordinates.
const neutral = (reason) => ({ x: 0, y: 0, reason });

export function dodgeDecision({ mode, danger, guide, phase }) {
  if (mode !== 'physical' || !['windup', 'attack'].includes(phase)) {
    return neutral('no-active-physical-warning');
  }
  if (danger === false) return neutral('already-safe');
  if (danger !== true || typeof guide !== 'string') return neutral('missing-guidance');
  if (!guide.startsWith('ZONA SEGURA ')) return neutral('no-specific-route');
  const arrows = guide.slice('ZONA SEGURA '.length).trim();
  if (!/^(?:[↑↓][←→]?|[←→])$/.test(arrows)) return neutral('invalid-direction');
  return {
    x: arrows.includes('→') ? 1 : arrows.includes('←') ? -1 : 0,
    y: arrows.includes('↑') ? 1 : arrows.includes('↓') ? -1 : 0,
    reason: 'follow-visible-radar',
  };
}

export function dodgeKeys(decision) {
  const keys = [];
  if (decision.x > 0) keys.push('KeyD');
  if (decision.x < 0) keys.push('KeyA');
  if (decision.y > 0) keys.push('KeyW');
  if (decision.y < 0) keys.push('KeyS');
  return keys;
}

export function dodgeTouchOffset(decision, radius) {
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('Invalid joystick radius');
  const length = Math.hypot(decision.x, decision.y);
  if (!length) return { x: 0, y: 0 };
  return {
    x: (decision.x / length) * radius,
    y: (-decision.y / length) * radius,
  };
}
