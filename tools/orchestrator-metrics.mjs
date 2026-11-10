import { randomUUID } from 'node:crypto';
import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const time = (value) => (typeof value === 'string' ? Date.parse(value) : NaN);
const elapsed = (start, end) => {
  const value = time(end) - time(start);
  return Number.isFinite(value) && value >= 0 ? value : null;
};
const duration = (record) => {
  const measured = elapsed(
    record.started ?? record.startedAt,
    record.finished ?? record.finishedAt,
  );
  return (
    measured ??
    (Number.isFinite(record.durationMs) && record.durationMs >= 0 ? record.durationMs : null)
  );
};

function distribution(samples) {
  const values = samples.filter((value) => value !== null).sort((a, b) => a - b);
  const percentile = (p) => values[Math.ceil(values.length * p) - 1] ?? null;
  return {
    count: values.length,
    missing: samples.length - values.length,
    p50: percentile(0.5),
    p95: percentile(0.95),
    samples: values,
  };
}

/** Pure queue summary. Repeated attempts are observed retries, not inferred human effort. */
export function summarizeJobs(jobs = []) {
  if (!Array.isArray(jobs)) throw new TypeError('jobs deve ser um array.');
  const seen = new Set();
  const samples = [];
  let duplicates = 0;
  let invalid = 0;
  for (const job of jobs) {
    if (!object(job) || typeof job.id !== 'string' || !job.id || !Array.isArray(job.attempts)) {
      invalid++;
      continue;
    }
    if (seen.has(job.id)) {
      duplicates++;
      continue;
    }
    seen.add(job.id);
    let available = job.createdAt;
    const attempts = job.attempts.map((attempt, index) => {
      if (!object(attempt)) {
        invalid++;
        return { index: index + 1, durationMs: null, waitMs: null, outcome: null };
      }
      const started = attempt.startedAt ?? attempt.started;
      const finished = attempt.finishedAt ?? attempt.finished;
      const result = {
        index: index + 1,
        durationMs: duration(attempt),
        waitMs: elapsed(available, started),
        outcome: attempt.outcome ?? attempt.result ?? null,
      };
      available = finished ?? attempt.expiresAt;
      return result;
    });
    samples.push({
      id: job.id,
      taskId: job.taskId ?? null,
      kind: job.kind ?? null,
      status: job.status ?? null,
      attempts,
      initialWaitMs: attempts[0]?.waitMs ?? null,
    });
  }
  const attempts = samples.flatMap((job) => job.attempts);
  return {
    count: samples.length,
    duplicates,
    invalid,
    pending: samples.filter((job) => ['queued', 'running', 'waiting-review'].includes(job.status))
      .length,
    statuses: Object.fromEntries(
      [...new Set(samples.map((job) => job.status ?? 'unknown'))].map((status) => [
        status,
        samples.filter((job) => (job.status ?? 'unknown') === status).length,
      ]),
    ),
    attempts: attempts.length,
    retries: samples.reduce((sum, job) => sum + Math.max(0, job.attempts.length - 1), 0),
    failedJobs: samples.filter((job) => ['failed', 'blocked', 'exhausted'].includes(job.status))
      .length,
    failedAttempts: attempts.filter((attempt) =>
      ['failed', 'blocked', 'expired', 'timeout', 'interrupted'].includes(attempt.outcome),
    ).length,
    durationsMs: distribution(attempts.map((attempt) => attempt.durationMs)),
    waitsMs: distribution(attempts.map((attempt) => attempt.waitMs)),
    samples,
  };
}

// Inspect every ancestor beneath the canonical root; never follow evidence symlinks.
function safePath(root, segments, create = false) {
  let path = root;
  for (const segment of segments) {
    path = join(path, segment);
    try {
      const stat = lstatSync(path);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new Error(`Diretório de artefatos inválido: ${relative(root, path)}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!create) return null;
      mkdirSync(path);
    }
  }
  return path;
}

export function collectMetrics({ root = process.cwd(), jobs = [] } = {}) {
  root = realpathSync(resolve(root));
  const samples = { validations: [], reviews: [], ci: [], checks: [], ciJobs: [], ciRuns: [] };
  const ignored = [];
  const sources = [];
  const seen = new Set();
  const base = safePath(root, ['artifacts', 'orchestrator']);
  const directories = (path) =>
    !path
      ? []
      : readdirSync(path, { withFileTypes: true })
          .filter(
            (entry) => uuid.test(entry.name) && entry.isDirectory() && !entry.isSymbolicLink(),
          )
          .map((entry) => entry.name)
          .sort();
  const read = (directory, name) => {
    const file = join(directory, name);
    try {
      const stat = lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 262144)
        throw new Error('Arquivo inválido ou maior que 256 KiB.');
      const record = JSON.parse(readFileSync(file, 'utf8'));
      if (!object(record)) throw new Error('JSON deve ser objeto.');
      return record;
    } catch (error) {
      if (error.code !== 'ENOENT')
        ignored.push({ path: relative(root, file), reason: error.message });
      return null;
    }
  };
  const add = (kind, record, path, id, expectedId) => {
    if (!record) return;
    if (
      record.schemaVersion !== 1 ||
      (expectedId && record.runId !== expectedId) ||
      typeof id !== 'string'
    ) {
      ignored.push({ path, reason: 'Schema ou identidade divergente.' });
      return;
    }
    const identity = `${kind}:${id}`;
    if (seen.has(identity)) {
      ignored.push({ path, reason: 'Identidade duplicada.' });
      return;
    }
    seen.add(identity);
    sources.push(path);
    samples[kind].push({
      id,
      stage: record.command ?? record.name ?? null,
      source: path,
      commit: record.commit ?? record.expectedCommit ?? null,
      sourceDigest: record.sourceDigest ?? record.expectedDigest ?? null,
      status: record.status ?? null,
      passed: typeof record.passed === 'boolean' ? record.passed : null,
      durationMs: duration(record),
      reason: record.reason ?? null,
    });
  };
  const ciJobs = (directory, observation, identity, raw) => {
    const data = object(raw?.data) ? raw.data : raw;
    const records = Array.isArray(data?.jobs)
      ? data.jobs
      : Array.isArray(observation?.jobs)
        ? observation.jobs
        : [];
    const source = relative(
      root,
      join(directory, Array.isArray(data?.jobs) ? 'github-run.json' : 'ci-observation.json'),
    );
    if (data?.databaseId && String(data.databaseId) === identity) {
      add(
        'ciRuns',
        {
          schemaVersion: 1,
          commit: data.headSha,
          sourceDigest: observation?.sourceDigest ?? observation?.expectedDigest,
          started: data.createdAt,
          finished: data.status === 'completed' ? data.updatedAt : null,
          status: data.conclusion || data.status,
          passed:
            data.status === 'completed' && data.conclusion ? data.conclusion === 'success' : null,
        },
        relative(root, join(directory, 'github-run.json')),
        identity,
      );
    }
    const names = new Set();
    for (const job of records) {
      if (!object(job) || typeof job.name !== 'string') continue;
      const key = `${identity}:${job.databaseId ?? job.name}`;
      if (names.has(key) || seen.has(`ciJobs:${key}`)) continue;
      names.add(key);
      add(
        'ciJobs',
        {
          schemaVersion: 1,
          ...job,
          started: job.startedAt,
          finished: job.completedAt,
          status: job.conclusion || job.status || null,
          passed:
            job.status === 'completed' &&
            job.conclusion &&
            !['skipped', 'neutral'].includes(job.conclusion)
              ? job.conclusion === 'success'
              : null,
        },
        source,
        key,
      );
    }
  };
  const observeCI = (directory, runId, expectedId) => {
    const observation = read(directory, 'ci-observation.json');
    const raw = read(directory, 'github-run.json');
    const data = object(raw?.data) ? raw.data : raw;
    const identity = String(observation?.githubRunId ?? data?.databaseId ?? runId);
    add(
      'ci',
      observation,
      relative(root, join(directory, 'ci-observation.json')),
      identity,
      expectedId,
    );
    if (data?.databaseId && String(data.databaseId) !== identity) {
      ignored.push({
        path: relative(root, join(directory, 'github-run.json')),
        reason: 'Identidade CI divergente da observação.',
      });
      return;
    }
    ciJobs(directory, observation, identity, raw);
  };
  for (const runId of directories(base)) {
    const directory = safePath(root, ['artifacts', 'orchestrator', runId]);
    const handoff = read(directory, 'handoff.json');
    add('validations', handoff, relative(root, join(directory, 'handoff.json')), runId, runId);
    const validation = read(directory, 'validation.json');
    if (
      handoff?.schemaVersion === 1 &&
      handoff?.runId === runId &&
      validation?.commit === handoff?.commit &&
      validation?.sourceDigest === handoff?.sourceDigest &&
      Array.isArray(validation?.checks)
    ) {
      const commands = new Set();
      for (const check of validation.checks) {
        if (!object(check) || typeof check.command !== 'string' || commands.has(check.command))
          continue;
        commands.add(check.command);
        add(
          'checks',
          {
            ...check,
            schemaVersion: 1,
            commit: validation.commit,
            sourceDigest: validation.sourceDigest,
            passed: Number.isInteger(check.exitCode) ? check.exitCode === 0 && !check.error : null,
          },
          relative(root, join(directory, 'validation.json')),
          `${runId}:${check.command}`,
        );
      }
    }
    const reviews = safePath(root, ['artifacts', 'orchestrator', runId, 'reviews']);
    for (const requestId of directories(reviews)) {
      const reviewDirectory = safePath(root, [
        'artifacts',
        'orchestrator',
        runId,
        'reviews',
        requestId,
      ]);
      const outcome = read(reviewDirectory, 'outcome.json');
      const request = read(reviewDirectory, 'request.json');
      if (
        outcome &&
        outcome.requestId === requestId &&
        request?.requestId === requestId &&
        request.runId === runId
      ) {
        sources.push(relative(root, join(reviewDirectory, 'request.json')));
        add(
          'reviews',
          { ...outcome, started: request.created, finished: outcome.recorded },
          relative(root, join(reviewDirectory, 'outcome.json')),
          requestId,
          runId,
        );
      } else if (outcome)
        ignored.push({
          path: relative(root, reviewDirectory),
          reason: 'Solicitação de revisão ausente ou divergente.',
        });
    }
    const ci = safePath(root, ['artifacts', 'orchestrator', runId, 'ci']);
    if (ci) {
      observeCI(ci, runId);
    }
  }
  const operations = safePath(root, ['artifacts', 'orchestrator', 'operations']);
  for (const runId of directories(operations)) {
    const directory = safePath(root, ['artifacts', 'orchestrator', 'operations', runId]);
    observeCI(directory, runId, runId);
  }
  const queue = summarizeJobs(jobs);
  const reportId = randomUUID();
  const directory = safePath(root, ['artifacts', 'orchestrator', 'metrics', reportId], true);
  const reportPath = join(directory, 'metrics.json');
  const report = {
    schemaVersion: 1,
    kind: 'orchestrator-metrics',
    reportId,
    generatedAt: new Date().toISOString(),
    sampleCounts: Object.fromEntries(
      Object.entries(samples).map(([kind, records]) => [kind, records.length]),
    ),
    sources: [...new Set(sources)],
    samples,
    durationsMs: Object.fromEntries(
      Object.entries(samples).map(([kind, records]) => [
        kind,
        distribution(records.map((record) => record.durationMs)),
      ]),
    ),
    byStage: Object.fromEntries(
      [...new Set([...samples.checks, ...samples.ciJobs].map((record) => record.stage))].map(
        (stage) => [
          stage,
          distribution(
            [...samples.checks, ...samples.ciJobs]
              .filter((record) => record.stage === stage)
              .map((record) => record.durationMs),
          ),
        ],
      ),
    ),
    failures: Object.fromEntries(
      Object.entries(samples).map(([kind, records]) => [
        kind,
        records
          .filter(
            (record) =>
              record.passed === false ||
              ['blocked', 'failed', 'changes-requested', 'ci-failed'].includes(record.status),
          )
          .map((record) => ({
            id: record.id,
            status: record.status,
            reason: record.reason,
            source: record.source,
          })),
      ]),
    ),
    rework: {
      queueRetries: queue.retries,
      reviewChangesRequested: samples.reviews.filter(
        (record) => record.status === 'changes-requested',
      ).length,
    },
    queue,
    ignored,
    unavailable: { cost: null, tokens: null, humanTimeMs: null },
    limitations: [
      'Amostra local observada; arquivos ausentes, pendências e durações desconhecidas não equivalem a sucesso ou zero.',
      'Percentis pelo posto mais próximo; amostra pequena não sustenta comparação longitudinal, ROI ou causalidade de produtividade.',
      'Retentativas e pedidos de mudança são retrabalho observado; não medem esforço humano.',
      'Custos, tokens e tempo humano sem recibos ou fonte observável permanecem null.',
      'Somente artefatos conhecidos sob diretórios UUID são lidos; JSON inválido é registrado em ignored.',
      'ci mede a observação local; ciRuns mede createdAt até updatedAt de execuções concluídas. Não representa tempo ativo de CPU.',
      'FAST e preview sem artefatos preservados no diretório permitido não têm amostras; não se estima tempo a partir do nome do gate.',
    ],
    releaseReady: false,
    directory,
    reportPath,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}
