import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { deflateRawSync } from 'node:zlib';
import { auditOperations, observeCI, recoveryDrill } from '../tools/orchestrator-ops.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'nw-ops-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tools'));
  mkdirSync(join(root, '.github/workflows'), { recursive: true });
  writeFileSync(join(root, 'tools/orchestrator-cli.mjs'), 'console.log("fixture");\n');
  writeFileSync(join(root, '.github/workflows/ci.yml'), 'jobs: {}\n');
  writeFileSync(join(root, 'AGENTS.md'), '# Fixture\n');
  writeFileSync(join(root, '.gitignore'), 'artifacts/\n');
  for (const args of [
    ['init', '-q'],
    ['add', '.'],
    [
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-qm',
      'fixture',
    ],
  ])
    assert.equal(spawnSync('git', args, { cwd: root }).status, 0);
  return {
    root,
    commit: spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim(),
  };
}

const ok = (data) => ({ status: 0, stdout: Buffer.isBuffer(data) ? data : JSON.stringify(data) });
const unavailable = (code = 403) => ({
  status: 1,
  stderr: `gh: unavailable (HTTP ${code}) sensitive-sentinel`,
});
const protection = (changes = {}) => ({
  required_status_checks: { contexts: ['quality', 'browser'] },
  required_pull_request_reviews: {},
  enforce_admins: { enabled: true },
  ...changes,
});

function fake(routes) {
  const calls = [];
  const execute = (command, args, settings) => {
    assert.equal(command, 'gh');
    assert.equal(settings.shell, false);
    assert.equal(settings.timeout, 30000);
    assert.ok(settings.maxBuffer <= 16 * 1024 * 1024);
    if (args[0] === 'api') assert.deepEqual(args.slice(0, 3), ['api', '--method', 'GET']);
    else assert.deepEqual(args.slice(0, 2), ['run', 'view']);
    calls.push(args);
    const route = args[0] === 'api' ? args[3] : 'run';
    return routes[route] ?? unavailable(404);
  };
  return { execute, calls };
}

test('audit observes complete classic protection and preserves local evidence', (t) => {
  const { root } = fixture(t);
  const { execute, calls } = fake({
    'repos/o/r/branches/main/protection': ok(protection()),
    'repos/o/r/rules/branches/main': ok([]),
  });
  const result = auditOperations({ root, repository: 'o/r', execute });
  assert.equal(result.passed, true);
  assert.equal(result.status, 'observed');
  assert.equal(result.releaseReady, false);
  assert.equal(result.local['tools/orchestrator-cli.mjs'].present, true);
  assert.deepEqual(JSON.parse(readFileSync(result.reportPath)), result);
  assert.equal(calls.length, 2);
});

test('audit never treats unavailable, malformed, incomplete or bypassed rules as protection', (t) => {
  const { root } = fixture(t);
  for (const response of [
    unavailable(403),
    unavailable(404),
    ok(null),
    ok({}),
    ok(protection({ enforce_admins: { enabled: false } })),
    ok(protection({ required_status_checks: { contexts: 'quality browser' } })),
    ok(
      protection({
        required_pull_request_reviews: {
          bypass_pull_request_allowances: { users: [{ login: 'admin' }], teams: [], apps: [] },
        },
      }),
    ),
  ]) {
    const { execute } = fake({ 'repos/o/r/branches/main/protection': response });
    const result = auditOperations({ root, repository: 'o/r', execute });
    assert.equal(result.status, 'blocked');
    assert.equal(result.passed, false);
    assert.ok(!readFileSync(result.reportPath, 'utf8').includes('sensitive-sentinel'));
  }
});

test('effective rulesets require active enforcement and verified absence of bypass actors', (t) => {
  const { root } = fixture(t);
  const rules = [
    { ruleset_id: 12, type: 'pull_request' },
    {
      ruleset_id: 12,
      type: 'required_status_checks',
      parameters: { required_status_checks: [{ context: 'quality' }, { context: 'browser' }] },
    },
  ];
  for (const [details, expected] of [
    [ok({ enforcement: 'active', bypass_actors: [] }), true],
    [ok({ enforcement: 'evaluate', bypass_actors: [] }), false],
    [ok({ enforcement: 'active', bypass_actors: [{ actor_type: 'OrganizationAdmin' }] }), false],
    [unavailable(), false],
  ]) {
    const { execute } = fake({
      'repos/o/r/rules/branches/main': ok(rules),
      'repos/o/r/rulesets/12': details,
    });
    assert.equal(auditOperations({ root, repository: 'o/r', execute }).passed, expected);
  }
});

function zip(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const { name = 'validation.json', data, symlink = false, method = 8 } of entries) {
    const bytes = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    const compressed = method === 8 ? deflateRawSync(bytes) : bytes;
    const filename = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(filename.length, 26);
    locals.push(local, filename, compressed);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50);
    record.writeUInt16LE(method, 10);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(bytes.length, 24);
    record.writeUInt16LE(filename.length, 28);
    if (symlink) record.writeUInt32LE(0xa000 * 65536, 38);
    record.writeUInt32LE(offset, 42);
    central.push(record, filename);
    offset += local.length + filename.length + compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

function ciFixture(t, changes = {}, validationChanges = {}, archive) {
  const { root, commit } = fixture(t);
  const expectedDigest = 'a'.repeat(64);
  const now = new Date().toISOString();
  const data = {
    databaseId: 123,
    headSha: commit,
    status: 'completed',
    conclusion: 'success',
    createdAt: '2000-01-01T00:00:00Z',
    jobs: ['quality', 'browser', ...[1, 2, 3, 4].map((index) => `browser-shard (${index})`)].map(
      (name) => ({ name, status: 'completed', conclusion: 'success' }),
    ),
    ...changes,
  };
  const validation = {
    commit,
    sourceDigest: expectedDigest,
    passed: true,
    started: now,
    finished: now,
    checks: ['format:check', 'lint', 'test', 'check:repo', 'build:check'].map((command) => ({
      command,
      exitCode: 0,
      error: null,
    })),
    ...validationChanges,
  };
  const bytes = archive ? archive(validation) : zip([{ data: validation }]);
  const routes = {
    run: ok(data),
    'repos/o/r/actions/runs/123/artifacts?per_page=100': ok({
      total_count: 1,
      artifacts: [
        {
          id: 456,
          name: 'quality-evidence',
          expired: false,
          size_in_bytes: bytes.length,
          workflow_run: { id: 123 },
        },
      ],
    }),
    'repos/o/r/actions/artifacts/456/zip': ok(bytes),
  };
  const { execute, calls } = fake(routes);
  return {
    options: {
      root,
      repository: 'o/r',
      githubRunId: '123',
      expectedCommit: commit,
      expectedDigest,
      execute,
    },
    routes,
    calls,
  };
}

test('CI passes only with exact SHA, six successful gates and digest from quality artifact', (t) => {
  const { options, calls } = ciFixture(t);
  const result = observeCI(options);
  assert.equal(result.status, 'ci-passed');
  assert.equal(result.passed, true);
  assert.equal(result.releaseReady, false);
  assert.equal(result.qualityEvidence.validation.sourceDigest, options.expectedDigest);
  assert.equal(result.jobs.length, 6);
  assert.equal(calls.length, 3);
  assert.equal(existsSync(join(result.directory, 'github-run.json')), true);
});

test('CI distinguishes unfinished run from blocked SHA, jobs and contradictory quality evidence', (t) => {
  for (const [changes, validationChanges, expected] of [
    [{ status: 'in_progress', conclusion: '' }, {}, 'pending'],
    [{ headSha: 'f'.repeat(40) }, {}, 'blocked'],
    [{ databaseId: 124 }, {}, 'blocked'],
    [{ jobs: [] }, {}, 'blocked'],
    [{ conclusion: 'failure' }, {}, 'blocked'],
    [{}, { sourceDigest: 'b'.repeat(64) }, 'blocked'],
    [{}, { commit: 'f'.repeat(40) }, 'blocked'],
    [{}, { passed: false }, 'blocked'],
    [{}, { started: '2099-01-01T00:00:00Z', finished: '2099-01-01T00:00:00Z' }, 'blocked'],
    [{}, { checks: [] }, 'blocked'],
  ]) {
    const { options, calls } = ciFixture(t, changes, validationChanges);
    const result = observeCI(options);
    assert.equal(result.status, expected);
    assert.equal(result.passed, false);
    if (expected === 'pending') assert.equal(calls.length, 1);
  }
});

test('CI rejects missing, duplicate, skipped and failed shards even if browser aggregator is green', (t) => {
  for (const mode of ['missing', 'duplicate', 'skipped', 'failure']) {
    const { options, routes } = ciFixture(t);
    const data = JSON.parse(routes.run.stdout);
    if (mode === 'missing') data.jobs.pop();
    else if (mode === 'duplicate') data.jobs.push(data.jobs.at(-1));
    else data.jobs.at(-1).conclusion = mode;
    routes.run = ok(data);
    assert.equal(observeCI(options).status, 'blocked');
  }
});

test('CI cannot certify missing/expired/foreign/oversized artifacts or GitHub failures', (t) => {
  for (const mode of [
    'missing',
    'expired',
    'foreign',
    'oversized',
    '403',
    'download',
    'malformed',
  ]) {
    const { options, routes } = ciFixture(t);
    const key = 'repos/o/r/actions/runs/123/artifacts?per_page=100';
    const list = JSON.parse(routes[key].stdout);
    if (mode === 'missing') list.artifacts = [];
    if (mode === 'expired') list.artifacts[0].expired = true;
    if (mode === 'foreign') list.artifacts[0].workflow_run.id = 999;
    if (mode === 'oversized') list.artifacts[0].size_in_bytes = 17 * 1024 * 1024;
    routes[key] = ok(list);
    if (mode === '403') routes.run = unavailable();
    if (mode === 'download') routes['repos/o/r/actions/artifacts/456/zip'] = unavailable();
    if (mode === 'malformed') routes.run = { status: 0, stdout: 'garbage' };
    assert.equal(observeCI(options).status, 'blocked');
  }
});

test('quality ZIP is bounded and paths, symlinks, duplicate evidence and bad archives are rejected', (t) => {
  for (const build of [
    () => Buffer.from('not zip'),
    (data) => zip([{ name: '../validation.json', data }]),
    (data) => zip([{ name: '/validation.json', data }]),
    (data) => zip([{ data, symlink: true }]),
    (data) => zip([{ data }, { data }]),
    () => zip([{ data: 'x'.repeat(256 * 1024 + 1) }]),
    () => zip([{ name: 'other.json', data: {} }]),
  ]) {
    const { options } = ciFixture(t, {}, {}, build);
    assert.equal(observeCI(options).status, 'blocked');
    assert.equal(existsSync(join(options.root, 'validation.json')), false);
  }
});

test('IDs, repository names and report paths reject option injection and symlink escapes', (t) => {
  const { options } = ciFixture(t);
  for (const githubRunId of ['--help', '123;touch PWNED', '../123', '0', '9'.repeat(20)])
    assert.throws(() => observeCI({ ...options, githubRunId }));
  for (const repository of ['--help', 'o/r/other', 'o/r;touch', '../r'])
    assert.throws(() => auditOperations({ root: options.root, repository }));
  assert.throws(() => observeCI({ ...options, expectedCommit: 'HEAD' }));
  assert.throws(() => observeCI({ ...options, expectedDigest: 'abc' }));
  const outside = mkdtempSync(join(tmpdir(), 'nw-ops-outside-'));
  t.after(() => rmSync(outside, { recursive: true, force: true }));
  symlinkSync(outside, join(options.root, 'artifacts'));
  const before = spawnSync('git', ['status', '--porcelain'], {
    cwd: options.root,
    encoding: 'utf8',
  }).stdout;
  assert.throws(
    () =>
      auditOperations({ root: options.root, execute: () => assert.fail('must reject before gh') }),
    /simbólicos/,
  );
  assert.equal(
    spawnSync('git', ['status', '--porcelain'], { cwd: options.root, encoding: 'utf8' }).stdout,
    before,
  );
});

test('unignored reports are refused before remote calls', (t) => {
  const { root } = fixture(t);
  writeFileSync(join(root, '.gitignore'), '');
  assert.throws(
    () => auditOperations({ root, execute: () => assert.fail('no remote call') }),
    /ignorados/,
  );
});

test('real recovery detects corruption, restores committed CLI and removes only its own worktree', (t) => {
  const { root } = fixture(t);
  const path = join(root, 'tools/orchestrator-cli.mjs');
  writeFileSync(path, 'console.log("uncommitted work must survive");\n');
  const before = readFileSync(path, 'utf8');
  const worktreesBefore = spawnSync('git', ['worktree', 'list', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  }).stdout;
  const result = recoveryDrill({ root });
  assert.equal(result.status, 'recovered');
  assert.equal(result.passed, true);
  assert.equal(result.facts.detected, true);
  assert.equal(result.facts.restored, true);
  assert.equal(result.facts.originalIntact, true);
  assert.equal(result.facts.cleanup, true);
  assert.equal(existsSync(result.facts.temporary), false);
  assert.equal(readFileSync(path, 'utf8'), before);
  assert.equal(
    spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout,
    worktreesBefore,
  );
});

test('recovery refuses symlinked CLI before worktree creation', (t) => {
  const { root } = fixture(t);
  const path = join(root, 'tools/orchestrator-cli.mjs');
  rmSync(path);
  symlinkSync('../AGENTS.md', path);
  assert.throws(() => recoveryDrill({ root }), /simbólicos/);
});
