import { readFileSync, existsSync, readdirSync, statSync, lstatSync, readlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { parse } from 'yaml';
const problems = [];
const requireThat = (ok, message) => {
  if (!ok) problems.push(message);
};
const required = [
  'AGENTS.md',
  'README.md',
  'docs/ARQUITETURA.md',
  'docs/APRENDIZADOS.md',
  'docs/HARNESS.md',
  'docs/TESTES.md',
  'docs/PUBLICACAO.md',
  'src/main.js',
  'src/game.js',
  'src/visuals.js',
  'src/styles.css',
  'src/shell.html',
  '.github/workflows/ci.yml',
  'specs/foundation.md',
];
for (const f of required) requireThat(existsSync(f), `Missing ${f}`);
const source = readFileSync('src/game.js', 'utf8'),
  html = readFileSync('src/shell.html', 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
requireThat(new Set(ids).size === ids.length, 'Duplicate DOM ids');
for (const [, id] of source.matchAll(/\$\('([^']+)'\)/g))
  requireThat(ids.includes(id), `Missing HUD element ${id}`);
for (const file of ['src/game.js', 'src/visuals.js']) {
  const text = readFileSync(file, 'utf8');
  requireThat(!/\b(?:eval|Function)\s*\(/.test(text), `Dynamic code in ${file}`);
  requireThat(!/https?:\/\//.test(text), `Unexpected runtime network in ${file}`);
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
requireThat(
  pkg.dependencies.three === '0.170.0',
  'Renderer upgrade requires explicit invariant update and graphics review',
);
requireThat(existsSync('package-lock.json'), 'Missing dependency lock');
const skillNames = [
  'nova-wing-graficos',
  'nova-wing-audio',
  'nova-wing-dinamica',
  'nova-wing-fisica',
  'nova-wing-entrega',
];
for (const name of skillNames) {
  const file = `skills/${name}/SKILL.md`;
  requireThat(existsSync(file), `Missing skill ${name}`);
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8');
  const front = text.match(/^---\n([\s\S]+?)\n---/);
  requireThat(!!front, `Invalid skill frontmatter ${name}`);
  if (front) {
    const meta = parse(front[1]);
    requireThat(
      meta.name === name && typeof meta.description === 'string',
      `Invalid skill identity ${name}`,
    );
  }
  const route = `.agents/skills/${name}`;
  requireThat(
    existsSync(route) &&
      lstatSync(route).isSymbolicLink() &&
      readlinkSync(route) === `../../skills/${name}`,
    `Invalid discovery link ${name}`,
  );
}
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.name === 'node_modules' ||
    e.name === '.git' ||
    e.name === 'artifacts' ||
    e.name === 'test-results' ||
    e.name === 'playwright-report'
      ? []
      : e.isDirectory()
        ? walk(join(dir, e.name))
        : [join(dir, e.name)],
  );
}
for (const f of walk('.').filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(f, 'utf8');
  for (const [, link] of text.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    if (/^(https?:|#|mailto:)/.test(link)) continue;
    requireThat(
      existsSync(resolve(dirname(f), link.split('#')[0])),
      `Broken documentation link ${f} -> ${link}`,
    );
  }
}
const workflow = existsSync('.github/workflows/ci.yml')
  ? parse(readFileSync('.github/workflows/ci.yml', 'utf8'))
  : null;
if (workflow) {
  requireThat(
    workflow.permissions?.contents === 'read',
    'CI must have read-only contents permission',
  );
  requireThat(workflow.jobs?.pages?.needs === 'browser', 'Pages requires the browser gate');
  requireThat(!workflow.on?.pull_request_target, 'No privileged PR trigger');
  requireThat(workflow.jobs?.quality && workflow.jobs?.browser, 'Missing quality/browser gate');
  for (const job of Object.values(workflow.jobs))
    for (const step of job.steps ?? [])
      if (step.uses) requireThat(/@[a-f0-9]{40}$/.test(step.uses), `Unpinned action ${step.uses}`);
}
if (existsSync('index.html'))
  requireThat(statSync('index.html').size < 2_000_000, 'Single-file game exceeds 2 MB budget');
requireThat(!existsSync('.openai/hosting.json'), 'Private Sites metadata must not be exported');
if (problems.length) throw new Error(problems.join('\n'));
console.log('Repository contracts, docs, skills and workflow invariants passed.');
