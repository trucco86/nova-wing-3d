// Count observed attack windows, not individual frames of the same attack.
// The detector is advisory: an incomplete fight cannot prove repetition.
export function inspectBossPatterns(samples, { minWindows = 4, repeatLimit = 3 } = {}) {
  if (!Number.isInteger(minWindows) || minWindows < 2) throw new Error('Invalid window minimum');
  if (!Number.isInteger(repeatLimit) || repeatLimit < 2) throw new Error('Invalid repeat limit');

  const windows = [];
  let current = null;
  let lastAge = -Infinity;
  for (const sample of samples) {
    if (!Number.isFinite(sample.age) || sample.age <= lastAge) {
      return {
        status: 'BLOCKED',
        reason: 'Invalid or unordered encounter clock',
        windows,
        findings: [],
        releaseAuthorized: false,
      };
    }
    lastAge = sample.age;
    if (
      sample.mode !== 'physical' ||
      !['windup', 'attack'].includes(sample.phase) ||
      typeof sample.kind !== 'string' ||
      !Number.isInteger(sample.cycle)
    ) {
      current = null;
      continue;
    }
    if (!current || current.cycle !== sample.cycle || current.kind !== sample.kind) {
      current = {
        cycle: sample.cycle,
        kind: sample.kind,
        start: sample.age,
        end: sample.age,
        windup: false,
        attack: false,
      };
      windows.push(current);
    }
    current.end = sample.age;
    current[sample.phase] = true;
  }

  const complete = windows.filter((window) => window.windup && window.attack);
  const counts = new Map();
  let longestRun = 0;
  let run = 0;
  let previous = null;
  for (const window of complete) {
    counts.set(window.kind, (counts.get(window.kind) ?? 0) + 1);
    run = previous?.kind === window.kind && previous.cycle + 1 === window.cycle ? run + 1 : 1;
    longestRun = Math.max(longestRun, run);
    previous = window;
  }
  const findings = [];
  const sufficient = complete.length >= minWindows;
  if (sufficient && longestRun >= repeatLimit) {
    findings.push({
      id: 'boss-consecutive-repeat',
      rule: 'NW-R008',
      severity: 'P1-candidate',
      longestRun,
      threshold: repeatLimit,
    });
  }
  return {
    status: !sufficient ? 'INSUFFICIENT_EXPOSURE' : findings.length ? 'FINDINGS' : 'OBSERVED_OK',
    windows,
    completeWindows: complete.length,
    distinctAttacks: counts.size,
    distribution: Object.fromEntries(counts),
    longestRun,
    findings,
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}
