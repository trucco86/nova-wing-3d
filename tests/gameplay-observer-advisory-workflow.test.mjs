import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

test('scheduled advisory opens defect issues only for objective findings or blocked evidence', () => {
  const source = readFileSync(
    new URL('../.github/workflows/gameplay-observer.yml', import.meta.url),
    'utf8',
  );
  const workflow = parse(source);
  const advisory = workflow.jobs.observe.steps.find(
    (step) => step.name === 'Open or update deduplicated scheduled advisory',
  );
  assert.ok(advisory, 'scheduled defect triage step must exist');
  assert.equal(advisory.if, "github.event_name == 'schedule'");
  assert.match(
    advisory.run,
    /\[ "\$status" = "OBSERVED_OK" \] \|\| \[ "\$status" = "REVIEW_REQUIRED" \]/,
    'visual reviews without objective anomalies must not create defect issues',
  );
  assert.match(advisory.run, /gh issue (edit|create)/);
  assert.match(advisory.run, /gameplay-observer-signature:/);
  assert.match(
    source,
    /gameplay-quality-observer\.spec\.mjs gameplay-physics-observer\.spec\.mjs/,
    'the 14-observation integrated workflow must preserve scene and physics coverage',
  );
});
