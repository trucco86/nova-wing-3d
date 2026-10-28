/** Boss-specific attack families. Every sector has its own cadence, entry point
 * and salvo shape; phases change the fight rather than only increasing fire rate. */
export const BOSS_FAMILIES = Object.freeze([
  { name: 'interceptor', cadence: 2.35, salvos: 1, horizontal: 0, vertical: 0, type: 'fire' },
  { name: 'sting', cadence: 2.7, salvos: 2, horizontal: 24, vertical: -5, type: 'arcane' },
  { name: 'drill', cadence: 2.3, salvos: 1, horizontal: 0, vertical: 17, type: 'fire' },
  { name: 'reactor', cadence: 2.55, salvos: 2, horizontal: 20, vertical: 0, type: 'arcane' },
  { name: 'solar-dive', cadence: 1.95, salvos: 1, horizontal: 0, vertical: 13, type: 'fire' },
  { name: 'glacial-stomp', cadence: 3.1, salvos: 3, horizontal: 33, vertical: -13, type: 'arcane' },
  { name: 'hydra-swarm', cadence: 1.75, salvos: 3, horizontal: 29, vertical: 15, type: 'fire' },
  { name: 'broadside', cadence: 2.6, salvos: 4, horizontal: 43, vertical: 0, type: 'arcane' },
  { name: 'gravity-pulse', cadence: 2.2, salvos: 2, horizontal: 25, vertical: 27, type: 'arcane' },
  { name: 'marvin-eclipse', cadence: 1.8, salvos: 3, horizontal: 36, vertical: 18, type: 'fire' },
].map((profile) => Object.freeze(profile)));

export function bossAttackProgram(sector, phase = 1, volley = 0) {
  if (!Number.isInteger(sector) || sector < 0 || sector >= BOSS_FAMILIES.length)
    throw new RangeError('Invalid boss index');
  const profile = BOSS_FAMILIES[sector];
  const stage = Math.max(1, Math.min(3, Math.floor(phase)));
  const salvos = Math.max(1, Math.min(4, profile.salvos + (stage === 3 && profile.salvos < 3 ? 1 : 0)));
  const sources = Array.from({ length: salvos }, (_, i) => ({
    x: (i - (salvos - 1) / 2) * (profile.horizontal * 2 / Math.max(1, salvos - 1)),
    y: (i % 2 ? -1 : 1) * profile.vertical + (stage === 3 ? i * 2 : 0),
    volley: volley + i * (sector % 2 ? 2 : 1),
  }));
  return {
    name: profile.name,
    cadence: Math.max(0.95, profile.cadence * [1, 0.83, 0.68][stage - 1]),
    type: stage === 3 && sector % 3 === 0 ? 'arcane' : profile.type,
    phase: stage,
    sources,
  };
}

export function bossDamageMultipliers(zone, activeGenerators = 0) {
  if (zone === 'sealed') return 0;
  if (zone === 'hull') return activeGenerators > 0 ? 0.1 : 0.22;
  if (zone === 'generator') return 1.6;
  if (zone === 'core') return 1.35;
  throw new RangeError('Unknown boss hit zone');
}
