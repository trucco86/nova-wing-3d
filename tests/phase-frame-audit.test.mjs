import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPhaseFrameAudit, stageOneAuditPhase } from '../src/phase-frame-audit.js';
test('phase audit isolates stalls and ignores pause and phase boundaries', () => {
  const a = createPhaseFrameAudit();
  a.start();
  a.sample(0, 'city', true);
  a.sample(16, 'city', true);
  a.sample(136, 'city', true);
  a.sample(500, 'ascent', true);
  a.sample(520, 'ascent', true);
  a.sample(600, 'ascent', false);
  a.sample(1000, 'ascent', true);
  a.sample(1020, 'ascent', true);
  a.stop();
  assert.deepEqual(
    a.report().map((p) => [p.name, p.frames, p.stalls, p.p95]),
    [
      ['city', 2, 1, 120],
      ['ascent', 2, 0, 20],
    ],
  );
  assert.equal(stageOneAuditPhase(0, false, 0.5), 'ascent');
  assert.equal(stageOneAuditPhase(0, false, 1), 'space');
});
