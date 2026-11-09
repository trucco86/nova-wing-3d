import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

export const AGENT_AREAS = Object.freeze({
  stage4: {
    files: [
      'src/devastador-grand-hall.js',
      'src/devastador-sabotage.js',
      'src/mothership-interior.js',
      'src/game.js',
    ],
    tests: ['tests/devastador-grand-hall.test.mjs', 'tests/devastador-sabotage.test.mjs'],
    skill: 'skills/nova-wing-graficos/SKILL.md',
  },
  mecha: {
    files: ['src/mecha-premium.js', 'src/mecha-motion.js', 'src/game.js'],
    tests: ['tests/mecha-design.test.mjs', 'tests/hero-dash-breakables.test.mjs'],
    skill: 'skills/nova-wing-dinamica/SKILL.md',
  },
  ui: {
    files: ['src/shell.html', 'src/styles.css', 'src/input.js'],
    tests: ['tests/input-title.test.mjs'],
    skill: 'skills/nova-wing-qa/SKILL.md',
  },
  pipeline: {
    files: [
      '.github/workflows/ci.yml',
      '.github/workflows/cloudflare-preview.yml',
      'tools/fast-check.mjs',
    ],
    tests: ['tests/fast-plan.test.mjs'],
    skill: 'skills/nova-wing-entrega/SKILL.md',
  },
});

export function excerptForSymbol(source, symbol = '', maxLines = 18) {
  const lines = source.split('\n');
  if (!symbol) return lines.slice(0, maxLines).join('\n');
  const at = lines.findIndex((line) => line.includes(symbol));
  if (at < 0) return 'Symbol not found: ' + symbol;
  const start = Math.max(0, at - 3);
  return lines
    .slice(start, start + maxLines)
    .map((line, index) => `${start + index + 1}: ${line}`)
    .join('\n');
}

export function makeAgentBrief({
  area = 'stage4',
  symbol = '',
  budget = 4500,
  load = (path) => readFileSync(path, 'utf8'),
  has = existsSync,
  status = '',
} = {}) {
  if (!Object.hasOwn(AGENT_AREAS, area)) throw new Error('Unknown agent area: ' + area);
  const max = Math.max(1500, Math.min(12000, Math.floor(Number(budget) || 4500)));
  const cfg = AGENT_AREAS[area];
  const outline = {
    area,
    skill: cfg.skill,
    files: cfg.files.filter(has),
    tests: cfg.tests.filter(has),
    gitStatus: status.trim().slice(0, 650),
    instructions: [
      'Read AGENTS.md and the selected skill before changing behavior.',
      'Request only narrow line ranges; never paste entire game.js.',
      'Use FAST for feedback; FULL Node and 4 browser shards for release.',
      'Publish evidence for the final SHA; never claim an unfinished test passed.',
    ],
  };
  let serialized = JSON.stringify(outline);
  const excerpts = {};
  for (const file of outline.files) {
    if (serialized.length >= max - 200) break;
    const remaining = max - serialized.length - 150;
    if (remaining <= 80) break;
    const excerpt = excerptForSymbol(load(file), symbol, 16).slice(0, Math.min(remaining, 750));
    excerpts[file] = excerpt;
    serialized = JSON.stringify({ ...outline, excerpts });
  }
  const body = { ...outline, excerpts };
  const output = JSON.stringify(body, null, 2);
  return output.length > max ? JSON.stringify({ ...outline, excerpts: {} }, null, 2) : output;
}

function opt(key, fallback) {
  const arg = process.argv.slice(2).find((v) => v.startsWith('--' + key + '='));
  return arg ? arg.slice(key.length + 3) : fallback;
}
if (process.argv[1]?.endsWith('/agent-brief.mjs')) {
  let status = '';
  try {
    status = execFileSync('git', ['status', '--short'], {
      encoding: 'utf8',
      timeout: 3000,
    });
  } catch {
    // Local checkout not available. Do not invent branch status.
  }
  const result = makeAgentBrief({
    area: opt('area', 'stage4'),
    symbol: opt('symbol', ''),
    budget: opt('budget', '4500'),
    status,
  });
  console.log(result);
  console.error(
    '[agent-brief] ' +
      result.length +
      ' characters of context. Token usage/billing is not observable here.',
  );
}
