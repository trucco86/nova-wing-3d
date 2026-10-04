import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const read = (p) => readFileSync(p, 'utf8');
const pkg = JSON.parse(read('package.json'));
const version = pkg.version;
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version))
  throw new Error('Expected MAJOR.MINOR.PATCH version');
const lock = JSON.parse(read('package-lock.json'));
if (lock.version !== version || lock.packages[''].version !== version)
  throw new Error('Version differs from lockfile');
if (
  !read('CHANGELOG.md')
    .split('\n')
    .some((l) => l === `## ${version}` || l.startsWith(`## ${version} —`))
)
  throw new Error('Missing changelog version');
if (!read(`releases/v${version}.md`).includes(`v${version}`))
  throw new Error('Missing release notes');
if (!read('index.html').includes(`id="gameVersion">v${version}</span>`))
  throw new Error('Build does not display package version');
const base = process.env.NOVA_BASE_SHA;
if (base && /^[a-f0-9]{40}$/.test(base) && !/^0+$/.test(base)) {
  const changed = execFileSync('git', ['diff', '--name-only', base, 'HEAD'], { encoding: 'utf8' })
    .trim()
    .split('\n');
  const shipped = changed.some(
    (p) => p.startsWith('src/') || p === 'index.html' || p === 'tools/build.mjs',
  );
  if (shipped) {
    const old = JSON.parse(
      execFileSync('git', ['show', `${base}:package.json`], { encoding: 'utf8' }),
    ).version;
    const a = version.split('.').map(Number),
      b = old.split('.').map(Number);
    const first = a.findIndex((n, i) => n !== b[i]);
    if (first < 0 || a[first] < b[first])
      throw new Error(`Distributed changes require a version newer than ${old}`);
  }
}
console.log(`Version v${version}: package, lock, changelog, notes and build agree.`);
