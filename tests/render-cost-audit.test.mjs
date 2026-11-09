import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderCostAudit } from '../src/render-cost-audit.js';

test('render-cost audit is opt-in, uses actual scene counters and never invents samples', () => {
  const audit = createRenderCostAudit();
  const frame = { drawCalls: 71, triangles: 12000, postPasses: 3 };
  audit.sample(frame);
  assert.equal(audit.report().samples, 0);
  audit.start();
  audit.sample(frame, false);
  audit.sample(null);
  audit.sample({ drawCalls: null, triangles: 12000, postPasses: 0 });
  audit.sample({ drawCalls: -1, triangles: 12000, postPasses: 0 });
  assert.equal(audit.report().samples, 0);
  audit.sample(frame);
  audit.sample({ drawCalls: 110, triangles: 25000, postPasses: 0 });
  const report = audit.report();
  assert.deepEqual(report, {
    active: true,
    samples: 2,
    p95DrawCalls: 110,
    maxDrawCalls: 110,
    p95Triangles: 25000,
    maxTriangles: 25000,
    maxPostPasses: 3,
  });
  audit.stop();
  audit.sample(frame);
  assert.equal(audit.report().samples, 2);
  audit.clear();
  assert.deepEqual(audit.report(), {
    active: false,
    samples: 0,
    p95DrawCalls: null,
    maxDrawCalls: null,
    p95Triangles: null,
    maxTriangles: null,
    maxPostPasses: null,
  });
});

test('bounded ring-buffer preserves only the newest frames and computes exact p95', () => {
  const audit = createRenderCostAudit({ capacity: 4 });
  audit.start();
  for (const n of [100, 200, 300, 400, 30, 50, 70])
    audit.sample({ drawCalls: n, triangles: n * 100, postPasses: 0 });
  const report = audit.report();
  assert.equal(report.samples, 4);
  assert.equal(report.p95DrawCalls, 400);
  assert.equal(report.maxDrawCalls, 400);
  assert.equal(report.p95Triangles, 40000);
  assert.equal(report.maxPostPasses, 0);
  assert.throws(() => createRenderCostAudit({ capacity: 0 }), RangeError);
  assert.throws(() => createRenderCostAudit({ capacity: 36001 }), RangeError);
  assert.throws(() => createRenderCostAudit({ capacity: 2.3 }), RangeError);
});
