import { bossMeleeHit } from './boss-combat-ai.js';

// World-space X/Y tactical map. The danger footprint reuses the SAME hit
// predicate as actual boss damage; a green marker must never claim a hit.
const MIN_X = -72;
const MAX_X = 72;
const MIN_Y = -1;
const MAX_Y = 46;
const INSET = 6;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const pointSafe = (intent, x, y, orbit) =>
  [
    [0, 0],
    [2.2, 0],
    [-2.2, 0],
    [0, 2.2],
    [0, -2.2],
  ].every(([dx, dy]) => !bossMeleeHit(intent, { x: x + dx, y: y + dy, orbit }));

function direction(dx, dy) {
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return '•';
  const horizontal = dx > 1 ? '→' : dx < -1 ? '←' : '';
  const vertical = dy > 1 ? '↑' : dy < -1 ? '↓' : '';
  return vertical + horizontal || '•';
}

function findSafePoint(intent, x, y, orbit) {
  if (pointSafe(intent, x, y, orbit)) return { x, y };
  let chosen = null;
  let cost = Infinity;
  // A bounded, deterministic search: candidate movement actually avoids
  // bossMeleeHit(), including Marvin's orbit-sensitive claw swipe.
  for (let radius = 4; radius <= 62; radius += 2) {
    for (let step = 0; step < 32; step++) {
      const angle = (step * Math.PI * 2) / 32;
      const px = clamp(x + Math.cos(angle) * radius, MIN_X, MAX_X);
      const py = clamp(y + Math.sin(angle) * radius, MIN_Y, MAX_Y);
      if (!pointSafe(intent, px, py, orbit)) continue;
      const dx = px - x;
      const dy = py - y;
      const distance = Math.hypot(dx, dy);
      if (distance < cost) {
        chosen = { x: px, y: py };
        cost = distance;
      }
    }
    // Once a nearby safe point exists, farther rings cannot improve it.
    if (chosen) break;
  }
  return chosen;
}

export function bossRadarPlan(intent, { x, y, orbit = 0, originX = 0, originY = 12 }) {
  if (!intent || intent.kind === 'barrage') return null;
  const centerX = clamp(intent.targetX, MIN_X + 40, MAX_X - 40);
  const left = centerX - 40;
  const right = centerX + 40;
  const project = (px, py) => ({
    x: INSET + ((clamp(px, left, right) - left) / (right - left)) * (100 - INSET * 2),
    y: INSET + ((MAX_Y - clamp(py, MIN_Y, MAX_Y)) / (MAX_Y - MIN_Y)) * (100 - INSET * 2),
  });
  const r = intent.dodgeRadius;
  const rect = intent.kind === 'tentacle-sweep' || intent.kind === 'claw-swipe';
  const halfX =
    intent.kind === 'tentacle-sweep'
      ? r * 2.4
      : intent.kind === 'claw-swipe'
        ? r * 1.7
        : intent.kind === 'tentacle-grab'
          ? r / 0.7
          : r;
  const halfY = r;
  const dangerActive = bossMeleeHit(intent, {
    x: intent.targetX,
    y: intent.targetY,
    orbit,
  });
  const threatened = bossMeleeHit(intent, { x, y, orbit });
  const safe = findSafePoint(intent, x, y, orbit);
  const center = project(intent.targetX, intent.targetY);
  const player = project(x, y);
  const origin = project(originX, originY);
  const exit = safe ? project(safe.x, safe.y) : null;
  const safeDirection = safe ? direction(safe.x - x, safe.y - y) : '';
  const originDirection = direction(originX - x, originY - y);
  return {
    mode: 'physical',
    threatened,
    dangerActive,
    kind: intent.kind,
    shape: {
      type: rect ? 'rect' : 'ellipse',
      center,
      rx: (halfX / (right - left)) * (100 - INSET * 2),
      ry: (halfY / (MAX_Y - MIN_Y)) * (100 - INSET * 2),
    },
    origin,
    player,
    exit,
    originDirection,
    safeDirection,
    guide: threatened
      ? safe
        ? 'ZONA SEGURA ' + safeDirection
        : 'ESQUIVE · FORA DA ÁREA'
      : 'SEGURO · MANTENHA',
  };
}

// The radar stays a non-interactive instrument in the top-right HUD.
export function renderBossRadar(document, plan) {
  const radar = document.getElementById('battleRadar');
  const overlay = document.getElementById('radarThreatMap');
  const guide = document.getElementById('radarGuide');
  if (!plan) {
    radar.setAttribute('data-mode', 'orbital');
    overlay.style.display = 'none';
    guide.hidden = true;
    radar.setAttribute('aria-label', 'Radar orbital');
    return;
  }
  radar.setAttribute('data-mode', 'physical');
  radar.setAttribute(
    'aria-label',
    'Ataque de ' +
      plan.kind +
      ' vindo de ' +
      plan.originDirection +
      '. ' +
      (plan.threatened ? 'Nave na área vermelha. ' : 'Nave fora da área vermelha. ') +
      plan.guide,
  );
  overlay.style.display = 'block';
  guide.hidden = false;
  guide.textContent = plan.guide;
  guide.setAttribute('data-danger', plan.threatened ? 'true' : 'false');
  const danger = document.getElementById('radarThreatRect');
  const ellipse = document.getElementById('radarThreatEllipse');
  const shape = plan.shape;
  danger.style.display = ellipse.style.display = 'none';
  if (plan.dangerActive) {
    const node = shape.type === 'rect' ? danger : ellipse;
    node.style.display = 'block';
    if (shape.type === 'rect') {
      node.setAttribute('x', shape.center.x - shape.rx);
      node.setAttribute('y', shape.center.y - shape.ry);
      node.setAttribute('width', shape.rx * 2);
      node.setAttribute('height', shape.ry * 2);
    } else {
      node.setAttribute('cx', shape.center.x);
      node.setAttribute('cy', shape.center.y);
      node.setAttribute('rx', shape.rx);
      node.setAttribute('ry', shape.ry);
    }
  }
  const vector = document.getElementById('radarAttackVector');
  for (const [attr, n] of [
    ['x1', plan.origin.x],
    ['y1', plan.origin.y],
    ['x2', shape.center.x],
    ['y2', shape.center.y],
  ])
    vector.setAttribute(attr, n);
  const markers = [
    ['radarAttackOrigin', plan.origin],
    ['radarSafePoint', plan.exit],
    ['radarShipPoint', plan.player],
  ];
  for (const [id, point] of markers) {
    const node = document.getElementById(id);
    node.hidden = !point;
    if (point) {
      node.setAttribute('cx', point.x);
      node.setAttribute('cy', point.y);
    }
  }
  document
    .getElementById('radarShipPoint')
    .setAttribute('fill', plan.threatened ? '#fff4c9' : '#88ffbc');
}
