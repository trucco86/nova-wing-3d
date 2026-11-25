const finite = (value) => typeof value === 'number' && Number.isFinite(value);

export function overlapRatio(a, b) {
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const smaller = Math.min(
    (a.right - a.left) * (a.bottom - a.top),
    (b.right - b.left) * (b.bottom - b.top),
  );
  return smaller > 0 ? (width * height) / smaller : 0;
}

export function inspectHudOverlap(samples, { threshold = 0.2, consecutive = 3 } = {}) {
  if (!finite(threshold) || threshold <= 0 || threshold > 1) throw new Error('Invalid threshold');
  if (!Number.isInteger(consecutive) || consecutive < 2) throw new Error('Invalid persistence');
  const counts = new Map();
  const findings = [];
  const emitted = new Set();
  let last = -Infinity;
  let covered = 0;
  for (const sample of samples) {
    if (!finite(sample.seconds) || sample.seconds <= last || !Array.isArray(sample.labels)) {
      return { status: 'BLOCKED', findings, releaseAuthorized: false };
    }
    last = sample.seconds;
    const visible = sample.labels.filter((label) => label.visible);
    const valid = visible.every(
      (label) =>
        typeof label.id === 'string' &&
        ['left', 'top', 'right', 'bottom'].every((key) => finite(label[key])) &&
        label.right > label.left &&
        label.bottom > label.top,
    );
    if (!valid) return { status: 'BLOCKED', findings, releaseAuthorized: false };
    if (visible.length > 1) covered++;
    const active = new Set();
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];
        if (a.id === b.id) continue;
        const id = [a.id, b.id].sort().join(':');
        const ratio = overlapRatio(a, b);
        if (ratio < threshold) continue;
        active.add(id);
        const run = (counts.get(id) ?? 0) + 1;
        counts.set(id, run);
        if (run >= consecutive && !emitted.has(id)) {
          emitted.add(id);
          findings.push({
            id,
            rule: 'NW-R009',
            severity: 'P1-candidate',
            ratio,
            seconds: sample.seconds,
            labels: [a, b],
          });
        }
      }
    }
    for (const id of counts.keys()) if (!active.has(id)) counts.delete(id);
  }
  return {
    status:
      covered < consecutive ? 'INSUFFICIENT_EXPOSURE' : findings.length ? 'FINDINGS' : 'OBSERVED_OK',
    covered,
    findings,
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}
