import { createHash, randomUUID } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { validationProblem } from './orchestrator.mjs';
import { responseProblem } from './agent-review.mjs';

const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function directoryAt(root, segments, create = false) {
  let directory = root;
  for (const segment of segments) {
    directory = join(directory, segment);
    try {
      if (!lstatSync(directory).isDirectory() || lstatSync(directory).isSymbolicLink())
        throw new Error('Diretório de avaliação redirecionado ou inválido.');
    } catch (error) {
      if (error.code !== 'ENOENT' || !create) throw error;
      mkdirSync(directory);
    }
  }
  return directory;
}

function readCorpus(root) {
  const directory = directoryAt(root, ['specs', 'evals']);
  const path = join(directory, 'orchestrator-cases.json');
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1048576)
    throw new Error('Corpus deve ser arquivo regular de até 1 MiB.');
  const raw = readFileSync(path, 'utf8');
  const corpus = JSON.parse(raw);
  if (
    !object(corpus) ||
    corpus.schemaVersion !== 1 ||
    corpus.synthetic !== true ||
    corpus.evaluationType !== 'contract' ||
    typeof corpus.corpusVersion !== 'string' ||
    !corpus.corpusVersion.trim() ||
    !Array.isArray(corpus.cases) ||
    corpus.cases.length === 0 ||
    corpus.cases.length > 1000
  )
    throw new Error('Schema do corpus de contrato inválido.');
  const seen = new Set();
  for (const item of corpus.cases) {
    if (
      !object(item) ||
      typeof item.id !== 'string' ||
      !/^[a-z0-9-]{1,100}$/.test(item.id) ||
      seen.has(item.id) ||
      typeof item.description !== 'string' ||
      !item.description.trim() ||
      typeof item.expectedAccept !== 'boolean' ||
      !['validation', 'review'].includes(item.validator) ||
      !object(item.input) ||
      (item.validator === 'validation' &&
        (!Object.hasOwn(item.input, 'evidence') ||
          !object(item.input.task) ||
          typeof item.input.started !== 'string')) ||
      (item.validator === 'review' &&
        (!Object.hasOwn(item.input, 'response') || !object(item.input.request)))
    )
      throw new Error('Caso inválido ou ID duplicado no corpus de contrato.');
    seen.add(item.id);
  }
  return { corpus, path, sha256: createHash('sha256').update(raw).digest('hex') };
}

/** Evaluates deterministic evidence contracts; does not invoke or score a language model. */
export function evaluateContracts({ root = process.cwd() } = {}) {
  const started = new Date().toISOString();
  root = realpathSync(resolve(root));
  const { corpus, path, sha256 } = readCorpus(root);
  const cases = corpus.cases.map((item) => {
    let problem;
    let error = null;
    try {
      problem =
        item.validator === 'validation'
          ? validationProblem(item.input.evidence, item.input.task, item.input.started)
          : responseProblem(item.input.response, item.input.request);
    } catch (failure) {
      error = failure.message;
      problem = 'Validador lançou erro.';
    }
    const actualAccept = problem === null;
    return {
      id: item.id,
      description: item.description,
      validator: item.validator,
      expectedAccept: item.expectedAccept,
      actualAccept,
      problem,
      error,
      correct: error === null && actualAccept === item.expectedAccept,
      falseApproval: !item.expectedAccept && actualAccept,
    };
  });
  const confusionMatrix = {
    truePositive: cases.filter((item) => item.expectedAccept && item.actualAccept).length,
    falsePositive: cases.filter((item) => !item.expectedAccept && item.actualAccept).length,
    trueNegative: cases.filter((item) => !item.expectedAccept && !item.actualAccept).length,
    falseNegative: cases.filter((item) => item.expectedAccept && !item.actualAccept).length,
  };
  const passed = cases.every((item) => item.correct);
  const reportId = randomUUID();
  const directory = directoryAt(root, ['artifacts', 'orchestrator', 'evaluations', reportId], true);
  const reportPath = join(directory, 'evaluation.json');
  const report = {
    schemaVersion: 1,
    kind: 'contract-evaluation',
    evaluationType: 'contract',
    synthetic: true,
    reportId,
    generatedAt: new Date().toISOString(),
    started,
    finished: new Date().toISOString(),
    durationMs: Date.now() - Date.parse(started),
    corpus: { path: relative(root, path), version: corpus.corpusVersion, sha256 },
    validators: [
      'tools/orchestrator.mjs#validationProblem',
      'tools/agent-review.mjs#responseProblem',
    ],
    sampleSize: cases.length,
    confusionMatrix,
    falseApprovals: confusionMatrix.falsePositive,
    cases,
    passed,
    status: passed ? 'passed' : 'failed',
    limitations: [
      'Corpus sintético versionado; positivo significa contrato aceito, inclusive parecer FAIL estruturalmente válido.',
      'Aprovação indevida significa aceitação de contrato que o corpus rotula inválido; não mede aprovação semântica do código.',
      'Validadores reais são chamados diretamente. Não há execução, avaliação de qualidade geral ou autenticação de identidade de modelo.',
      'Amostra pequena de cenários conhecidos; não demonstra cobertura exaustiva, ROI ou segurança em produção.',
    ],
    releaseReady: false,
    directory,
    reportPath,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}
