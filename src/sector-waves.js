import { FIGHTER_ROLES } from './enemy-roles.js';

// Each sector owns its aerial combat rhythm. Existing roles control movement
// and bullets; this director changes encounters without raising enemy counts.
export const SECTOR_WAVE_PROGRAMS = Object.freeze(
  [
    ['INTERCEPÇÃO ORBITAL', 'stagger', 'vee', 'pincer'],
    ['CORREDOR SUBMERSO', 'escort', 'high-low', 'escort'],
    ['EMBOSCADA NO CINTURÃO', 'pincer', 'stagger', 'high-low'],
    ['BLOQUEIO DA ESTAÇÃO', 'wall', 'high-low', 'wall'],
    ['MERGULHO SOLAR', 'high-low', 'vee', 'pincer'],
    ['PATRULHA GLACIAL', 'vee', 'wall', 'escort'],
    ['ENXAME ORGÂNICO', 'pincer', 'high-low', 'stagger'],
    ['GUARDA DA NAVE-MÃE', 'wall', 'escort', 'pincer'],
    ['CERCO DE ÓRION', 'stagger', 'pincer', 'wall'],
    ['DEFESA DE MARVIN', 'escort', 'vee', 'wall'],
  ].map(([name, ...rhythms]) => Object.freeze({ name, rhythms: Object.freeze(rhythms) })),
);
const SLOTS = Object.freeze({
  stagger: [[-16, 24, 0], [18, 15, 1], [0, 34, 2], [-34, 22, 0]],
  vee: [[0, 26, 1], [-23, 18, 0], [23, 18, 2], [0, 11, 1]],
  pincer: [[-30, 16, 1], [30, 16, 1], [-9, 31, 2], [9, 31, 0]],
  escort: [[-13, 20, 0], [13, 20, 2], [30, 28, 1], [-30, 28, 0]],
  'high-low': [[-21, 31, 2], [21, 9, 1], [0, 20, 0], [33, 32, 2]],
  wall: [[-30, 12, 2], [0, 31, 1], [30, 12, 2], [-3, 18, 0]],
});
export function fighterWaveAt(sector, cycle, count) {
  if (!Number.isInteger(sector) || sector < 0 || sector >= SECTOR_WAVE_PROGRAMS.length)
    throw new RangeError('Invalid fighter sector');
  if (!Number.isInteger(cycle) || cycle < 0) throw new RangeError('Invalid wave cycle');
  if (!Number.isInteger(count) || count < 1 || count > 4)
    throw new RangeError('Wave count must remain between one and four');
  const program = SECTOR_WAVE_PROGRAMS[sector];
  const rhythm = program.rhythms[cycle % program.rhythms.length];
  const mirror = Math.floor(cycle / program.rhythms.length) % 2 ? -1 : 1;
  const slots = SLOTS[rhythm].slice(0, count).map(([x, y, role], i) => ({
    x: x * mirror,
    y,
    role: FIGHTER_ROLES[role],
    phase: (cycle % 4) * 0.6 + i * 0.36,
  }));
  return { name: program.name, rhythm, cycle, slots };
}
