import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Scope selection only changes the early feedback/preview lane.
// Full Node + four Playwright shards remain mandatory release checks.
export const TESTS_BY_AREA = Object.freeze({
  core: ['tests/game.test.mjs', 'tests/campaign.test.mjs'],
  stage4: [
    'tests/devastador-sabotage.test.mjs',
    'tests/devastador-grand-hall.test.mjs',
    'tests/devastador-escape.test.mjs',
  ],
  mecha: ['tests/mecha-design.test.mjs', 'tests/hero-dash-breakables.test.mjs'],
  mobile: ['tests/input-title.test.mjs', 'tests/developer-mode.test.mjs'],
  graphics: ['tests/flight-environments.test.mjs'],
  audio: ['tests/audio.test.mjs'],
});

export function fastAreasForFiles(files) {
  const areas = new Set(['core']);
  for (const file of files) {
    if (/devastador|mothership|stage4|finale|destination-arrival/.test(file))
      areas.add('stage4');
    if (/mecha|robot|dash|hero-dodge|hero-weapon/.test(file)) areas.add('mecha');
    if (/shell\.html|styles\.css|input|developer-mode|ui-/.test(file)) areas.add('mobile');
    if (/visuals|graphics|grand-hall|flight|render/.test(file)) areas.add('graphics');
    if (/audio|music|sound/.test(file)) areas.add('audio');
  }
  return [...areas];
}

export function selectFastTests(files, scope = 'auto', available = existsSync) {
  const areas =
    scope === 'auto'
      ? fastAreasForFiles(files)
      : scope === 'all'
        ? Object.keys(TESTS_BY_AREA)
        : scope.split(',').map((s) => s.trim());
  for (const area of areas)
    if (!Object.hasOwn(TESTS_BY_AREA, area))
      throw new Error('Unknown scope: ' + area);
  const selected = new Set();
  for (const area of areas)
    for (const test of TESTS_BY_AREA[area])
      if (available(test)) selected.add(test);
  // Run any modified Node regression test even when its filename is unknown
  // to the impact map. Keep the early lane conservative, not authoritative.
  for (const file of files)
    if (/^tests\/[^/]+\.test\.mjs$/.test(file) && available(file)) selected.add(file);
  return { areas, tests: [...selected].sort() };
}

export function changedFiles() {
  try {
    // PR checkout is the synthetic merge commit; HEAD^ is the base ref.
    // For branch dispatch, HEAD^ still gives a useful conservative hint.
    return execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'], {
      encoding: 'utf8',
      timeout: 8000,
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    // Unknown diff -> stable core smoke, never treat this as full QA.
    return [];
  }
}
