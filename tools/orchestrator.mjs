import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  realpathSync,
  statSync,
  lstatSync,
  rmSync,
} from 'node:fs';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { sourceDigest } from './source-digest.mjs';
import { validationOutput } from './validation-output.mjs';

const gates = ['format:check', 'lint', 'test', 'check:repo', 'build:check'];
const commitAt = (root) => {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error('Não foi possível identificar o SHA.');
  return result.stdout.trim();
};

export function plan({ root = process.cwd(), spec, browser = false }) {
  if (!spec) throw new Error('Informe uma spec dentro de specs/.');
  const file = realpathSync(resolve(root, spec));
  const local = relative(realpathSync(join(root, 'specs')), file);
  if (
    isAbsolute(local) ||
    local === '..' ||
    local.startsWith('../') ||
    !file.endsWith('.md') ||
    !statSync(file).isFile()
  )
    throw new Error('A tarefa deve ser um Markdown dentro de specs/.');
  return {
    schemaVersion: 1,
    spec: relative(root, file),
    commit: commitAt(root),
    sourceDigest: sourceDigest(root),
    browserRequired: browser,
    context: [
      'AGENTS.md',
      'docs/ARQUITETURA.md',
      'docs/HARNESS.md',
      'skills/nova-wing-qa/SKILL.md',
    ],
    stages: ['implementation', 'validation', 'independent-review', 'human-acceptance'],
    command: ['npm', 'run', 'validate', ...(browser ? ['--', '--browser'] : [])],
    releaseReady: false,
  };
}

export function validationProblem(evidence, task, started) {
  try {
    const required = [...gates, ...(task.browserRequired ? ['test:browser'] : [])];
    const now = Date.now();
    if (
      !Number.isFinite(Date.parse(started)) ||
      evidence.passed !== true ||
      evidence.commit !== task.commit ||
      evidence.sourceDigest !== task.sourceDigest ||
      !Number.isFinite(Date.parse(evidence.started)) ||
      Date.parse(evidence.started) < Date.parse(started) ||
      !Number.isFinite(Date.parse(evidence.finished)) ||
      Date.parse(evidence.finished) < Date.parse(evidence.started) ||
      Date.parse(evidence.finished) > now ||
      !Array.isArray(evidence.checks) ||
      evidence.checks.length !== required.length ||
      required.some(
        (command, index) =>
          evidence.checks[index]?.command !== command ||
          evidence.checks[index]?.exitCode !== 0 ||
          evidence.checks[index]?.error,
      ) ||
      (task.browserRequired && evidence.browser !== 'executed')
    )
      return 'Evidência incompleta, obsoleta ou divergente da execução.';
    return null;
  } catch {
    return 'Relatório de validação inválido.';
  }
}

export function check(
  options,
  execute = (command, args, settings) => spawnSync(command, args, settings),
) {
  const root = resolve(options.root ?? process.cwd());
  const isolated = options.isolated === true;
  if (isolated && options.browser)
    throw new Error(
      'Isolamento disponível somente para validação Node; browser usa o gate dedicado.',
    );
  const task = plan({ ...options, root });
  const base = validationOutput({ root, requested: 'artifacts/orchestrator' });
  const lock = join(base, '.lock');
  try {
    if (!isolated) mkdirSync(lock);
  } catch (error) {
    if (error.code === 'EEXIST')
      throw new Error('Outra execução está ativa; verifique artifacts/orchestrator/.lock.', {
        cause: error,
      });
    throw error;
  }
  try {
    const started = new Date().toISOString();
    const runId = randomUUID();
    const directory = join(base, runId);
    mkdirSync(directory);
    const validationDirectory = isolated ? directory : join(root, 'artifacts');
    const save = (name, value) =>
      writeFileSync(join(directory, name), JSON.stringify(value, null, 2) + '\n');
    save('plan.json', task);
    let result;
    try {
      result = execute(task.command[0], task.command.slice(1), {
        cwd: root,
        stdio: 'inherit',
        timeout: Math.min(options.timeoutMs ?? 2160000, 2160000),
        // A handoff must cover the complete browser suite, never one CI shard.
        env: { ...process.env, NOVA_BROWSER_SHARD: '', NOVA_VALIDATION_DIR: validationDirectory },
      });
    } catch (error) {
      result = { status: null, error };
    }
    let evidence = null;
    let reason =
      result.error?.message ?? (result.status !== 0 ? 'Validação retornou falha.' : null);
    try {
      const reportPath = join(validationDirectory, 'validation.json');
      if (!lstatSync(reportPath).isFile()) throw new Error('Relatório de validação redirecionado.');
      evidence = JSON.parse(readFileSync(reportPath, 'utf8'));
      if (!isolated) save('validation.json', evidence);
      reason ??= validationProblem(evidence, task, started);
    } catch {
      reason ??= 'Relatório de validação ausente ou inválido.';
    }
    try {
      if (sourceDigest(root) !== task.sourceDigest || commitAt(root) !== task.commit)
        reason ??= 'A fonte mudou durante a validação; execute novamente.';
    } catch (error) {
      reason ??= `Não foi possível verificar a fonte: ${error.message}`;
    }
    const handoff = {
      schemaVersion: 1,
      runId,
      spec: task.spec,
      commit: task.commit,
      sourceDigest: task.sourceDigest,
      started,
      finished: new Date().toISOString(),
      durationMs: Date.now() - Date.parse(started),
      status: reason ? 'blocked' : 'awaiting-review',
      reason,
      nextOwner: reason ? 'implementation' : 'independent-review',
      pending: [
        'Revisão independente',
        'CI no SHA final',
        ...(task.browserRequired ? ['Homologação visual/mobile em dispositivo real'] : []),
      ],
      releaseReady: false,
    };
    save('handoff.json', handoff);
    return { ...handoff, directory };
  } finally {
    if (!isolated) rmSync(lock, { recursive: true, force: true });
  }
}
