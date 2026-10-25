import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const semver = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

function parts(version) {
  const match = semver.exec(version);
  if (!match) throw new Error('Expected MAJOR.MINOR.PATCH');
  return match.slice(1).map(Number);
}

export function releasePlan(version, current) {
  const next = parts(version);
  const previous = parts(current.package.version);
  const delta = next.findIndex((value, i) => value !== previous[i]);
  if (delta >= 0 && next[delta] < previous[delta]) {
    throw new Error('Cannot downgrade an existing release');
  }

  const packageJson = { ...current.package, version };
  const lockJson = {
    ...current.lock,
    version,
    packages: {
      ...current.lock.packages,
      '': { ...current.lock.packages[''], version },
    },
  };
  const buildNumber = next[0] * 1000000 + next[1] * 1000 + next[2];
  if (!Number.isSafeInteger(buildNumber)) throw new Error('Invalid iOS build number');
  const iosProject = current.iosProject
    .replace(/MARKETING_VERSION = [0-9.]+;/g, 'MARKETING_VERSION = ' + version + ';')
    .replace(
      /CURRENT_PROJECT_VERSION = [0-9]+;/g,
      'CURRENT_PROJECT_VERSION = ' + buildNumber + ';',
    );
  if (!iosProject.includes('MARKETING_VERSION = ' + version + ';')) {
    throw new Error('Missing iOS marketing version in Xcode project');
  }
  if (!iosProject.includes('CURRENT_PROJECT_VERSION = ' + buildNumber + ';')) {
    throw new Error('Missing iOS build number in Xcode project');
  }

  const heading = '## ' + version + ' — Candidata em preparação';
  const changelog = current.changelog.includes('## ' + version)
    ? current.changelog
    : current.changelog.replace(
        '# Histórico\n',
        '# Histórico\n\n' +
          heading +
          '\n\n- Candidata não homologada; preencher entregas e evidências antes da publicação.\n',
      );
  if (!changelog.includes('## ' + version)) {
    throw new Error('Could not add changelog release heading');
  }

  const notes =
    '## Nova Wing 3D v' +
    version +
    ' — candidata web\n\n' +
    '- Versão em preparação. Descrever mudanças reais e limitações.\n' +
    '- Homologação funcional, visual e CI pendentes.\n\n' +
    '**Não publicar em produção antes de aprovação.**\n';

  return { packageJson, lockJson, iosProject, changelog, notes };
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version = process.argv[2];
  if (!version) {
    console.error('Usage: npm run release:prepare -- <MAJOR.MINOR.PATCH>');
    process.exit(2);
  }
  const read = (path) => readFileSync(path, 'utf8');
  const current = {
    package: JSON.parse(read('package.json')),
    lock: JSON.parse(read('package-lock.json')),
    iosProject: read('ios/App/App.xcodeproj/project.pbxproj'),
    changelog: read('CHANGELOG.md'),
  };
  const planned = releasePlan(version, current);
  const notesPath = 'releases/v' + version + '.md';
  writeJson('package.json', planned.packageJson);
  writeJson('package-lock.json', planned.lockJson);
  writeFileSync('ios/App/App.xcodeproj/project.pbxproj', planned.iosProject);
  writeFileSync('CHANGELOG.md', planned.changelog);
  mkdirSync('releases', { recursive: true });
  if (!existsSync(notesPath)) writeFileSync(notesPath, planned.notes);

  const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
  console.log(
    'Release ' + version + ' prepared. Review changelog/release notes and run npm run validate.',
  );
}
