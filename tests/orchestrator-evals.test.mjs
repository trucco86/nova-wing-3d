import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateContracts } from '../tools/orchestrator-evals.mjs';

const corpus = JSON.parse(
  readFileSync(new URL('../specs/evals/orchestrator-cases.json', import.meta.url), 'utf8'),
);
function fixture(t, data = corpus) {
  const root = mkdtempSync(join(tmpdir(), 'nw-evals-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'specs/evals'), { recursive: true });
  const path = join(root, 'specs/evals/orchestrator-cases.json');
  writeFileSync(path, JSON.stringify(data));
  return { root, path };
}

test('versioned synthetic corpus exercises real validators and preserves per-case evidence', (t) => {
  const { root } = fixture(t);
  const report = evaluateContracts({ root });
  assert.equal(report.passed, true);
  assert.equal(report.status, 'passed');
  assert.equal(report.sampleSize, 17);
  assert.deepEqual(report.confusionMatrix, {
    truePositive: 3,
    falsePositive: 0,
    trueNegative: 14,
    falseNegative: 0,
  });
  assert.equal(report.falseApprovals, 0);
  assert.equal(report.synthetic, true);
  assert.equal(report.evaluationType, 'contract');
  assert.equal(report.releaseReady, false);
  for (const id of [
    'validation-stale-source',
    'validation-missing-evidence',
    'review-self-review',
    'review-mismatched-request',
    'review-contradictory-finding',
  ]) {
    const item = report.cases.find((item) => item.id === id);
    assert.equal(item.actualAccept, false, id);
    assert.ok(item.problem, id);
    assert.equal(item.error, null, id);
  }
  assert.deepEqual(JSON.parse(readFileSync(report.reportPath)), report);
  assert.notEqual(evaluateContracts({ root }).reportId, report.reportId);
});

test('unexpected contract acceptance is a false approval and fails the evaluation', (t) => {
  const data = structuredClone(corpus);
  data.cases = [data.cases.find((item) => item.id === 'review-valid-pass')];
  data.cases[0].expectedAccept = false;
  const { root } = fixture(t, data);
  const report = evaluateContracts({ root });
  assert.equal(report.passed, false);
  assert.equal(report.status, 'failed');
  assert.equal(report.falseApprovals, 1);
  assert.equal(report.confusionMatrix.falsePositive, 1);
  assert.equal(report.cases[0].falseApproval, true);
  assert.equal(report.cases[0].actualAccept, true);
});

test('valid rejection with an erroneous positive label is a false negative', (t) => {
  const data = structuredClone(corpus);
  data.cases = [data.cases.find((item) => item.id === 'review-self-review')];
  data.cases[0].expectedAccept = true;
  const { root } = fixture(t, data);
  const report = evaluateContracts({ root });
  assert.equal(report.passed, false);
  assert.equal(report.confusionMatrix.falseNegative, 1);
  assert.equal(report.falseApprovals, 0);
});

test('schema errors, empty corpus, duplicate IDs and malformed JSON fail before writing evidence', (t) => {
  for (const mutate of [
    (data) => {
      data.schemaVersion = 2;
    },
    (data) => {
      data.synthetic = false;
    },
    (data) => {
      data.evaluationType = 'semantic';
    },
    (data) => {
      data.cases = [];
    },
    (data) => {
      data.cases.push(structuredClone(data.cases[0]));
    },
    (data) => {
      data.cases[0].expectedAccept = 'true';
    },
    (data) => {
      data.cases[0].validator = 'shell-command';
    },
    (data) => {
      delete data.cases[0].input.task;
    },
  ]) {
    const data = structuredClone(corpus);
    mutate(data);
    const { root } = fixture(t, data);
    assert.throws(() => evaluateContracts({ root }), /inválid|duplicado/);
    assert.equal(existsSync(join(root, 'artifacts')), false);
  }
  const { root, path } = fixture(t);
  writeFileSync(path, '{broken');
  assert.throws(() => evaluateContracts({ root }), SyntaxError);
});

test('missing response input is invalid corpus data, not a successful rejection', (t) => {
  const data = structuredClone(corpus);
  data.cases = [data.cases.find((item) => item.id === 'review-valid-pass')];
  data.cases[0].expectedAccept = false;
  data.cases[0].input.response = undefined;
  // Missing input fields are invalid corpus data, not successful contract rejections.
  const { root } = fixture(t, data);
  assert.throws(() => evaluateContracts({ root }), /Caso inválido/);
});

test('corpus and output symlinks are rejected without writing outside root', (t) => {
  const { root, path } = fixture(t);
  const outside = mkdtempSync(join(tmpdir(), 'nw-evals-outside-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  const remote = join(outside, 'corpus.json');
  writeFileSync(remote, JSON.stringify(corpus));
  rmSync(path);
  symlinkSync(remote, path);
  assert.throws(() => evaluateContracts({ root }), /arquivo regular/);
  rmSync(path);
  writeFileSync(path, JSON.stringify(corpus));
  symlinkSync(outside, join(root, 'artifacts'));
  assert.throws(() => evaluateContracts({ root }), /redirecionado/);
  assert.equal(existsSync(join(outside, 'orchestrator')), false);
});
