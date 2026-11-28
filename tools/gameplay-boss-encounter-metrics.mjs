import { inspectBossPatterns } from './gameplay-boss-pattern-observer.mjs';

function normalizedPlayerPosition(sample) {
  const player = sample.player;
  const bounds = sample.flightBounds;
  if (
    !player ||
    !bounds ||
    !Number.isFinite(player.x) ||
    !Number.isFinite(player.y) ||
    !Number.isFinite(bounds.horizontal) ||
    bounds.horizontal <= 0 ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxY) ||
    bounds.maxY <= bounds.minY
  ) {
    return null;
  }
  return {
    x: Number(
      Math.min(1, Math.max(0, (player.x + bounds.horizontal) / (2 * bounds.horizontal))).toFixed(4),
    ),
    y: Number(
      Math.min(1, Math.max(0, (player.y - bounds.minY) / (bounds.maxY - bounds.minY))).toFixed(4),
    ),
  };
}

// One record per observed physical attack cycle. Only the player's own
// normalized position and public radar instructions are retained.
function summarizeReactionTime(samples) {
  const firstDanger = samples.find((sample) => sample.danger === true);
  if (!firstDanger) return null;
  const firstDodge = samples.find(
    (sample) => sample.age >= firstDanger.age && sample.decision?.action === 'dodge',
  );
  return firstDodge ? Number((firstDodge.age - firstDanger.age).toFixed(3)) : null;
}

export function summarizeAttackWindows(samples) {
  const windows = [];
  let current = null;
  let lastAge = -Infinity;
  for (const sample of samples) {
    if (!Number.isFinite(sample.age) || sample.age <= lastAge) {
      return {
        status: 'BLOCKED',
        reason: 'Invalid or unordered encounter clock',
        windows: [],
        releaseAuthorized: false,
      };
    }
    lastAge = sample.age;
    const active =
      sample.mode === 'physical' &&
      ['windup', 'attack'].includes(sample.phase) &&
      typeof sample.kind === 'string' &&
      Number.isInteger(sample.cycle);
    if (!active) {
      if (current) current.after = sample;
      current = null;
      continue;
    }
    if (!current || current.cycle !== sample.cycle || current.kind !== sample.kind) {
      if (current) current.after = sample;
      current = {
        cycle: sample.cycle,
        kind: sample.kind,
        samples: [],
        after: null,
      };
      windows.push(current);
    }
    current.samples.push(sample);
  }

  const details = windows.map((window) => {
    const first = window.samples[0];
    const last = window.samples.at(-1);
    const endSample = window.after;
    const metricEnd = endSample ?? last;
    const phases = [...new Set(window.samples.map((sample) => sample.phase))];
    const positions = window.samples.map(normalizedPlayerPosition).filter(Boolean);
    const directions = [
      ...new Set(
        window.samples
          .map((sample) =>
            sample.guide?.startsWith('ZONA SEGURA ')
              ? sample.guide.slice('ZONA SEGURA '.length).trim()
              : null,
          )
          .filter(Boolean),
      ),
    ];
    const actions = {};
    const inputs = new Set();
    const fireInputs = new Set();
    const controlSurfaces = new Set();
    let dodgeDurationSeconds = 0;
    for (let index = 0; index < window.samples.length; index++) {
      const sample = window.samples[index];
      const action = sample.decision?.action ?? 'unspecified';
      actions[action] = (actions[action] ?? 0) + 1;
      for (const input of sample.input ?? []) inputs.add(input);
      if (sample.fireInput) fireInputs.add(sample.fireInput);
      if (sample.controlSurface) controlSurfaces.add(sample.controlSurface);
      const next = window.samples[index + 1];
      if (action === 'dodge' && next) {
        dodgeDurationSeconds += Math.max(0, next.age - sample.age);
      }
    }
    return {
      cycle: window.cycle,
      kind: window.kind,
      startAge: first.age,
      endAge: last.age,
      durationSeconds: Number((last.age - first.age).toFixed(3)),
      complete: phases.includes('windup') && phases.includes('attack'),
      boundaryObserved: Boolean(endSample),
      censored: !endSample,
      phases,
      radarDirections: directions,
      dangerSamples: window.samples.filter((sample) => sample.danger === true).length,
      reactionTimeSeconds: summarizeReactionTime(window.samples),
      actions,
      inputKeys: [...inputs].sort(),
      fireInputs: [...fireInputs].sort(),
      controlSurfaces: [...controlSurfaces].sort(),
      dodgeDurationSeconds: Number(dodgeDurationSeconds.toFixed(3)),
      playerPositionStart: positions[0] ?? null,
      playerPositionEnd: normalizedPlayerPosition(metricEnd) ?? positions.at(-1) ?? null,
      playerPath: window.samples
        .map((sample) => ({
          age: sample.age,
          phase: sample.phase,
          action: sample.decision?.action ?? 'unspecified',
          input: sample.input ?? [],
          fireInput: sample.fireInput ?? null,
          position: normalizedPlayerPosition(sample),
        }))
        .filter((sample) => sample.position !== null),
      shieldStart: first.shield ?? null,
      shieldEnd: metricEnd.shield ?? null,
      shieldDelta:
        endSample && Number.isFinite(first.shield) && Number.isFinite(endSample.shield)
          ? Number((endSample.shield - first.shield).toFixed(3))
          : null,
      livesStart: first.lives ?? null,
      livesEnd: metricEnd.lives ?? null,
      livesLost:
        endSample && Number.isFinite(first.lives) && Number.isFinite(endSample.lives)
          ? first.lives - endSample.lives
          : null,
      samples: window.samples.length,
      positionCoverage: positions.length / window.samples.length,
    };
  });
  const completeWindows = details.filter((window) => window.complete).length;
  return {
    status: completeWindows ? 'OBSERVED' : 'INSUFFICIENT_EXPOSURE',
    windows: details,
    completeWindows,
    positionCoverage:
      details.length === 0
        ? 0
        : details.reduce((total, window) => total + window.positionCoverage, 0) / details.length,
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}

function summarizeDamageEvents(samples) {
  const unique = new Map();
  for (const sample of samples) {
    for (const event of sample.damageEvents ?? []) {
      if (Number.isInteger(event.id)) unique.set(event.id, event);
    }
  }
  const events = [...unique.values()].sort((a, b) => a.id - b.id);
  const bySource = {};
  for (const event of events) {
    const source = event.type ?? 'unknown';
    const current = bySource[source] ?? { hits: 0, damage: 0 };
    current.hits++;
    current.damage = Number((current.damage + (Number(event.damage) || 0)).toFixed(3));
    bySource[source] = current;
  }
  const bossProjectiles = events.filter((event) => event.type === 'boss-projectile');
  return {
    events,
    bySource,
    bossProjectileHits: bossProjectiles.length,
    bossProjectileDamage: Number(
      bossProjectiles.reduce((total, event) => total + (Number(event.damage) || 0), 0).toFixed(3),
    ),
    bossMeleeHits: events.filter((event) => event.type === 'boss-melee').length,
  };
}

export function summarizeEncounter(samples) {
  const valid = samples.filter(
    (sample) => Number.isFinite(sample.age) && Number.isFinite(sample.shield),
  );
  const active = valid.filter(
    (sample) => sample.mode === 'physical' && ['windup', 'attack'].includes(sample.phase),
  );
  const attacks = new Set(active.map((sample) => sample.kind).filter(Boolean));
  const threatened = active.filter((sample) => sample.danger === true);
  const guided = threatened.filter((sample) => sample.guide?.startsWith('ZONA SEGURA '));
  const windows = new Set(active.map((sample) => sample.cycle));
  const first = valid[0];
  const last = valid.at(-1);
  const damage = summarizeDamageEvents(samples);
  return {
    validSamples: valid.length,
    observedSeconds: first && last ? last.age - first.age : 0,
    shieldStart: first?.shield ?? null,
    shieldEnd: last?.shield ?? null,
    shieldLoss: first && last ? first.shield - last.shield : null,
    distinctAttacks: [...attacks].sort(),
    attackWindows: windows.size,
    threatenedSamples: threatened.length,
    guidedSamples: guided.length,
    inputSamples: valid.filter((sample) => sample.input?.length).length,
    patterns: inspectBossPatterns(samples),
    attackWindowTelemetry: summarizeAttackWindows(samples),
    damageEvents: damage.events,
    damageBySource: damage.bySource,
    bossProjectileHits: damage.bossProjectileHits,
    bossProjectileDamage: damage.bossProjectileDamage,
    bossMeleeHits: damage.bossMeleeHits,
    humanApproval: 'PENDING',
  };
}

export function compareEncounters(passive, reactive) {
  const comparable =
    passive.validSamples > 1 &&
    reactive.validSamples > 1 &&
    Math.abs(passive.observedSeconds - reactive.observedSeconds) <= 0.3 &&
    passive.shieldStart === reactive.shieldStart &&
    passive.attackWindows >= 1 &&
    reactive.attackWindows >= 1 &&
    reactive.guidedSamples > 0 &&
    reactive.inputSamples > 0;
  return {
    status: comparable ? 'REVIEW_REQUIRED' : 'INSUFFICIENT_EXPOSURE',
    shieldLossDifference: comparable ? passive.shieldLoss - reactive.shieldLoss : null,
    passive,
    reactive,
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}
