const CLEARANCE_X = 6.5;
const CLEARANCE_Y = 4.5;
const APPROACH_HORIZON = 220;
const X_LANES = [-48, -32, -16, 0, 16, 32, 48];
const Y_LANES = [6, 10, 14, 18, 22, 26, 30, 34, 38, 42];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finitePoint = (point) =>
  Array.isArray(point) && point.length >= 3 && point.every(Number.isFinite);

function normalizeSolid(solid) {
  if (solid?.active !== true) return null;
  const center = Array.isArray(solid.center)
    ? solid.center
    : [solid.x, solid.y, solid.z];
  const half = Array.isArray(solid.half)
    ? solid.half
    : [solid.halfX, solid.halfY, solid.halfZ];
  if (![...center, ...half].every(Number.isFinite)) return null;
  return {
    x: center[0],
    y: center[1],
    z: center[2],
    halfX: Math.abs(half[0]),
    halfY: Math.abs(half[1]),
    halfZ: Math.abs(half[2]),
  };
}

function visibleSolids(state) {
  return [
    ...(state.cityPhysicalSolids ?? []),
    ...(state.cityFallingSolids ?? []),
  ].map(normalizeSolid).filter(Boolean);
}

function incomingThreats(state, previous, playerDepth) {
  const threats = [];
  const player = state.player;
  const previousPlayer = previous?.player;
  if (
    previous &&
    Number.isFinite(state.cityImpactCount) &&
    Number.isFinite(previous.cityImpactCount) &&
    state.cityImpactCount > previous.cityImpactCount &&
    previousPlayer
  ) {
    threats.push({
      x: previousPlayer.x,
      y: previousPlayer.y,
      radiusX: 16,
      radiusY: 12,
      reason: 'recent-city-impact',
    });
  }

  const elapsed = state.seconds - (previous?.seconds ?? state.seconds);
  const priorShots = previous?.hostilePositions ?? [];
  if (elapsed > 0 && elapsed <= 1.25 && priorShots.length) {
    for (const shot of state.hostilePositions ?? []) {
      if (!finitePoint(shot)) continue;
      let nearest = null;
      let nearestDistance = Infinity;
      for (const prior of priorShots) {
        if (!finitePoint(prior)) continue;
        const distance =
          (shot[0] - prior[0]) ** 2 +
          (shot[1] - prior[1]) ** 2 +
          (shot[2] - prior[2]) ** 2;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = prior;
        }
      }
      if (!nearest || nearestDistance > 35 ** 2) continue;
      const vx = (shot[0] - nearest[0]) / elapsed;
      const vy = (shot[1] - nearest[1]) / elapsed;
      const vz = (shot[2] - nearest[2]) / elapsed;
      if (vz <= 1.5) continue;
      const timeToPlayer = (playerDepth - shot[2]) / vz;
      if (timeToPlayer <= 0 || timeToPlayer > 2.4) continue;
      const x = shot[0] + vx * timeToPlayer;
      const y = shot[1] + vy * timeToPlayer;
      if (Math.abs(x - player.x) > 28 || Math.abs(y - player.y) > 22) continue;
      threats.push({ x, y, radiusX: 9.5, radiusY: 8.5, reason: 'incoming-projectile' });
    }
  }

  for (const target of state.targets ?? []) {
    if (
      target.charging === true &&
      Number.isFinite(target.x) &&
      Number.isFinite(target.y) &&
      Number.isFinite(target.z) &&
      target.z < playerDepth + 10 &&
      target.z > playerDepth - 100
    ) {
      threats.push({
        x: target.x,
        y: target.y,
        radiusX: 12,
        radiusY: 10,
        reason: 'visible-enemy-windup',
      });
    }
  }
  return threats;
}

function candidateScore(candidate, state, previous, solids, threats, playerDepth) {
  const player = state.player;
  let score =
    Math.abs(candidate.x) * 0.6 +
    Math.abs(candidate.y - 10) * 0.6 +
    (Math.abs(candidate.x - player.x) + Math.abs(candidate.y - player.y)) * 0.25;

  const previousTarget = previous?.pilotTarget;
  if (previousTarget && Number.isFinite(previousTarget.x) && Number.isFinite(previousTarget.y)) {
    score +=
      (Math.abs(candidate.x - previousTarget.x) +
        Math.abs(candidate.y - previousTarget.y)) *
      0.35;
  }

  for (const solid of solids) {
    const front = solid.z + solid.halfZ;
    const back = solid.z - solid.halfZ;
    if (front < playerDepth - APPROACH_HORIZON || back > playerDepth + 12) continue;
    const overlapX = solid.halfX + CLEARANCE_X - Math.abs(candidate.x - solid.x);
    const overlapY = solid.halfY + CLEARANCE_Y - Math.abs(candidate.y - solid.y);
    if (overlapX > 0 && overlapY > 0) score += 1200 + overlapX * overlapY * 4;
  }

  for (const threat of threats) {
    const overlapX = threat.radiusX - Math.abs(candidate.x - threat.x);
    const overlapY = threat.radiusY - Math.abs(candidate.y - threat.y);
    if (overlapX > 0 && overlapY > 0) score += 900 + overlapX * overlapY * 3;
  }
  return score;
}

function selectSafeTarget(state, previous) {
  const player = state.player;
  const bounds = state.flightBounds ?? {};
  const xLimit = Math.max(8, (bounds.horizontal ?? 72) - 8);
  const minY = (bounds.minY ?? -1) + 3;
  const maxY = (bounds.maxY ?? 46) - 3;
  const unique = (values) => [...new Set(values.map((value) => Number(value.toFixed(1))))];
  const xs = unique([player.x, ...X_LANES].map((x) => clamp(x, -xLimit, xLimit)));
  const ys = unique([player.y, ...Y_LANES].map((y) => clamp(y, minY, maxY)));
  const playerDepth = Number.isFinite(state.playerDepth) ? state.playerDepth : 9;
  const solids = visibleSolids(state);
  const threats = incomingThreats(state, previous, playerDepth);
  let selected = { x: clamp(0, -xLimit, xLimit), y: clamp(10, minY, maxY) };
  let best = Infinity;

  for (const x of xs) {
    for (const y of ys) {
      const candidate = { x, y };
      const score = candidateScore(candidate, state, previous, solids, threats, playerDepth);
      if (score < best) {
        best = score;
        selected = candidate;
      }
    }
  }
  return { target: selected, threats, solids };
}

export function campaignFlight(state, previous = null) {
  if (state.state !== 'playing' || state.launchCinematic || state.boss) {
    return { x: 0, y: 0, fire: false, boost: false };
  }

  const phase = state.orbitalLaunch?.phase ?? 'city';
  const { target, threats } = selectSafeTarget(state, previous);
  const x = Math.abs(state.player.x - target.x) > 3.8
    ? Math.sign(target.x - state.player.x)
    : 0;
  const y = Math.abs(state.player.y - target.y) > 3.2
    ? Math.sign(target.y - state.player.y)
    : 0;
  const depth = Number.isFinite(state.playerDepth) ? state.playerDepth : 9;
  const subboss = (state.targets ?? []).some(
    (enemy) =>
      enemy.kind === 'subboss' &&
      Number.isFinite(enemy.z) &&
      enemy.z < depth + 10 &&
      enemy.z > depth - 160,
  );
  const arcana = state.strategy?.arcana ?? 0;
  const squad = state.fiveCats ?? {};
  const special =
    subboss && arcana >= 75 && (squad.plasmaCooldown ?? Infinity) <= 0
      ? 'plasma'
      : subboss && arcana >= 90 && (squad.overdriveCooldown ?? Infinity) <= 0
        ? 'overdrive'
        : null;

  return {
    x,
    y,
    fire: true,
    boost: phase === 'boost',
    target,
    reason: threats.length ? 'evade-visible-threat' : 'maintain-safe-lane',
    bomb: subboss && (state.bombs ?? 0) > 0,
    transform: subboss
      ? state.mecha?.active
        ? null
        : (state.energy ?? 0) >= 15
          ? 'robot'
          : null
      : state.mecha?.active
        ? 'ship'
        : null,
    multiLock: subboss && state.mecha?.active === true && state.mecha.lockEnabled !== true,
    special,
  };
}
