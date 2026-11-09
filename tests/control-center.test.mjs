import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../docs/control-center/index.html', import.meta.url), 'utf8');
const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');

test('Control Center is responsive, accessible and Portuguese', () => {
  assert.match(html, /lang="pt-BR"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /@media\(max-width:420px\)/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="alert"/);
});

test('Control Center uses public read-only GitHub API without tokens', () => {
  assert.match(html, /https:\/\/api\.github\.com\/repos\//);
  assert.match(html, /\/actions\/runs\?per_page=40/);
  assert.match(html, /\/issues\?state=open/);
  assert.match(html, /\/pulls\?state=open/);
  assert.match(html, /\/releases\?per_page=20/);
  assert.doesNotMatch(html, /Authorization|Bearer |ghp_[A-Za-z0-9]+/);
  assert.match(html, /\.textContent=/);
  assert.doesNotMatch(html, /innerHTML\s*=/);
});

test('Control Center has real work, deployment and release views', () => {
  for (const id of [
    'tasks',
    'prs',
    'ci',
    'deploy',
    'work-list',
    'runs',
    'releases',
    'environments',
  ]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(html, /nova-release-monitor\.yml/);
  assert.match(html, /setInterval\(refresh,ms\)/);
});

test('GitHub Pages packages Control Center without modifying the game artifact', () => {
  assert.match(ci, /mkdir -p public-site\/control-center/);
  assert.match(
    ci,
    /cp docs\/control-center\/index\.html public-site\/control-center\/index\.html/,
  );
  assert.match(
    ci,
    /cp index\.html \.nojekyll LICENSE docs\/THREE-LICENSE\.txt public-site\//,
  );
});
