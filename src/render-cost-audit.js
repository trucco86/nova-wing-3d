// Opt-in Three.js scene-render budget audit for physical-device QA.
// Never performs network, storage or device fingerprinting. "drawCalls" and
// "triangles" come from WebGLRenderer.info after the real scene draw; they
// are NOT GPU duration or a synthetic FPS estimate.
export function createRenderCostAudit({ capacity = 3600 } = {}) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 36000)
    throw new RangeError('capacity must be an integer between 1 and 36000');
  const calls = new Float64Array(capacity);
  const triangles = new Float64Array(capacity);
  const passes = new Float64Array(capacity);
  let active = false;
  let used = 0;
  let cursor = 0;
  function clear() {
    active = false;
    used = 0;
    cursor = 0;
  }
  function start() {
    clear();
    active = true;
  }
  function stop() {
    active = false;
  }
  function sample(cost, inGameplay = true) {
    if (!active || !inGameplay || !cost) return;
    const { drawCalls, triangles: trianglesCount, postPasses } = cost;
    // Skip partial/invalid renderer evidence rather than inventing zeros.
    if (
      ![drawCalls, trianglesCount, postPasses].every(
        (value) => Number.isSafeInteger(value) && value >= 0,
      )
    ) return;
    calls[cursor] = drawCalls;
    triangles[cursor] = trianglesCount;
    passes[cursor] = postPasses;
    cursor = (cursor + 1) % capacity;
    used = Math.min(used + 1, capacity);
  }
  function report() {
    if (!used)
      return {
        active,
        samples: 0,
        p95DrawCalls: null,
        maxDrawCalls: null,
        p95Triangles: null,
        maxTriangles: null,
        maxPostPasses: null,
      };
    const p95 = (values) => {
      const sorted = Array.from(values.slice(0, used)).sort((a, b) => a - b);
      return sorted[Math.ceil(sorted.length * 0.95) - 1];
    };
    return {
      active,
      samples: used,
      p95DrawCalls: p95(calls),
      maxDrawCalls: Math.max(...calls.slice(0, used)),
      p95Triangles: p95(triangles),
      maxTriangles: Math.max(...triangles.slice(0, used)),
      maxPostPasses: Math.max(...passes.slice(0, used)),
    };
  }
  return Object.freeze({ start, stop, clear, sample, report });
}
