const axes = ['x', 'y', 'z'];
const halfKeys = ['halfX', 'halfY', 'halfZ'];
const finite = (value) => typeof value === 'number' && Number.isFinite(value);

// Conservative segment test against the interior of a moving AABB.
// Endpoints must lie on opposite sides of at least one axis.
export function crossedSolid(before, after, first, last, margin = 0.25) {
  if (!first?.active || !last?.active || first.kind !== last.kind) return false;
  if (!finite(margin) || margin < 0) throw new Error('Invalid margin');
  let enter = 0;
  let exit = 1;
  let opposite = false;
  for (let i = 0; i < axes.length; i++) {
    const axis = axes[i];
    const key = halfKeys[i];
    const values = [before[axis], after[axis], first[axis], last[axis], first[key], last[key]];
    if (!values.every(finite) || first[key] !== last[key]) return false;
    const half = first[key] - margin;
    if (half <= 0) return false;
    const start = before[axis] - first[axis];
    const end = after[axis] - last[axis];
    if ((start < -half && end > half) || (start > half && end < -half)) opposite = true;
    const delta = end - start;
    if (Math.abs(delta) < 1e-9) {
      if (Math.abs(start) >= half) return false;
      continue;
    }
    const a = (-half - start) / delta;
    const b = (half - start) / delta;
    enter = Math.max(enter, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
    if (enter >= exit) return false;
  }
  return opposite;
}

// Each city's collider list is preallocated in stable order. Exclude large
// center jumps (tile wrapping), non-playing frames and discontinuous samples.
export function inspectSweptCity(samples, { maxGap = 0.11, maxSolidShift = 40 } = {}) {
  if (!finite(maxGap) || maxGap <= 0 || !finite(maxSolidShift) || maxSolidShift <= 0) {
    throw new Error('Invalid sweep calibration');
  }
  const findings = [];
  const seen = new Set();
  let pairs = 0;
  for (let i = 1; i < samples.length; i++) {
    const previous = samples[i - 1];
    const current = samples[i];
    const dt = current.seconds - previous.seconds;
    if (!finite(dt) || dt <= 0 || dt > maxGap) continue;
    if (previous.sector !== 1 || current.sector !== 1) continue;
    if (previous.state !== 'playing' || current.state !== 'playing') continue;
    const a = { ...previous.player, z: previous.playerDepth };
    const b = { ...current.player, z: current.playerDepth };
    if (!axes.every((axis) => finite(a[axis]) && finite(b[axis]))) continue;
    const first = previous.cityPhysicalSolids;
    const last = current.cityPhysicalSolids;
    if (!Array.isArray(first) || !Array.isArray(last) || first.length !== last.length) continue;
    for (let index = 0; index < first.length; index++) {
      const old = first[index];
      const now = last[index];
      if (!old?.active || !now?.active || old.kind !== now.kind) continue;
      if (!axes.every((axis) => Math.abs(now[axis] - old[axis]) <= maxSolidShift)) continue;
      if (!halfKeys.every((key) => finite(old[key]) && old[key] > 0 && old[key] === now[key])) {
        continue;
      }
      pairs++;
      if (!crossedSolid(a, b, old, now)) continue;
      const id = 'sweep:' + index + ':' + now.kind;
      if (seen.has(id)) continue;
      seen.add(id);
      findings.push({
        id,
        rule: 'NW-R001',
        severity: 'P0-candidate',
        start: previous.seconds,
        detectedAt: current.seconds,
        object: now.kind,
        before: a,
        after: b,
        colliderBefore: old,
        colliderAfter: now,
      });
    }
  }
  return {
    status: !pairs ? 'BLOCKED' : findings.length ? 'FINDINGS' : 'OBSERVED_OK',
    pairs,
    findings,
    mode: 'advisory',
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}
