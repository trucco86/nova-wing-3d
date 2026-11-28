import { inspectBossPatterns } from './gameplay-boss-pattern-observer.mjs';

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
