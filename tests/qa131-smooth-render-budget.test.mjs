import test from 'node:test';
import assert from 'node:assert/strict';
import {
  graphicsBudgetTransition,
  createAdaptiveGraphics,
  graphicsPixelRatioLimit,
} from '../src/graphics-quality.js';

test('DPR-only adaptation must not rebuild premium world geometry', () => {
  const start = graphicsBudgetTransition(null, {
    quality: 'high',
    resolutionScale: 1,
  }, { devicePixelRatio: 3, coarsePointer: false });
  assert.equal(start.qualityChanged, true);
  assert.equal(start.pixelRatioChanged, true);
  assert.equal(start.pixelRatio, 1.7);
  const lower = graphicsBudgetTransition(start.next, {
    quality: 'high',
    resolutionScale: 0.87,
  }, { devicePixelRatio: 3, coarsePointer: false });
  assert.equal(lower.qualityChanged, false, 'keep the premium scene/meshes intact');
  assert.equal(lower.pixelRatioChanged, true, 'only downscale internal render resolution');
  assert.ok(lower.pixelRatio < start.pixelRatio);
  const repeated = graphicsBudgetTransition(lower.next, {
    quality: 'high',
    resolutionScale: 0.87,
  }, { devicePixelRatio: 3, coarsePointer: false });
  assert.equal(repeated.qualityChanged, false);
  assert.equal(repeated.pixelRatioChanged, false, 'no redundant reallocations');
});

test('a genuine HIGH to MEDIUM transition alone permits expensive scene switching', () => {
  const initial = graphicsBudgetTransition(null, {
    quality: 'high', resolutionScale: 0.7,
  }, { coarsePointer: true, devicePixelRatio: 3 });
  const change = graphicsBudgetTransition(initial.next, {
    quality: 'medium', resolutionScale: 0.9,
  }, { coarsePointer: true, devicePixelRatio: 3 });
  assert.equal(change.qualityChanged, true);
  assert.equal(change.pixelRatioChanged, true);
  assert.ok(change.pixelRatio > initial.pixelRatio);
  const manualSwitch = graphicsBudgetTransition(change.next, {
    quality: 'high', resolutionScale: 1,
  }, { coarsePointer: true, devicePixelRatio: 3 });
  assert.equal(manualSwitch.qualityChanged, true);
  assert.equal(manualSwitch.pixelRatio, graphicsPixelRatioLimit('high', { coarsePointer: true }));
});

test('sub-pixel DPR differences do not reset renderer render targets', () => {
  const initial = graphicsBudgetTransition(null, {
    quality: 'high', resolutionScale: 1,
  }, { devicePixelRatio: 1, coarsePointer: false });
  const repeated = graphicsBudgetTransition(initial.next, {
    quality: 'high', resolutionScale: 0.995,
  }, { devicePixelRatio: 1, coarsePointer: false });
  assert.equal(repeated.pixelRatioChanged, false);
  assert.equal(repeated.qualityChanged, false);
});

test('sustained jank with good average FPS triggers an adaptive render-only downscale', () => {
  const adaptive = createAdaptiveGraphics({
    mode: 'high', coarsePointer: true, deviceMemory: 8, hardwareConcurrency: 8,
  });
  let now = 0, adjustment = null;
  for (let i = 1; i <= 1000; i++) {
    now += i % 10 === 0 ? 66 : 16;
    const result = adaptive.sample(now, true);
    if (result?.resolutionScale < 1) { adjustment = result; break; }
  }
  assert.ok(adjustment, 'repeated 66ms hitches must trigger a smoothness response');
  assert.equal(adjustment.quality, 'high', 'premium geometry survives first adaptation');
  assert.ok(adjustment.resolutionScale < 1);
});

test('a single rare stall is not a reason to degrade the premium rendering', () => {
  const adaptive = createAdaptiveGraphics({
    mode: 'high', coarsePointer: true, deviceMemory: 8, hardwareConcurrency: 8,
  });
  let now = 0, changed = false;
  for (let i = 1; i <= 1100; i++) {
    now += i % 149 === 0 ? 85 : 16;
    if (adaptive.sample(now, true)?.resolutionScale < 1) changed = true;
  }
  assert.equal(changed, false);
  assert.equal(adaptive.current().resolutionScale, 1);
});

test('inactive menus, mission-map briefings and browser interruptions cannot downscale graphics', () => {
  const adaptive = createAdaptiveGraphics({ mode: 'high' });
  let time = 0;
  for (let i = 0; i < 1000; i++) {
    time += 100;
    assert.equal(adaptive.sample(time, false), null);
  }
  assert.equal(adaptive.current().resolutionScale, 1);
  // Unknown suspension >240ms is ignored as a GPU performance observation.
  adaptive.sample(time + 30, true);
  adaptive.sample(time + 1500, true);
  assert.equal(adaptive.current().resolutionScale, 1);
});
