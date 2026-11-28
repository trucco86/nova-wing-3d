const CLEARANCE_X = 6.5;
const CLEARANCE_Y = 4.5;
const CLEARANCE_Z = 3.2;
const APPROACH_HORIZON = 220;
const HAZARD_HORIZON_SECONDS = 3.2;
const PLAYER_SPEED_X = 24;
const PLAYER_SPEED_Y = 20;
const X_LANES = [-48, -32, -16, 0, 16, 32, 48];
const Y_LANES = [6, 10, 14, 18, 22, 26, 30, 34, 38, 42];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finitePoint = (point) =>
  Array.isArray(point) && point.length >= 3 && point.every(Number.isFinite);

function normalizeSolid(solid) {
  if (solid?.active !== true || solid.solid === false) return null;
  const center = Array.isArray(solid.center) ? solid.center : [solid.x, solid.y, solid.z];
  const half = Array.isArray(solid.half) ? solid.half : [solid.halfX, solid.halfY, solid.halfZ];
  const previous = Array.isArray(solid.previous)
    ? solid.previous
    : [solid.previousX, solid.previousY, solid.previousZ];
  if (![...center, ...half].every(Number.isFinite)) return null;
  const hasPrevious = previous.every(Number.isFinite);
  return {
    kind: solid.kind ?? 'city-solid',
    x: center[0],
    y: center[1],
    z: center[2],
    halfX: Math.abs(half[0]),
    halfY: Math.abs(half[1]),
    halfZ: Math.abs(half[2]),
    previousX: hasPrevious ? previous[0] : center[0],
    previousY: hasPrevious ? previous[1] : center[1],
    previousZ: hasPrevious ? previous[2] : center[2],
    hasPrevious,
  };
}

function visibleSolids(state, previous) {
  const course = state.asteroidInterior?.course;
  if (state.sector === 3 && course?.obstacles?.length) {
    const previousOffset = previous?.asteroidInterior?.course?.offset;
    return course.obstacles
      .map((rock) =>
        normalizeSolid({
          kind: 'asteroid-' + rock.kind,
          active: true,
          solid: true,
          center: [rock.x, rock.y, rock.z],
          half: [rock.hx, rock.hy, rock.hz],
          previous: [
            rock.x,
            rock.y,
            rock.baseZ + (Number.isFinite(previousOffset) ? previousOffset : course.offset),
          ],
        }),
      )
      .filter(Boolean);
  }
  const source = state.cityHazardSolids?.length
    ? state.cityHazardSolids
    : [...(state.cityPhysicalSolids ?? []), ...(state.cityFallingSolids ?? [])];
  return source.map(normalizeSolid).filter(Boolean);
}

function pilotClearance(state) {
  const hull = state.sector === 3 ? state.asteroidHull?.current : null;
  if (hull && Number.isFinite(hull.x) && Number.isFinite(hull.y) && Number.isFinite(hull.z)) {
    return { x: hull.x, y: hull.y, z: hull.z };
  }
  return { x: CLEARANCE_X, y: CLEARANCE_Y, z: CLEARANCE_Z };
}

function preferredLane(state) {
  const phase = state.orbitalLaunch?.phase ?? 'city';
  const asteroidPhase = state.asteroidInterior?.phase;
  const seconds = Number.isFinite(state.seconds) ? state.seconds : 0;
  if (state.sector === 3 && ['approach', 'transition', 'interior'].includes(asteroidPhase)) {
    return { x: 0, y: 10 };
  }
  if (state.sector === 3 && asteroidPhase === 'escape') {
    return { x: Math.sin(seconds * 0.12) * 12, y: 10 + Math.sin(seconds * 0.18) * 8 };
  }
  if (phase === 'city' || phase === 'boost') return { x: 0, y: 10 };
  const orbital = phase === 'orbit';
  return {
    x: Math.sin(seconds * (orbital ? 0.22 : 0.18)) * (orbital ? 22 : 14),
    y: 10 + Math.sin(seconds * (orbital ? 0.42 : 0.32)) * (orbital ? 7 : 4),
  };
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
      timeToImpact: 0.35,
      reason: 'recent-city-impact',
    });
  }

  const elapsed = state.seconds - (previous?.seconds ?? state.seconds);
  const priorShots = previous?.hostilePositions ?? [];
  const matchedPrior = new Set();
  for (const shot of state.hostilePositions ?? []) {
    if (!finitePoint(shot)) continue;
    let nearest = null;
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    if (elapsed > 0 && elapsed <= 1.25) {
      for (let i = 0; i < priorShots.length; i++) {
        if (matchedPrior.has(i)) continue;
        const prior = priorShots[i];
        if (!finitePoint(prior)) continue;
        const distance =
          (shot[0] - prior[0]) ** 2 + (shot[1] - prior[1]) ** 2 + (shot[2] - prior[2]) ** 2;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = prior;
          nearestIndex = i;
        }
      }
    }

    let predicted = null;
    if (nearest && nearestIndex >= 0 && nearestDistance <= 35 ** 2) {
      matchedPrior.add(nearestIndex);
      const vx = (shot[0] - nearest[0]) / elapsed;
      const vy = (shot[1] - nearest[1]) / elapsed;
      const vz = (shot[2] - nearest[2]) / elapsed;
      if (vz > 1.5) {
        const timeToImpact = (playerDepth - shot[2]) / vz;
        if (timeToImpact > 0 && timeToImpact <= 2.4) {
          const x = shot[0] + vx * timeToImpact;
          const y = shot[1] + vy * timeToImpact;
          if (Math.abs(x - player.x) <= 38 && Math.abs(y - player.y) <= 30) {
            predicted = { x, y, timeToImpact };
          }
        }
      }
    }

    const nearby =
      shot[2] < playerDepth + 8 &&
      shot[2] > playerDepth - 55 &&
      Math.hypot(shot[0] - player.x, shot[1] - player.y) < 40;
    if (predicted) {
      threats.push({
        x: predicted.x,
        y: predicted.y,
        radiusX: 12.5,
        radiusY: 10.5,
        timeToImpact: predicted.timeToImpact,
        reason: 'incoming-projectile',
      });
    } else if (nearby) {
      const depth = playerDepth - shot[2];
      threats.push({
        x: shot[0],
        y: shot[1],
        radiusX: 13.5,
        radiusY: 11.5,
        timeToImpact: depth > 0 ? clamp(depth / 48, 0.15, 1.2) : 0.2,
        reason: 'nearby-hostile-projectile',
      });
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
        timeToImpact: 0.9,
        reason: 'visible-enemy-windup',
      });
    }
  }
  return threats;
}

function movingHazardImpact(solid, state, previous, playerDepth, clearanceZ = CLEARANCE_Z) {
  const front = solid.z + solid.halfZ;
  const back = solid.z - solid.halfZ;
  if (front < playerDepth - APPROACH_HORIZON || back > playerDepth + 12) return null;

  const elapsed = state.seconds - (previous?.seconds ?? state.seconds);
  if (!solid.hasPrevious || elapsed <= 0 || elapsed > 1.25) {
    return { time: null, x: solid.x, y: solid.y };
  }

  const vx = (solid.x - solid.previousX) / elapsed;
  const vy = (solid.y - solid.previousY) / elapsed;
  const vz = (solid.z - solid.previousZ) / elapsed;
  if (vz <= 1.5) {
    if (front < playerDepth - 36 || back > playerDepth + clearanceZ) return null;
    return { time: 0.35, x: solid.x, y: solid.y };
  }

  const time =
    front < playerDepth - clearanceZ
      ? (playerDepth - clearanceZ - front) / vz
      : back <= playerDepth + clearanceZ
        ? 0.35
        : Infinity;
  if (!Number.isFinite(time) || time > HAZARD_HORIZON_SECONDS || time < 0) return null;
  return {
    time: clamp(time, 0.25, HAZARD_HORIZON_SECONDS),
    x: solid.x + vx * time,
    y: solid.y + vy * time,
  };
}

function candidateScore(
  candidate,
  state,
  previous,
  solids,
  threats,
  playerDepth,
  preferred,
  clearance,
) {
  const player = state.player;
  const hardAsteroidCourse =
    state.sector === 3 && ['transition', 'interior'].includes(state.asteroidInterior?.phase);
  let score =
    Math.abs(candidate.x - preferred.x) * 0.7 +
    Math.abs(candidate.y - preferred.y) * 0.7 +
    (Math.abs(candidate.x - player.x) + Math.abs(candidate.y - player.y)) * 0.22;

  const previousTarget = previous?.pilotTarget;
  if (previousTarget && Number.isFinite(previousTarget.x) && Number.isFinite(previousTarget.y)) {
    score +=
      (Math.abs(candidate.x - previousTarget.x) + Math.abs(candidate.y - previousTarget.y)) * 0.75;
  }

  for (const solid of solids) {
    const impact = movingHazardImpact(solid, state, previous, playerDepth, clearance.z);
    if (!impact) continue;
    if (impact.time === null) {
      const overlapX = solid.halfX + clearance.x - Math.abs(candidate.x - impact.x);
      const overlapY = solid.halfY + clearance.y - Math.abs(candidate.y - impact.y);
      if (overlapX > 0 && overlapY > 0)
        score += hardAsteroidCourse ? 100000 + overlapX * overlapY * 100 : 1200 + overlapX * overlapY * 4;
      continue;
    }

    // Score where the ship can physically reach by the obstacle's arrival,
    // not where the target lane would be after an impossible instant move.
    const travelX = PLAYER_SPEED_X * impact.time;
    const travelY = PLAYER_SPEED_Y * impact.time;
    const playerAtImpactX = player.x + clamp(candidate.x - player.x, -travelX, travelX);
    const playerAtImpactY = player.y + clamp(candidate.y - player.y, -travelY, travelY);
    const overlapX = solid.halfX + clearance.x + 2.5 - Math.abs(playerAtImpactX - impact.x);
    const overlapY = solid.halfY + clearance.y + 2 - Math.abs(playerAtImpactY - impact.y);
    if (overlapX > 0 && overlapY > 0)
      score += hardAsteroidCourse ? 100000 + overlapX * overlapY * 100 : 1800 + overlapX * overlapY * 5;

    // When impact is imminent, the safe lane may be unreachable before contact.
    // Still commit toward a lane that clears the obstacle after the immediate hit.
    const eventualOverlapX = solid.halfX + clearance.x - Math.abs(candidate.x - impact.x);
    const eventualOverlapY = solid.halfY + clearance.y - Math.abs(candidate.y - impact.y);
    if (eventualOverlapX > 0 && eventualOverlapY > 0) {
      score += hardAsteroidCourse
        ? 50000 + eventualOverlapX * eventualOverlapY * 50
        : 650 + eventualOverlapX * eventualOverlapY * 2;
    }
  }

  for (const threat of threats) {
    const timeToImpact = clamp(threat.timeToImpact ?? 0.8, 0.15, 2.4);
    const playerAtImpactX =
      player.x +
      clamp(candidate.x - player.x, -PLAYER_SPEED_X * timeToImpact, PLAYER_SPEED_X * timeToImpact);
    const playerAtImpactY =
      player.y +
      clamp(candidate.y - player.y, -PLAYER_SPEED_Y * timeToImpact, PLAYER_SPEED_Y * timeToImpact);
    const overlapX = threat.radiusX + 2 - Math.abs(playerAtImpactX - threat.x);
    const overlapY = threat.radiusY + 2 - Math.abs(playerAtImpactY - threat.y);
    if (overlapX > 0 && overlapY > 0) score += 1500 + overlapX * overlapY * 4;

    const eventualOverlapX = threat.radiusX - Math.abs(candidate.x - threat.x);
    const eventualOverlapY = threat.radiusY - Math.abs(candidate.y - threat.y);
    if (eventualOverlapX > 0 && eventualOverlapY > 0) {
      score += 450 + eventualOverlapX * eventualOverlapY * 2;
    }
  }
  return score;
}

function selectSafeTarget(state, previous) {
  const player = state.player;
  const clearance = pilotClearance(state);
  const asteroidPhase = state.asteroidInterior?.phase;
  const confinedToCavern =
    state.sector === 3 && ['approach', 'transition', 'interior', 'escape'].includes(asteroidPhase);
  const bounds = state.flightBounds ?? {};
  const xLimit = Math.max(8, (bounds.horizontal ?? 72) - 8);
  const minY = (bounds.minY ?? -1) + 3;
  const maxY = (bounds.maxY ?? 46) - 3;
  const unique = (values) => [...new Set(values.map((value) => Number(value.toFixed(1))))];
  const preferred = preferredLane(state);
  const xs = unique([player.x, preferred.x, ...X_LANES].map((x) => clamp(x, -xLimit, xLimit)));
  const ys = unique([player.y, preferred.y, ...Y_LANES].map((y) => clamp(y, minY, maxY)));
  const playerDepth = Number.isFinite(state.playerDepth) ? state.playerDepth : 9;
  const solids = visibleSolids(state, previous);
  const threats = incomingThreats(state, previous, playerDepth);
  let selected = { x: clamp(0, -xLimit, xLimit), y: clamp(10, minY, maxY) };
  let best = Infinity;

  for (const x of xs) {
    for (const y of ys) {
      if (confinedToCavern && Math.hypot(x, y - 10) > 24) continue;
      const candidate = { x, y };
      const score = candidateScore(
        candidate,
        state,
        previous,
        solids,
        threats,
        playerDepth,
        preferred,
        clearance,
      );
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
  const { target, threats, solids } = selectSafeTarget(state, previous);
  const x = Math.abs(state.player.x - target.x) > 3.8 ? Math.sign(target.x - state.player.x) : 0;
  const y = Math.abs(state.player.y - target.y) > 3.2 ? Math.sign(target.y - state.player.y) : 0;
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
    reason: threats.length
      ? 'evade-visible-threat'
      : solids.length
        ? state.sector === 3
          ? 'evade-asteroid-course'
          : 'evade-city-hazard'
        : phase === 'orbit'
          ? 'maintain-evasive-orbit'
          : 'maintain-safe-lane',
    repair:
      state.repairReady === true &&
      Number.isFinite(state.shield) &&
      state.shield < (state.initialShield ?? 202) * 0.65,
    bomb: subboss && (state.bombs ?? 0) > 0,
    transform:
      subboss ||
      (state.sector === 3 && ['transition', 'interior'].includes(state.asteroidInterior?.phase))
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

export function campaignShopPlan(state) {
  const completedSector = Number.isInteger(state.sector)
    ? state.sector
    : Number.isInteger(state.sectorIndex)
      ? state.sectorIndex + 1
      : 1;
  const nextSector = clamp(completedSector + 1, 2, 10);
  const progress = Math.max(0, nextSector - 2);
  const targets = {
    weapon: Math.min(6, 3 + Math.floor(progress / 2)),
    armor: Math.min(4, 1 + Math.floor(progress / 2)),
    pods: Math.min(3, 1 + Math.floor(progress / 2)),
    bombs: Math.min(8, 5 + Math.floor(progress / 2)),
    volley: Math.min(2, Math.floor(progress / 3)),
    rapid: Math.min(2, Math.floor(progress / 4)),
    scatterOwned: nextSector >= 5,
  };
  const priorities = [];
  if (
    Number.isFinite(state.shield) &&
    Number.isFinite(state.maxShield) &&
    state.shield < state.maxShield
  ) {
    priorities.push('repair');
  }
  if ((state.weapon ?? 1) < targets.weapon) priorities.push('weapon');
  if ((state.armor ?? 0) < targets.armor) priorities.push('armor');
  if ((state.pods ?? 0) < targets.pods) priorities.push('pods');
  if ((state.bombs ?? 0) < targets.bombs) {
    priorities.push((state.bombs ?? 0) <= 5 ? 'bombPack' : 'bomb');
  }
  if ((state.volley ?? 0) < targets.volley) priorities.push('volley');
  if ((state.rapid ?? 0) < targets.rapid) priorities.push('rapid');
  if (targets.scatterOwned && state.scatterOwned !== true) priorities.push('scatter');
  return { completedSector, nextSector, targets, priorities };
}
