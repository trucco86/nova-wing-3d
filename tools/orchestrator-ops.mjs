import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { sourceDigest } from './source-digest.mjs';
import { validationProblem } from './orchestrator.mjs';

const MAX_BYTES = 16 * 1024 * 1024;
const MAX_JSON = 256 * 1024;
const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const ID = /^[1-9][0-9]{0,15}$/;
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function repositoryName(value) {
  if (
    typeof value !== 'string' ||
    value.length > 201 ||
    !/^[A-Za-z0-9][A-Za-z0-9-]{0,99}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(value)
  )
    throw new Error('Repositório inválido: use owner/repository.');
  return value;
}

function git(root, args, allowFailure = false) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    timeout: 30000,
    maxBuffer: MAX_BYTES,
  });
  if (!allowFailure && (result.error || result.status !== 0))
    throw new Error(`Falha no git ${args[0]}.`);
  return result;
}

function safeFile(root, relative) {
  let current = root;
  for (const segment of relative.split('/')) {
    current = join(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink())
        throw new Error('Links simbólicos não são permitidos.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return current;
}

function context(root, kind) {
  root = resolve(root ?? process.cwd());
  if (realpathSync(root) !== root || !lstatSync(root).isDirectory())
    throw new Error('Root deve ser um diretório real, sem links simbólicos.');
  if (realpathSync(git(root, ['rev-parse', '--show-toplevel']).stdout.trim()) !== root)
    throw new Error('Root deve ser a raiz do repositório.');
  const commit = git(root, ['rev-parse', 'HEAD']).stdout.trim();
  if (!SHA.test(commit)) throw new Error('SHA local inválido.');
  const base = safeFile(root, 'artifacts/orchestrator/operations');
  if (
    git(root, ['check-ignore', '--quiet', 'artifacts/orchestrator/operations/probe.json'], true)
      .status !== 0
  )
    throw new Error('Relatórios de operação devem estar ignorados pelo Git.');
  mkdirSync(base, { recursive: true });
  const runId = randomUUID();
  const directory = join(base, runId);
  mkdirSync(directory);
  const started = new Date().toISOString();
  const source = sourceDigest(root);
  return {
    root,
    directory,
    finish(fields) {
      const finished = new Date().toISOString();
      const reportPath = join(directory, `${kind}.json`);
      const report = {
        schemaVersion: 1,
        kind,
        runId,
        commit,
        sourceDigest: source,
        started,
        finished,
        durationMs: Date.parse(finished) - Date.parse(started),
        releaseReady: false,
        ...fields,
        directory,
        reportPath,
      };
      writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
      return report;
    },
  };
}

function github(execute, root, args, binary = false) {
  let result;
  try {
    result = execute('gh', args, {
      cwd: root,
      encoding: binary ? null : 'utf8',
      shell: false,
      timeout: 30000,
      maxBuffer: MAX_BYTES,
      env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' },
    });
  } catch {
    return { state: 'unknown', reason: 'execution-failed', httpStatus: null };
  }
  if (!result || result.error || result.status !== 0) {
    const http = String(result?.stderr ?? '').match(/\b(?:HTTP\s+|status code\s+)(\d{3})\b/i);
    return {
      state: 'unknown',
      reason: !result || result.error ? 'execution-failed' : 'github-unavailable',
      httpStatus: http ? Number(http[1]) : null,
    };
  }
  if (Buffer.byteLength(result.stdout ?? '') > MAX_BYTES)
    return { state: 'unknown', reason: 'response-limit', httpStatus: null };
  try {
    return {
      state: 'observed',
      data: binary ? Buffer.from(result.stdout) : JSON.parse(result.stdout),
    };
  } catch {
    return { state: 'unknown', reason: 'invalid-json', httpStatus: null };
  }
}

const api = (execute, root, endpoint, binary = false) =>
  github(execute, root, ['api', '--method', 'GET', endpoint], binary);

function checksFromProtection(observation) {
  if (observation.state !== 'observed' || !observation.data || Array.isArray(observation.data))
    return null;
  const data = observation.data;
  if (
    (data.required_status_checks?.contexts != null &&
      !Array.isArray(data.required_status_checks.contexts)) ||
    (data.required_status_checks?.checks != null &&
      !Array.isArray(data.required_status_checks.checks))
  )
    return null;
  const contexts = [
    ...(data.required_status_checks?.contexts ?? []),
    ...(data.required_status_checks?.checks ?? []).map((check) => check?.context),
  ];
  const bypass = data.required_pull_request_reviews?.bypass_pull_request_allowances;
  return {
    quality: contexts.includes('quality'),
    browser: contexts.includes('browser'),
    pullRequest: data.required_pull_request_reviews != null,
    administrators: data.enforce_admins?.enabled === true,
    noBypass:
      bypass == null ||
      ['users', 'teams', 'apps'].every(
        (key) => Array.isArray(bypass[key]) && bypass[key].length === 0,
      ),
  };
}

/** Observe main protections; never writes GitHub rules or permissions. */
export function auditOperations({
  root,
  repository = 'trucco86/nova-wing-3d',
  execute = spawnSync,
} = {}) {
  repositoryName(repository);
  const run = context(root, 'operations-audit');
  const prefix = `repos/${repository}`;
  const protection = api(execute, run.root, `${prefix}/branches/main/protection`);
  const effectiveRules = api(execute, run.root, `${prefix}/rules/branches/main`);
  const rulesets = [];
  let rulesChecks = null;
  if (
    effectiveRules.state === 'observed' &&
    Array.isArray(effectiveRules.data) &&
    effectiveRules.data.length <= 100 &&
    effectiveRules.data.every(
      (rule) =>
        rule &&
        typeof rule === 'object' &&
        (!rule.parameters?.required_status_checks ||
          Array.isArray(rule.parameters.required_status_checks)),
    )
  ) {
    const ids = [...new Set(effectiveRules.data.map((rule) => rule.ruleset_id))];
    for (const id of ids.slice(0, 20)) {
      if (!ID.test(String(id))) {
        rulesets.push({ id: null, state: 'unknown', reason: 'invalid-ruleset-id' });
        continue;
      }
      rulesets.push({ id, ...api(execute, run.root, `${prefix}/rulesets/${id}`) });
    }
    const statuses = effectiveRules.data
      .filter((rule) => rule.type === 'required_status_checks')
      .flatMap((rule) => rule.parameters?.required_status_checks ?? []);
    const complete =
      ids.length > 0 &&
      ids.length <= 20 &&
      rulesets.every(
        (rule) =>
          rule.state === 'observed' &&
          rule.data?.enforcement === 'active' &&
          Array.isArray(rule.data?.bypass_actors),
      );
    rulesChecks = {
      quality: statuses.some((check) => check?.context === 'quality'),
      browser: statuses.some((check) => check?.context === 'browser'),
      pullRequest: effectiveRules.data.some((rule) => rule.type === 'pull_request'),
      administrators: complete && rulesets.every((rule) => rule.data.bypass_actors.length === 0),
      noBypass: complete && rulesets.every((rule) => rule.data.bypass_actors.length === 0),
    };
  }
  const classicChecks = checksFromProtection(protection);
  const complete = (checks) =>
    checks !== null && Object.values(checks).every((value) => value === true);
  // A complete independent protection suffices; missing APIs never establish a protection.
  const passed = complete(classicChecks) || complete(rulesChecks);
  const local = {};
  for (const path of ['AGENTS.md', '.github/workflows/ci.yml', 'tools/orchestrator-cli.mjs']) {
    const file = safeFile(run.root, path);
    local[path] =
      existsSync(file) && lstatSync(file).isFile()
        ? { present: true, sha256: sha256(readFileSync(file)) }
        : { present: false, sha256: null };
  }
  return run.finish({
    repository,
    branch: 'main',
    passed,
    status: passed ? 'observed' : 'blocked',
    local,
    checks: { classic: classicChecks, rulesets: rulesChecks },
    remote: { protection, effectiveRules, rulesets },
    reasons: passed
      ? []
      : ['Proteção completa de quality/browser, PR, administradores e bypass não comprovada.'],
    limitations: [
      'Auditoria pontual e somente leitura; não altera regras nem certifica autorização de publicação.',
    ],
  });
}

// Read only validation.json from the bounded ZIP, without extracting archive paths.
function validationFromZip(buffer) {
  if (buffer.length < 22) throw new Error('zip-invalid');
  let end = buffer.length - 22;
  while (end >= Math.max(0, buffer.length - 65557) && buffer.readUInt32LE(end) !== 0x06054b50)
    end--;
  if (end < Math.max(0, buffer.length - 65557)) throw new Error('zip-invalid');
  if (
    buffer.readUInt16LE(end + 4) !== 0 ||
    buffer.readUInt16LE(end + 6) !== 0 ||
    buffer.readUInt16LE(end + 8) !== buffer.readUInt16LE(end + 10) ||
    end + 22 + buffer.readUInt16LE(end + 20) !== buffer.length
  )
    throw new Error('zip-unsupported');
  const count = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);
  const centralEnd = cursor + buffer.readUInt32LE(end + 12);
  if (count > 4096 || centralEnd !== end) throw new Error('zip-limit');
  let evidence;
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > centralEnd || buffer.readUInt32LE(cursor) !== 0x02014b50)
      throw new Error('zip-invalid');
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressed = buffer.readUInt32LE(cursor + 20);
    const size = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extra = buffer.readUInt16LE(cursor + 30);
    const comment = buffer.readUInt16LE(cursor + 32);
    const mode = buffer.readUInt32LE(cursor + 38) >>> 16;
    const offset = buffer.readUInt32LE(cursor + 42);
    const next = cursor + 46 + nameLength + extra + comment;
    if (next > centralEnd) throw new Error('zip-invalid');
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    if (
      name.startsWith('/') ||
      name.includes('\\') ||
      name.split('/').some((part) => part === '..')
    )
      throw new Error('zip-path');
    if (name === 'validation.json' || name === 'artifacts/validation.json') {
      if (
        evidence ||
        flags & 1 ||
        (mode & 0xf000) === 0xa000 ||
        ![0, 8].includes(method) ||
        size > MAX_JSON ||
        compressed > MAX_JSON ||
        offset + 30 > cursor ||
        buffer.readUInt32LE(offset) !== 0x04034b50
      )
        throw new Error('zip-evidence-invalid');
      const start =
        offset + 30 + buffer.readUInt16LE(offset + 26) + buffer.readUInt16LE(offset + 28);
      if (start + compressed > cursor) throw new Error('zip-invalid');
      const bytes = buffer.subarray(start, start + compressed);
      const value = method === 8 ? inflateRawSync(bytes, { maxOutputLength: MAX_JSON }) : bytes;
      if (value.length !== size) throw new Error('zip-size');
      evidence = JSON.parse(value.toString('utf8'));
    }
    cursor = next;
  }
  if (cursor !== centralEnd || !evidence) throw new Error('validation-missing');
  return evidence;
}

function qualityArtifact(execute, root, repository, githubRunId) {
  const list = api(
    execute,
    root,
    `repos/${repository}/actions/runs/${githubRunId}/artifacts?per_page=100`,
  );
  if (list.state !== 'observed') return list;
  const artifacts = list.data?.artifacts;
  if (!Array.isArray(artifacts) || list.data.total_count > 100)
    return { state: 'unknown', reason: 'artifact-list-limit' };
  const matches = artifacts.filter((entry) => entry?.name === 'quality-evidence');
  if (
    matches.length !== 1 ||
    matches[0].expired ||
    !ID.test(String(matches[0].id)) ||
    !Number.isSafeInteger(matches[0].size_in_bytes) ||
    matches[0].size_in_bytes < 1 ||
    matches[0].size_in_bytes > MAX_BYTES ||
    String(matches[0].workflow_run?.id) !== githubRunId
  )
    return { state: 'unknown', reason: 'quality-artifact-unavailable' };
  const artifact = matches[0];
  const download = api(
    execute,
    root,
    `repos/${repository}/actions/artifacts/${artifact.id}/zip`,
    true,
  );
  if (download.state !== 'observed') return download;
  try {
    return {
      state: 'observed',
      artifactId: artifact.id,
      archiveSha256: sha256(download.data),
      validation: validationFromZip(download.data),
    };
  } catch {
    return { state: 'unknown', artifactId: artifact.id, reason: 'invalid-quality-artifact' };
  }
}

/** Observe one immutable CI identity, including the source digest from quality evidence. */
export function observeCI({
  root,
  githubRunId,
  expectedCommit,
  expectedDigest,
  repository = 'trucco86/nova-wing-3d',
  execute = spawnSync,
} = {}) {
  repositoryName(repository);
  githubRunId = String(githubRunId ?? '');
  if (!ID.test(githubRunId) || !Number.isSafeInteger(Number(githubRunId)))
    throw new Error('ID de execução GitHub inválido.');
  if (
    typeof expectedCommit !== 'string' ||
    typeof expectedDigest !== 'string' ||
    !SHA.test(expectedCommit) ||
    !DIGEST.test(expectedDigest)
  )
    throw new Error('SHA e digest completos são obrigatórios.');
  const run = context(root, 'ci-observation');
  const observation = github(execute, run.root, [
    'run',
    'view',
    githubRunId,
    '--repo',
    repository,
    '--json',
    'databaseId,headSha,status,conclusion,jobs,url,createdAt,updatedAt,workflowName',
  ]);
  writeFileSync(
    join(run.directory, 'github-run.json'),
    JSON.stringify(observation, null, 2) + '\n',
    { flag: 'wx' },
  );
  const data = observation.data;
  const jobs = Array.isArray(data?.jobs) && data.jobs.length <= 200 ? data.jobs : [];
  const reasons = [];
  let status = 'pending';
  let qualityEvidence = { state: 'unknown', reason: 'run-not-completed' };
  if (observation.state !== 'observed') {
    status = 'blocked';
    reasons.push('Execução GitHub indisponível.');
  } else if (
    String(data.databaseId) !== githubRunId ||
    data.headSha !== expectedCommit ||
    !Array.isArray(data.jobs) ||
    data.jobs.length > 200 ||
    !['queued', 'in_progress', 'completed', 'waiting', 'requested', 'pending'].includes(data.status)
  ) {
    status = 'blocked';
    reasons.push('Identidade, SHA ou estrutura da execução divergente.');
  } else if (data.status !== 'completed') {
    reasons.push('Execução ainda não terminou.');
  } else {
    const required = [
      'quality',
      'browser',
      ...[1, 2, 3, 4].map((index) => `browser-shard (${index})`),
    ];
    for (const name of required) {
      const found = jobs.filter((job) => job?.name === name);
      if (
        found.length !== 1 ||
        found[0].status !== 'completed' ||
        found[0].conclusion !== 'success'
      )
        reasons.push(`Gate obrigatório ausente ou sem sucesso: ${name}.`);
    }
    if (data.conclusion !== 'success') reasons.push('Conclusão da execução não é success.');
    qualityEvidence = qualityArtifact(execute, run.root, repository, githubRunId);
    const validation = qualityEvidence.validation;
    if (
      qualityEvidence.state !== 'observed' ||
      validationProblem(
        validation,
        { commit: expectedCommit, sourceDigest: expectedDigest, browserRequired: false },
        data.createdAt,
      )
    )
      reasons.push('Evidência quality ausente, incompleta ou divergente de SHA/digest.');
    status = reasons.length ? 'blocked' : 'ci-passed';
  }
  return run.finish({
    repository,
    githubRunId,
    expectedCommit,
    expectedDigest,
    status,
    passed: status === 'ci-passed',
    jobs,
    githubRun: observation,
    qualityEvidence,
    reasons,
    limitations: [
      'Observação pontual de CI; sem disparo, merge, deploy ou homologação de produção.',
    ],
  });
}

/** Exercise syntax failure and git restore in a disposable detached HEAD worktree. */
export function recoveryDrill({ root } = {}) {
  const run = context(root, 'recovery-drill');
  const target = 'tools/orchestrator-cli.mjs';
  const originalPath = safeFile(run.root, target);
  if (!lstatSync(originalPath).isFile()) throw new Error('CLI deve ser um arquivo regular.');
  const originalHash = sha256(readFileSync(originalPath));
  const originalHead = git(run.root, ['rev-parse', 'HEAD']).stdout.trim();
  const originalStatus = git(run.root, ['status', '--porcelain=v1', '--', target]).stdout;
  const temporary = mkdtempSync(join(realpathSync(tmpdir()), 'nw-recovery-'));
  const checkout = join(temporary, 'checkout');
  const facts = {
    originalHash,
    originalHead,
    originalStatus,
    temporary,
    checkout,
    detected: false,
    restored: false,
    originalIntact: false,
    cleanup: false,
  };
  const reasons = [];
  let registered = false;
  try {
    git(run.root, ['worktree', 'add', '--detach', checkout, originalHead]);
    registered = true;
    const copy = safeFile(checkout, target);
    if (!lstatSync(copy).isFile()) throw new Error('CLI isolado inválido.');
    const baseline = readFileSync(copy);
    facts.baselineHash = sha256(baseline);
    const check = () => {
      const result = spawnSync(process.execPath, ['--check', copy], {
        cwd: checkout,
        shell: false,
        encoding: 'utf8',
        timeout: 10000,
        maxBuffer: MAX_JSON,
      });
      return { exitCode: result.status, error: result.error ? 'execution-failed' : null };
    };
    facts.baseline = check();
    if (facts.baseline.exitCode !== 0 || facts.baseline.error)
      throw new Error('CLI base não passa no node --check.');
    writeFileSync(
      copy,
      Buffer.concat([baseline, Buffer.from('\nfunction deliberatelyBroken( {\n')]),
    );
    facts.failure = check();
    facts.detected =
      facts.failure.exitCode !== null && facts.failure.exitCode !== 0 && !facts.failure.error;
    git(checkout, ['restore', '--source', originalHead, '--worktree', '--', target]);
    facts.recovery = check();
    facts.recoveredHash = sha256(readFileSync(copy));
    facts.checkoutStatus = git(checkout, [
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
    ]).stdout;
    facts.restored =
      facts.recoveredHash === facts.baselineHash &&
      facts.recovery.exitCode === 0 &&
      !facts.recovery.error &&
      facts.checkoutStatus === '';
  } catch (error) {
    reasons.push(error.message);
  } finally {
    if (registered) {
      const result = git(run.root, ['worktree', 'remove', '--force', checkout], true);
      facts.cleanup = !result.error && result.status === 0;
    } else facts.cleanup = !existsSync(checkout);
    // Remove only our mkdtemp parent after Git detached its registration.
    if (facts.cleanup) rmSync(temporary, { recursive: true, force: true });
    facts.cleanup = facts.cleanup && !existsSync(temporary);
  }
  facts.originalHashAfter = sha256(readFileSync(originalPath));
  facts.originalHeadAfter = git(run.root, ['rev-parse', 'HEAD']).stdout.trim();
  facts.originalStatusAfter = git(run.root, ['status', '--porcelain=v1', '--', target]).stdout;
  facts.originalIntact =
    facts.originalHashAfter === originalHash &&
    facts.originalHeadAfter === originalHead &&
    facts.originalStatusAfter === originalStatus;
  const passed =
    facts.detected &&
    facts.restored &&
    facts.originalIntact &&
    facts.cleanup &&
    reasons.length === 0;
  return run.finish({
    status: passed ? 'recovered' : 'blocked',
    passed,
    facts,
    reasons,
    limitations: [
      'Ensaio local do CLI versionado em HEAD; alterações não commitadas não são copiadas.',
      'Detecta falha de sintaxe e restaura arquivo isolado; não comprova rollback de produção ou recuperação de dados.',
      'Integridade original cobre HEAD e hash/status do CLI; outros arquivos podem mudar por trabalho concorrente.',
    ],
  });
}
