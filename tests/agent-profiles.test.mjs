import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const profiles = [
  'nova-planner',
  'nova-builder',
  'nova-visual-qa',
  'nova-release-gate',
];
test('Nova Wing provides four opt-in, scoped Copilot agent profiles with distinct tool permissions', () => {
  const names = new Set();
  for (const id of profiles) {
    const content = readFileSync(
      new URL('../.github/agents/' + id + '.agent.md', import.meta.url),
      'utf8',
    );
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(match, id + ' has YAML frontmatter');
    const metadata = parse(match[1]);
    assert.ok(metadata.name && metadata.description);
    assert.equal(metadata['disable-model-invocation'], true);
    assert.ok(Array.isArray(metadata.tools));
    assert.ok(metadata.tools.includes('read'));
    assert.ok(metadata.tools.includes('search'));
    assert.equal(metadata.tools.includes('web'), false, 'avoid unneeded external research');
    assert.equal(names.has(metadata.name), false);
    names.add(metadata.name);
    assert.match(content, /AGENTS\.md/, 'same repository guardrails for every role');
  }
  const planner = readFileSync(new URL('../.github/agents/nova-planner.agent.md', import.meta.url), 'utf8');
  const reviewer = readFileSync(
    new URL('../.github/agents/nova-release-gate.agent.md', import.meta.url),
    'utf8',
  );
  assert.equal(planner.includes('tools: [read, search, execute]'), true);
  assert.equal(reviewer.includes('tools: [read, search, execute]'), true);
  assert.match(reviewer, /quatro shards Playwright/);
});
