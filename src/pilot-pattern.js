// Lightweight gameplay adaptation: no cloud model, personal data collection,
// frame allocations or random retargeting. Tracks pilot movement only during
// an active boss encounter; reset between sectors and on restart.
export function createPilotPatternReader() {
  let last = null;
  let horizontal = 0;
  let vertical = 0;
  let boostingRate = 0;
  let samples = 0;
  function sample(position, dt, boosting = false) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y) ||
      !Number.isFinite(dt) || dt <= 0 || dt > 0.25) return;
    const alpha = Math.min(0.22, dt * 1.7);
    if (last) {
      const sx = Math.min(95, Math.abs(position.x - last.x) / dt);
      const sy = Math.min(95, Math.abs(position.y - last.y) / dt);
      horizontal += (sx - horizontal) * alpha;
      vertical += (sy - vertical) * alpha;
    }
    boostingRate += ((boosting ? 1 : 0) - boostingRate) * alpha;
    last = { x: position.x, y: position.y };
    samples = Math.min(samples + 1, 10000);
  }
  function snapshot() {
    const axis = samples < 12 || Math.max(horizontal, vertical) < 7
      ? 'mixed'
      : horizontal > vertical * 1.3
        ? 'horizontal'
        : vertical > horizontal * 1.3
          ? 'vertical'
          : 'mixed';
    return Object.freeze({
      axis,
      boostHeavy: boostingRate > 0.55,
      observed: samples >= 12,
    });
  }
  function reset() {
    last = null;
    horizontal = vertical = boostingRate = 0;
    samples = 0;
  }
  return Object.freeze({ sample, snapshot, reset });
}

// Existing boss hardware/weakpoint gates remain authoritative. Adaptive
// choices only switch between already-authored, telegraphed attacks.
export function adaptiveBossAttack({ sector, kind, phase, cycle, previousKind, pilotPattern }) {
  if (!pilotPattern?.observed || phase < 2 || cycle <= 0 || cycle % 4 === 0) return kind;
  const families = {
    0: ['rok-pincer', 'rok-ram'],
    1: ['stingray-scissor', 'stingray-sting'],
    2: ['drill-crosscut', 'drill-ram'],
    4: ['solar-sweep', 'plasma-dive'],
    5: ['ice-quake', 'cryo-pincer'],
    8: ['orion-gravity-pulse', 'orion-iris-shear'],
  };
  const pair = families[sector];
  if (!pair) return kind;
  // One repeat is acceptable. Alternating if the pilot keeps forcing the
  // same outcome avoids identical boss attacks on successive openings.
  if (kind === previousKind) return pair.find((candidate) => candidate !== kind) ?? kind;
  if (pilotPattern.axis === 'horizontal' && cycle % 3 === 2) return pair[1];
  if (pilotPattern.axis === 'vertical' && cycle % 3 === 2) return pair[0];
  if (pilotPattern.boostHeavy && cycle % 3 === 1) return pair[1];
  return kind;
}
