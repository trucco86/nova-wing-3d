import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { plan } from './orchestrator.mjs';
import { reviewContext } from './agent-review.mjs';

export const JOB_KINDS = ['validation', 'evaluations', 'operations-audit', 'review'];
export const validId = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
const validActor = (value) => typeof value === 'string' && /^[a-zA-Z0-9/_.:-]{1,200}$/.test(value);
const stamp = (time) => new Date(time).toISOString();

export function artifactDirectory(root, ...segments) {
  let directory = realpathSync(resolve(root));
  for (const segment of ['artifacts', 'orchestrator', ...segments]) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(segment) || ['.', '..'].includes(segment))
      throw new Error('Segmento de artefato inválido.');
    directory = join(directory, segment);
    if (!existsSync(directory)) mkdirSync(directory);
    if (realpathSync(directory) !== directory || !lstatSync(directory).isDirectory())
      throw new Error('Diretório de artefato redirecionado.');
  }
  return directory;
}

function connection(root) {
  const directory = artifactDirectory(root);
  const file = join(directory, 'queue.sqlite');
  for (const suffix of ['', '-wal', '-shm']) {
    const path = file + suffix;
    let stat;
    try {
      stat = lstatSync(path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (stat && !stat.isFile()) throw new Error('Banco da fila redirecionado.');
  }
  const db = new DatabaseSync(file);
  db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
  db.exec(`CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY, task_id TEXT UNIQUE NOT NULL, status TEXT NOT NULL,
    created INTEGER NOT NULL, state TEXT NOT NULL
  ); CREATE TABLE IF NOT EXISTS events (
    job_id TEXT NOT NULL, seq INTEGER NOT NULL, at TEXT NOT NULL,
    type TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(job_id,seq)
  );`);
  return db;
}

function transaction(root, action) {
  const db = connection(root);
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = action(db);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } finally {
    db.close();
  }
}

function read(db, id) {
  if (!validId(id)) throw new Error('jobId inválido.');
  const row = db.prepare('SELECT state FROM jobs WHERE id=?').get(id);
  if (!row) throw new Error('Trabalho não encontrado.');
  const job = JSON.parse(row.state);
  job.events = db
    .prepare('SELECT seq,at,type,data FROM events WHERE job_id=? ORDER BY seq')
    .all(id)
    .map((event) => ({ ...event, data: JSON.parse(event.data) }));
  return job;
}

function event(db, job, type, data, now) {
  const seq = Number(
    db.prepare('SELECT COALESCE(MAX(seq),0)+1 AS seq FROM events WHERE job_id=?').get(job.id).seq,
  );
  db.prepare('INSERT INTO events(job_id,seq,at,type,data) VALUES(?,?,?,?,?)').run(
    job.id,
    seq,
    stamp(now),
    type,
    JSON.stringify(data),
  );
  job.updatedAt = stamp(now);
  const state = { ...job };
  delete state.events;
  db.prepare('UPDATE jobs SET state=?,status=? WHERE id=?').run(
    JSON.stringify(state),
    job.status,
    job.id,
  );
  return read(db, job.id);
}

export function enqueueJob({
  root = process.cwd(),
  kind,
  spec,
  taskId,
  input = {},
  maxAttempts = 2,
  timeoutMs = 300000,
  leaseMs = timeoutMs + 30000,
  now = Date.now(),
}) {
  if (
    !JOB_KINDS.includes(kind) ||
    typeof taskId !== 'string' ||
    !/^[a-z0-9][a-z0-9_.-]{0,99}$/.test(taskId)
  )
    throw new Error('Tipo ou taskId inválido.');
  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > 5 ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 100 ||
    timeoutMs > 2160000 ||
    !Number.isInteger(leaseMs) ||
    leaseMs < timeoutMs + 100 ||
    leaseMs > 2190000
  )
    throw new Error('Limites inválidos.');
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !['runId', 'implementerId'].includes(key))
  )
    throw new Error('Entrada de trabalho inválida.');
  if (kind === 'review' && (!validId(input.runId) || !validActor(input.implementerId)))
    throw new Error('Revisão exige runId e implementerId.');
  if (kind !== 'review' && Object.keys(input).length)
    throw new Error('O trabalho não aceita parâmetros de execução.');
  const canonicalInput =
    kind === 'review' ? { runId: input.runId, implementerId: input.implementerId } : {};
  const snapshot = plan({ root, spec });
  if (kind === 'review') {
    const context = reviewContext({ root, runId: input.runId });
    if (
      context.spec !== snapshot.spec ||
      context.commit !== snapshot.commit ||
      context.sourceDigest !== snapshot.sourceDigest
    )
      throw new Error('Spec ou versão da revisão diverge do trabalho.');
  }
  const limits = { maxAttempts, timeoutMs, leaseMs };
  return transaction(root, (db) => {
    const existing = db.prepare('SELECT id FROM jobs WHERE task_id=?').get(taskId);
    if (existing) {
      const job = read(db, existing.id);
      if (
        job.kind !== kind ||
        job.spec !== snapshot.spec ||
        job.commit !== snapshot.commit ||
        job.sourceDigest !== snapshot.sourceDigest ||
        JSON.stringify(job.input) !== JSON.stringify(canonicalInput) ||
        JSON.stringify(job.limits) !== JSON.stringify(limits)
      )
        throw new Error('taskId já existe com outro contrato.');
      return job;
    }
    const job = {
      schemaVersion: 1,
      id: randomUUID(),
      taskId,
      kind,
      spec: snapshot.spec,
      commit: snapshot.commit,
      sourceDigest: snapshot.sourceDigest,
      input: canonicalInput,
      limits,
      status: 'queued',
      createdAt: stamp(now),
      updatedAt: stamp(now),
      attempts: [],
      result: null,
      releaseReady: false,
    };
    db.prepare('INSERT INTO jobs(id,task_id,status,created,state) VALUES(?,?,?,?,?)').run(
      job.id,
      taskId,
      job.status,
      now,
      JSON.stringify(job),
    );
    return event(db, job, 'enqueued', { kind, limits }, now);
  });
}

export function listJobs({ root = process.cwd() } = {}) {
  const db = connection(root);
  try {
    return db
      .prepare('SELECT id FROM jobs ORDER BY created,id')
      .all()
      .map(({ id }) => read(db, id));
  } finally {
    db.close();
  }
}

export function getJob({ root = process.cwd(), jobId }) {
  const db = connection(root);
  try {
    return read(db, jobId);
  } finally {
    db.close();
  }
}

export function claimJob({ root = process.cwd(), workerId, now = Date.now() }) {
  if (!validActor(workerId)) throw new Error('workerId inválido.');
  return transaction(root, (db) => {
    for (const { id } of db.prepare("SELECT id FROM jobs WHERE status='running'").all()) {
      const job = read(db, id);
      const attempt = job.attempts.at(-1);
      if (Date.parse(attempt.expiresAt) <= now) {
        attempt.finishedAt = stamp(now);
        attempt.outcome = 'expired';
        attempt.reason = 'lease-expired';
        job.status = job.attempts.length < job.limits.maxAttempts ? 'queued' : 'failed';
        event(db, job, 'lease-expired', { attempt: attempt.number, nextStatus: job.status }, now);
      }
    }
    const next = db
      .prepare("SELECT id FROM jobs WHERE status='queued' ORDER BY created,id LIMIT 1")
      .get();
    if (!next) return null;
    const job = read(db, next.id);
    const attempt = {
      number: job.attempts.length + 1,
      leaseId: randomUUID(),
      workerId,
      startedAt: stamp(now),
      expiresAt: stamp(now + job.limits.leaseMs),
      finishedAt: null,
      outcome: null,
      reason: null,
    };
    job.attempts.push(attempt);
    job.status = 'running';
    return event(
      db,
      job,
      'claimed',
      { attempt: attempt.number, leaseId: attempt.leaseId, workerId },
      now,
    );
  });
}

export function finishJob({
  root = process.cwd(),
  jobId,
  leaseId,
  outcome,
  result = null,
  reason = null,
  retryable = false,
  now = Date.now(),
}) {
  if (
    !validId(leaseId) ||
    !['succeeded', 'blocked', 'failed', 'waiting-review'].includes(outcome) ||
    typeof retryable !== 'boolean' ||
    !(reason === null || (typeof reason === 'string' && reason.length <= 2048)) ||
    JSON.stringify(result).length > 32768
  )
    throw new Error('Conclusão de trabalho inválida.');
  return transaction(root, (db) => {
    const job = read(db, jobId);
    const attempt = job.attempts.at(-1);
    if (
      attempt?.leaseId === leaseId &&
      attempt.finishedAt &&
      attempt.outcome === outcome &&
      JSON.stringify(job.result) === JSON.stringify(result)
    )
      return job;
    if (
      job.status !== 'running' ||
      attempt?.leaseId !== leaseId ||
      Date.parse(attempt.expiresAt) <= now
    )
      throw new Error('Lease perdida ou expirada; conclusão rejeitada.');
    attempt.finishedAt = stamp(now);
    attempt.outcome = outcome;
    attempt.reason = reason;
    job.status =
      outcome === 'failed' && retryable && job.attempts.length < job.limits.maxAttempts
        ? 'queued'
        : outcome;
    job.result = result;
    return event(
      db,
      job,
      'finished',
      { attempt: attempt.number, outcome, nextStatus: job.status, reason },
      now,
    );
  });
}

export function resolveReviewJob({
  root = process.cwd(),
  jobId,
  result,
  outcome,
  now = Date.now(),
}) {
  if (!['succeeded', 'blocked'].includes(outcome))
    throw new Error('Resultado de revisão inválido.');
  return transaction(root, (db) => {
    const job = read(db, jobId);
    if (job.kind !== 'review') throw new Error('O trabalho não é uma revisão.');
    if (job.status === outcome && JSON.stringify(job.result) === JSON.stringify(result)) return job;
    if (job.status !== 'waiting-review') throw new Error('Trabalho não aguarda revisão.');
    job.status = outcome;
    job.result = result;
    return event(db, job, 'review-resolved', { outcome }, now);
  });
}
