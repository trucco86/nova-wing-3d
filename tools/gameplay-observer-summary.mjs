import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const SCENARIOS = Object.freeze(['city', 'mars', 'reactor', 'europa']);
export const PROJECTS = Object.freeze(['desktop', 'mobile']);

export function summarizeGameplayObservations(reports) {
  const byId = new Map();
  for (const report of reports) {
    const id = report.scenario + '-' + report.project;
    if (byId.has(id)) throw new Error('Duplicate gameplay observation: ' + id);
    byId.set(id, report);
  }
  const missing = [];
  const findings = [];
  const observed = [];
  for (const scenario of SCENARIOS) {
    for (const project of PROJECTS) {
      const id = scenario + '-' + project;
      const report = byId.get(id);
      if (!report) {
        missing.push(id);
        continue;
      }
      observed.push({
        id,
        status: report.status,
        checks: report.checks?.length ?? 0,
        checkpoints: report.checkpoints?.length ?? 0,
        clip: report.video?.file ?? null,
        triggers: report.video?.triggers ?? [],
      });
      if (report.status === 'BLOCKED') {
        findings.push({ id, check: 'executor', detail: report.error || 'Blocked' });
      }
      for (const check of report.findings || []) {
        findings.push({
          id,
          check: check.id,
          detail: 'Observed mismatch',
        });
      }
    }
  }
  const blocked =
    missing.length > 0 ||
    observed.some((item) => !['OBSERVED_OK', 'FINDINGS'].includes(item.status)) ||
    observed.some((item) => item.checks === 0 || item.checkpoints === 0) ||
    observed.some((item) => item.status === 'FINDINGS' && !item.clip) ||
    observed.some(
      (item) => item.status === 'FINDINGS' && !findings.some((finding) => finding.id === item.id),
    );
  const status = blocked ? 'BLOCKED' : findings.length ? 'FINDINGS' : 'OBSERVED_OK';
  const signature = [
    status,
    ...missing.map((id) => 'missing:' + id),
    ...findings.map((item) => item.id + ':' + item.check),
  ]
    .sort()
    .join('|');
  return {
    schemaVersion: 1,
    mode: 'advisory',
    status,
    expected: SCENARIOS.length * PROJECTS.length,
    received: observed.length,
    observed,
    missing,
    findings,
    signature,
    humanApproval: 'PENDING',
    releaseAuthorized: false,
  };
}

export function gameplaySummaryMarkdown(summary) {
  const lines = [
    '# Gameplay Observer | pré-homologação',
    '',
    '**Estado:** ' + summary.status,
    '**Cenários recebidos:** ' + summary.received + '/' + summary.expected,
    '**Achados:** ' + summary.findings.length,
    '**Homologação humana:** pendente',
    '',
    '| Jornada | Estado | Checagens | Capturas | Vídeo para revisão |',
    '| --- | --- | ---: | ---: | --- |',
  ];
  for (const item of summary.observed) {
    lines.push(
      '| ' + item.id + ' | ' + item.status + ' | ' + item.checks + ' | ' + item.checkpoints + ' | ' + (item.clip ?? 'Não necessário') + ' |',
    );
  }
  for (const id of summary.missing) lines.push('| ' + id + ' | AUSENTE | 0 | 0 | Ausente |');
  if (summary.findings.length) {
    lines.push('', '## Achados para triagem', '');
    for (const item of summary.findings) {
      lines.push('- ' + item.id + ': ' + item.check + ' (' + item.detail + ')');
    }
  }
  lines.push('', 'Amostras sintéticas não substituem inspeção visual nem aprovação de produção.');
  return lines.join('\n') + '\n';
}

export async function writeGameplaySummary(
  source = 'artifacts/gameplay-observer',
  destination = 'artifacts',
) {
  let names = [];
  try {
    names = (await readdir(source)).filter((name) => name.endsWith('.json'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const reports = [];
  for (const name of names.sort()) {
    reports.push(JSON.parse(await readFile(join(source, name), 'utf8')));
  }
  const summary = summarizeGameplayObservations(reports);
  await mkdir(destination, { recursive: true });
  await writeFile(
    join(destination, 'gameplay-observer-summary.json'),
    JSON.stringify(summary, null, 2) + '\n',
  );
  await writeFile(
    join(destination, 'gameplay-observer-summary.md'),
    gameplaySummaryMarkdown(summary),
  );
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await writeGameplaySummary();
  process.stdout.write(gameplaySummaryMarkdown(result));
}
