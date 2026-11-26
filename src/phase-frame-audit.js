// Opt-in phase attribution; fixed-size histograms avoid per-frame allocation.
export function createPhaseFrameAudit() {
  const names = ['opening', 'city', 'ascent', 'space', 'other'];
  const buckets = names.map(() => ({ count: 0, sum: 0, peak: 0, stalls: 0, hist: new Uint32Array(251) }));
  let active = false, last = null, previous = null;
  function clear() {
    active = false; last = previous = null;
    for (const b of buckets) { b.count = b.sum = b.peak = b.stalls = 0; b.hist.fill(0); }
  }
  function sample(time, phase, eligible) {
    if (!active || !eligible || !Number.isFinite(time)) { last = previous = null; return; }
    if (last !== null && previous === phase && time > last) {
      const ms = time - last;
      const b = buckets[names.indexOf(phase)] ?? buckets[4];
      b.count++; b.sum += ms; b.peak = Math.max(b.peak, ms);
      if (ms > 100) b.stalls++;
      b.hist[Math.min(250, Math.ceil(ms))]++;
    }
    last = time; previous = phase;
  }
  function report() {
    return names.flatMap((name, i) => {
      const b = buckets[i];
      if (!b.count) return [];
      let n = 0, p95 = 0;
      while (p95 < 250 && (n += b.hist[p95]) < Math.ceil(b.count * .95)) p95++;
      return [{ name, frames: b.count, fps: Math.round(1000 * b.count / b.sum), p95, peak: Math.round(b.peak), stalls: b.stalls }];
    });
  }
  return { clear, start() { clear(); active = true; }, stop() { active = false; last = previous = null; }, sample, report };
}
export function stageOneAuditPhase(sector, cinematic, ascent) {
  if (sector !== 0) return 'other';
  if (cinematic) return 'opening';
  if (ascent >= 1) return 'space';
  if (ascent > 0) return 'ascent';
  return 'city';
}
