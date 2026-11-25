const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const axes = ['x', 'y', 'z'];
const halfKeys = ['halfX', 'halfY', 'halfZ'];

// Conservative center-in-solid probe, NOT a mesh or swept collision proof.
// This deliberately ignores mere hull contact and inactive decorative geometry.
export function inspectCityPhysics(samples, { margin = 0.25, consecutive = 3 } = {}) {
  if (!finite(margin) || margin < 0 || !Number.isInteger(consecutive) || consecutive < 2) {
    throw new Error('Invalid physics calibration');
  }
  const runs = new Map();
  const findings = [];
  const emitted = new Set();
  let valid = 0;
  let invalid = 0;
  let lastTime = -Infinity;
  let activeSamples = 0;
  for (const sample of samples) {
    const position = { x: sample.player?.x, y: sample.player?.y, z: sample.playerDepth };
    if (
      sample.sector !== 1 ||
      sample.state !== 'playing' ||
      !finite(sample.seconds) ||
      sample.seconds <= lastTime ||
      !axes.every((axis) => finite(position[axis])) ||
      !Array.isArray(sample.cityPhysicalSolids) ||
      !Array.isArray(sample.cityCameraOcclusion)
    ) {
      invalid++;
      runs.clear();
      continue;
    }
    lastTime = sample.seconds;
    valid++;
    const hits = [];
    let malformed = false;
    for (const [index, solid] of sample.cityPhysicalSolids.entries()) {
      if (!solid.active) continue;
      if (
        !axes.every((axis) => finite(solid[axis])) ||
        !halfKeys.every((key) => finite(solid[key]) && solid[key] > 0)
      ) {
        malformed = true;
        continue;
      }
      const depth = Math.min(
        ...axes.map((axis, i) => solid[halfKeys[i]] - Math.abs(position[axis] - solid[axis])),
      );
      if (depth > margin) {
        hits.push({
          id: 'solid:' + index + ':' + solid.kind,
          rule: 'NW-R001',
          severity: 'P0-candidate',
          depth,
          object: solid.kind,
          position,
        });
      }
    }
    if (sample.cityPhysicalSolids.some((solid) => solid.active)) activeSamples++;
    for (const group of sample.cityCameraOcclusion) {
      if (!finite(group.fade) || !finite(group.opacity)) {
        malformed = true;
        continue;
      }
      // Inconsistent fade response is a proxy, not measured pixel occlusion.
      if (group.fade > 0.6 && group.opacity > 0.95) {
        hits.push({
          id: 'fade:' + group.tile + ':' + group.kind,
          rule: 'NW-R002',
          severity: 'P1-candidate',
          opacity: group.opacity,
          fade: group.fade,
          position,
        });
      }
    }
    if (malformed) {
      invalid++;
      runs.clear();
      continue;
    }
    const current = new Set(hits.map((hit) => hit.id));
    for (const id of runs.keys()) if (!current.has(id)) runs.delete(id);
    for (const hit of hits) {
      const run = runs.get(hit.id) ?? { count: 0, start: sample.seconds };
      run.count++;
      runs.set(hit.id, run);
      if (run.count >= consecutive && !emitted.has(hit.id)) {
        emitted.add(hit.id);
        findings.push({ ...hit, start: run.start, detectedAt: sample.seconds, samples: run.count });
      }
    }
  }
  const blocked = invalid > 0 || valid < consecutive || activeSamples < consecutive;
  return {
    status: blocked ? 'BLOCKED' : findings.length ? 'FINDINGS' : 'OBSERVED_OK',
    mode: 'advisory',
    valid,
    invalid,
    activeSamples,
    findings,
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}
