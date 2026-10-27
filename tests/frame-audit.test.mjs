import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFrameAudit, formatFrameAudit } from '../src/frame-audit.js';

test('opt-in frame cadence counts only consecutive frames during actual gameplay', () => {
  const audit = createFrameAudit();
  audit.sample(0);
  assert.equal(audit.report().frames, 0, 'no samples unless started');
  audit.start();
  for (let i = 0; i <= 60; i++) audit.sample(i * (1000 / 60));
  const result = audit.report();
  assert.equal(result.frames, 60);
  assert.ok(Math.abs(result.avgFps - 60) <= 0.1);
  assert.equal(result.over33Ms, 0);
  assert.ok(result.p95FrameMs > 16.5 && result.p95FrameMs < 16.9);
  audit.sample(60000, false);
  audit.sample(60016, true);
  audit.sample(60032, true);
  assert.equal(audit.report().frames, 61, 'resume does not count paused gap');
  audit.stop();
  audit.sample(60048);
  assert.equal(audit.report().frames, 61, 'stop freezes measurements');
});

test('audit distinguishes slow frames and suspensions without false spikes', () => {
  const audit = createFrameAudit();
  audit.start();
  for (const ms of [0, 16, 49.5, 102, 123, 1324, 1357.5, 1410]) audit.sample(ms);
  const data = audit.report();
  assert.equal(data.frames, 5, 'suspension resets sampling baseline');
  assert.equal(data.interruptions, 1);
  assert.equal(data.over33Ms, 3);
  assert.equal(data.over50Ms, 2);
  assert.ok(data.p95FrameMs >= 52.5);
  assert.ok(data.avgFps < 40);
});

test('frame audit bounds history and rejects clock anomalies', () => {
  const audit = createFrameAudit({ capacity: 3 });
  audit.start();
  for (const t of [0, 16, 49, 99, 199]) audit.sample(t);
  audit.sample(199, true);
  audit.sample(150, true);
  assert.equal(audit.report().frames, 3, 'fixed capacity is not exceeded');
  assert.equal(audit.report().over50Ms, 1);
  audit.clear();
  assert.deepEqual(audit.report(), {
    active: false,
    frames: 0,
    durationSeconds: 0,
    avgFps: 0,
    p95FrameMs: 0,
    over33Ms: 0,
    over50Ms: 0,
    interruptions: 0,
  });
  assert.throws(() => createFrameAudit({ capacity: -2 }), RangeError);
});

test('localized report has only view dimensions and frame statistics, never user identifiers', () => {
  const audit = createFrameAudit();
  audit.start();
  audit.sample(0);
  audit.sample(20);
  audit.stop();
  for (const lang of ['pt', 'en', 'es']) {
    const report = formatFrameAudit(audit.report(), {
      language: lang,
      width: 390,
      height: 844,
      dpr: 3,
    });
    assert.match(report, /390×844/);
    assert.match(report, /50\.0/);
    assert.match(report, /GPU/);
    assert.doesNotMatch(report, /userAgent|localStorage|latitude|longitude|token/);
  }
});
