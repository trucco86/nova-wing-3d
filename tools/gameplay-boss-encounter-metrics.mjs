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
      current = null;
      continue;
    }
    if (!current || current.cycle !== sample.cycle || current.kind !== sample.kind) {
      current = {
        cycle: sample.cycle,
        kind: sample.kind,
        samples: [],
      };
      windows.push(current);
    }
    current.samples.push(sample);
  }

  const details = windows.map((window) => {
    const first = window.samples[0];
    const last = window.samples.at(-1);
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
      phases,
      radarDirections: directions,
      dangerSamples: window.samples.filter((sample) => sample.danger === true).length,
      actions,
      inputKeys: [...inputs].sort(),
      fireInputs: [...fireInputs].sort(),
      controlSurfaces: [...controlSurfaces].sort(),
      dodgeDurationSeconds: Number(dodgeDurationSeconds.toFixed(3)),
      playerPositionStart: positions[0] ?? null,
      playerPositionEnd: positions.at(-1) ?? null,
      playerPath: window.samples
        .map((sample) => ({
          age: sample.age,
          phase: sample.phase,
          action: sample.decision?.action ?? 'unspecified',
          position: normalizedPlayerPosition(sample),
        }))
        .filter((sample) => sample.position !== null),
      shieldStart: first.shield ?? null,
      shieldEnd: last.shield ?? null,
      shieldDelta: Number.isFinite(first.shield) && Number.isFinite(last.shield)
        ? Number((last.shield - first.shield).toFixed(3))
        : null,
      livesStart: first.lives ?? null,
      livesEnd: last.lives ?? null,
      livesLost: Number.isFinite(first.lives) && Number.isFinite(last.lives)
        ? first.lives - last.lives
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
