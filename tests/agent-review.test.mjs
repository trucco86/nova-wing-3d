import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
import { fileURLToPath } from 'node:url';
import { check, plan } from '../tools/orchestrator.mjs';
import { requestReview, recordReview } from '../tools/agent-review.mjs';

const cli = fileURLToPath(new URL('../tools/orchestrator-cli.mjs', import.meta.url));

function fixture(t, browser = false, prepare = () => {}) {
  const root = mkdtempSync(join(tmpdir(), 'nw-review-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'specs'));
  writeFileSync(join(root, 'specs', 'task.md'), '# Tarefa\n');
  writeFileSync(join(root, 'source.js'), 'export const value = 1;\n');
  writeFileSync(join(root, '.gitignore'), 'artifacts/\n');
  for (const args of [
    ['init', '-q'],
    ['add', '.'],
    ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture'],
  ])
    assert.equal(spawnSync('git', args, { cwd: root }).status, 0);
  prepare(root);
  const options = { root, spec: 'specs/task.md', browser };
  const run = check(options, () => {
    const task = plan(options);
    const evidence = {
      started: new Date().toISOString(),
      finished: new Date().toISOString(),
      commit: task.commit,
      sourceDigest: task.sourceDigest,
      passed: true,
      checks: [
        'format:check',
        'lint',
        'test',
        'check:repo',
        'build:check',
        ...(browser ? ['test:browser'] : []),
      ].map((command) => ({ command, exitCode: 0, error: null })),
      browser: browser ? 'executed' : 'not-run',
    };
    writeFileSync(join(root, 'artifacts', 'validation.json'), JSON.stringify(evidence));
    return { status: 0 };
  });
  assert.equal(run.status, 'awaiting-review');
  return { root, runId: run.runId, implementerId: '/root/implementation', run };
}

function respond(request, changes = {}) {
  const response = {
    ...request.responseExample,
    reviewerId: '/root/qa',
    summary: 'Revisão concluída.',
    checks: [{ command: 'node --test tests/example.test.mjs', outcome: 'passed' }],
    ...changes,
  };
  writeFileSync(join(request.directory, 'response.json'), JSON.stringify(response));
  return response;
}

test('validated run produces a scoped request and PASS hands off to CI', (t) => {
  const options = fixture(t, true);
  const request = requestReview(options);
  assert.equal(request.implementerId, '/root/implementation');
  assert.equal(request.role, 'independent-review');
  assert.equal(request.diff.mode, 'initial-tree');
  assert.equal(request.diff.baseCommit, null);
  assert.equal(request.diff.headCommit, request.commit);
  assert.equal(request.releaseReady, false);
  assert.ok(request.context.includes('docs/QA-AGENT.md'));
  assert.ok(request.instructions.some((instruction) => instruction.includes('Não edite fontes')));
  const handoffBefore = readFileSync(join(options.run.directory, 'handoff.json'), 'utf8');
  respond(request);
  const result = recordReview({ ...options, requestId: request.requestId });
  assert.equal(result.status, 'awaiting-ci');
  assert.equal(result.nextOwner, 'ci');
  assert.equal(result.releaseReady, false);
  assert.ok(result.pending.some((item) => item.includes('dispositivo real')));
  assert.equal(readFileSync(join(options.run.directory, 'handoff.json'), 'utf8'), handoffBefore);
  assert.equal(
    JSON.parse(readFileSync(join(result.directory, 'review-result.json'))).verdict,
    'PASS',
  );
});

test('clean committed changes identify the parent SHA instead of an empty HEAD diff', (t) => {
  const options = fixture(t, false, (root) => {
    writeFileSync(join(root, 'source.js'), 'export const value = 2;\n');
    assert.equal(spawnSync('git', ['add', 'source.js'], { cwd: root }).status, 0);
    assert.equal(
      spawnSync(
        'git',
        [
          '-c',
          'user.name=Test',
          '-c',
          'user.email=test@example.invalid',
          'commit',
          '-qm',
          'change',
        ],
        { cwd: root },
      ).status,
      0,
    );
  });
  const request = requestReview(options);
  const parent = spawnSync('git', ['rev-parse', 'HEAD^'], {
    cwd: options.root,
    encoding: 'utf8',
  }).stdout.trim();
  assert.deepEqual(request.diff, {
    mode: 'commit',
    baseCommit: parent,
    headCommit: request.commit,
  });
  assert.notEqual(parent, request.commit);
});

test('uncommitted tracked and new files use the validated HEAD as the diff base', (t) => {
  const options = fixture(t, false, (root) => {
    writeFileSync(join(root, 'source.js'), 'export const value = 2;\n');
    writeFileSync(join(root, 'new-source.js'), 'export const extra = true;\n');
  });
  const request = requestReview(options);
  assert.deepEqual(request.diff, {
    mode: 'working-tree',
    baseCommit: request.commit,
    headCommit: request.commit,
  });
});

test('a shallow checkout cannot be misclassified as an initial commit', (t) => {
  const options = fixture(t, false, (root) => {
    assert.equal(
      spawnSync(
        'git',
        [
          '-c',
          'user.name=Test',
          '-c',
          'user.email=test@example.invalid',
          'commit',
          '--allow-empty',
          '-qm',
          'second',
        ],
        { cwd: root },
      ).status,
      0,
    );
    const head = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).stdout.trim();
    const parent = spawnSync('git', ['rev-parse', 'HEAD^'], {
      cwd: root,
      encoding: 'utf8',
    }).stdout.trim();
    // A depth-one checkout retains the parent header but not the parent object.
    writeFileSync(join(root, '.git', 'shallow'), head + '\n');
    const object = join(root, '.git', 'objects', parent.slice(0, 2), parent.slice(2));
    rmSync(object);
  });
  assert.throws(() => requestReview(options), /Histórico incompleto/);
});

test('FAIL returns to implementation and BLOCKED stays with the reviewer', (t) => {
  const options = fixture(t);
  for (const [verdict, status, owner] of [
    ['FAIL', 'changes-requested', 'implementation'],
    ['BLOCKED', 'blocked', 'independent-review'],
  ]) {
    const request = requestReview(options);
    respond(request, { verdict });
    const result = recordReview({ ...options, requestId: request.requestId });
    assert.equal(result.status, status);
    assert.equal(result.nextOwner, owner);
    assert.equal(result.reason, 'Revisão concluída.');
    assert.equal(result.releaseReady, false);
  }
});

test('changed source and incomplete validation cannot generate a request', (t) => {
  const options = fixture(t);
  const evidenceFile = join(options.run.directory, 'validation.json');
  const evidence = readFileSync(evidenceFile, 'utf8');
  writeFileSync(evidenceFile, JSON.stringify({ ...JSON.parse(evidence), checks: [] }));
  assert.throws(() => requestReview(options), /Evidência/);
  writeFileSync(evidenceFile, evidence);
  writeFileSync(join(options.root, 'source.js'), 'changed');
  assert.throws(() => requestReview(options), /fonte mudou/);
});

test('blocked original handoff cannot generate a request', (t) => {
  const options = fixture(t);
  const file = join(options.run.directory, 'handoff.json');
  const handoff = JSON.parse(readFileSync(file));
  writeFileSync(file, JSON.stringify({ ...handoff, status: 'blocked' }));
  assert.throws(() => requestReview(options), /não está apta/);
});

test('changed source after the request blocks an otherwise passing review', (t) => {
  const options = fixture(t);
  const request = requestReview(options);
  respond(request);
  writeFileSync(join(options.root, 'source.js'), 'new code');
  const result = recordReview({ ...options, requestId: request.requestId });
  assert.equal(result.status, 'blocked');
  assert.match(result.reason, /fonte mudou/);
});

test('mismatched identities, versions and malformed or contradictory reports are blocked', (t) => {
  const options = fixture(t);
  for (const changes of [
    { reviewerId: options.implementerId },
    { reviewerId: '' },
    { reviewerId: 123 },
    { requestId: 'other' },
    { runId: 'other' },
    { commit: 'other' },
    { sourceDigest: 'other' },
    { verdict: 'approved' },
    { summary: '' },
    { findings: [null] },
    { findings: [{ severity: 'high', file: 'source.js', message: 'Bug importante.' }] },
    { checks: [] },
    { checks: [{ command: 'test', outcome: 'not-run' }] },
    { checks: [{ command: 'test', outcome: 'failed' }] },
    { limitations: 'none' },
    { schemaVersion: 2 },
  ]) {
    const request = requestReview(options);
    respond(request, changes);
    const result = recordReview({ ...options, requestId: request.requestId });
    assert.equal(result.status, 'blocked', JSON.stringify(changes));
    assert.ok(result.reason);
  }
});

test('recording cannot overwrite prior evidence, while a new attempt has a unique identity', (t) => {
  const options = fixture(t);
  const request = requestReview(options);
  respond(request);
  const args = { ...options, requestId: request.requestId };
  recordReview(args);
  const before = readFileSync(join(request.directory, 'outcome.json'), 'utf8');
  respond(request, { verdict: 'FAIL' });
  assert.throws(() => recordReview(args), /EEXIST/);
  assert.equal(readFileSync(join(request.directory, 'outcome.json'), 'utf8'), before);
  assert.equal(
    JSON.parse(readFileSync(join(request.directory, 'review-result.json'))).verdict,
    'PASS',
  );
  assert.notEqual(requestReview(options).requestId, request.requestId);
});

test('path traversal and symlinked run/response artifacts are rejected', (t) => {
  const options = fixture(t);
  assert.throws(() => requestReview({ ...options, runId: '../outside' }), /runId inválido/);
  const request = requestReview(options);
  assert.throws(() => recordReview({ ...options, requestId: '../outside' }), /requestId inválido/);
  symlinkSync(join(options.root, 'source.js'), join(request.directory, 'response.json'));
  assert.throws(
    () => recordReview({ ...options, requestId: request.requestId }),
    /Artefato inválido/,
  );
  const file = join(options.run.directory, 'validation.json');
  rmSync(file);
  symlinkSync(join(options.root, 'artifacts', 'validation.json'), file);
  assert.throws(() => requestReview(options), /Artefato inválido/);
});

test('CLI dispatches request and record and returns nonzero for FAIL', (t) => {
  const options = fixture(t);
  const requestCommand = spawnSync(
    process.execPath,
    [cli, 'request-review', options.runId, options.implementerId],
    { cwd: options.root, encoding: 'utf8' },
  );
  assert.equal(requestCommand.status, 0, requestCommand.stderr);
  const request = JSON.parse(requestCommand.stdout);
  respond(request, { verdict: 'FAIL' });
  const recorded = spawnSync(
    process.execPath,
    [cli, 'record-review', options.runId, request.requestId],
    { cwd: options.root, encoding: 'utf8' },
  );
  assert.equal(recorded.status, 1, recorded.stderr);
  assert.equal(JSON.parse(recorded.stdout).status, 'changes-requested');
  assert.ok(existsSync(join(request.directory, 'outcome.json')));
});
