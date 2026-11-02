import { saturnPassageAt } from './saturn-ring-passage.js';

// The authored 10-sector itinerary: Earth and Mars keep their bespoke
// transitions; asteroid traversal is already controlled by stage-journey.
export const DESTINATION_PROFILES = Object.freeze({
  3: Object.freeze({
    location: 'JÚPITER',
    type: 'station',
    colors: ['#ad6e4b', '#d7aa75', '#805244'],
    haze: '#7a8aa4',
    label: 'NAVE-MÃE DEVASTADOR · JÚPITER',
    entry: 'INFILTRAÇÃO · HANGAR INTERNO DA NAVE-MÃE',
    exit: 'SAÍDA DA NAVE-MÃE · RUMO A VÊNUS',
    keepGlobe: true,
  }),
  4: Object.freeze({
    location: 'VÊNUS',
    type: 'clouds',
    colors: ['#93754b', '#edc98a', '#cba55e'],
    haze: '#c8ab75',
    label: 'VÊNUS · NUVENS SULFÚRICAS',
    entry: 'ENTRANDO NA ATMOSFERA DE VÊNUS',
    exit: 'ESCAPANDO DAS NUVENS DE VÊNUS',
    keepGlobe: false,
  }),
  5: Object.freeze({
    location: 'EUROPA',
    type: 'ice',
    colors: ['#6b91a2', '#d7ebeb', '#a9c6d3'],
    haze: '#9fbac8',
    label: 'EUROPA · LUA DE JÚPITER',
    entry: 'DESCIDA · FENDA GLACIAL',
    exit: 'ASCENSÃO · GELEIRAS DE EUROPA',
    keepGlobe: false,
  }),
  6: Object.freeze({
    location: 'NETUNO',
    type: 'storm',
    colors: ['#132d7a', '#4379d9', '#23549b'],
    haze: '#5772a9',
    label: 'NETUNO · TEMPESTADE AZUL',
    entry: 'MERGULHO · CAMADAS DE NUVENS',
    exit: 'ESCAPE · TEMPESTADE DE NETUNO',
    keepGlobe: false,
  }),
  7: Object.freeze({
    location: 'SATURNO',
    type: 'rings',
    colors: ['#8d795d', '#e0c79c', '#b49a75'],
    haze: '#888ba5',
    label: 'SATURNO · BATALHA NOS ANÉIS',
    entry: 'INTERCEPTAÇÃO · CAMPOS DE GELO DE SATURNO',
    exit: 'ROMPENDO O BLOQUEIO DE SATURNO',
    keepGlobe: true,
  }),
  8: Object.freeze({
    location: 'ABISMO DE ÓRION',
    type: 'void',
    colors: ['#071026', '#294669', '#070e1c'],
    haze: '#37517b',
    label: 'ABISMO DE ÓRION · ANOMALIA',
    entry: 'ENTRANDO NO CORREDOR GRAVITACIONAL',
    exit: 'FUGA · RASGO GRAVITACIONAL',
    keepGlobe: true,
  }),
  9: Object.freeze({
    location: 'TITÃ',
    type: 'haze',
    colors: ['#855333', '#dba366', '#a56f49'],
    haze: '#a47d66',
    label: 'TITÃ · CAÇADA A MARVIN',
    entry: 'PERSIGA O CAÇA OBSIDIAN · MARVIN EM FUGA',
    exit: 'VITÓRIA · FIVE CATS RETORNAM',
    keepGlobe: false,
  }),
});
export const PLANETARY_SECTORS = Object.freeze([4, 5, 6, 9]);
export const ARRIVAL_SECONDS = 25;
const smooth = (v) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
export function destinationArrivalAt(index, seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid destination time');
  const profile = DESTINATION_PROFILES[index];
  if (!profile) return null;
  // Saturn is an orbital battle, not another compulsory atmosphere/ship entry.
  // Enter the ice-ring region with the planet already visible, and unlock
  // encounters after a short orienting beat. All other journeys stay intact.
  if (index === 7) {
    const reveal = smooth(seconds / 8);
    const passage = saturnPassageAt(seconds);
    const phase = seconds < 3 ? 'space' : seconds < 8 ? 'orbit' : 'arena';
    return {
      phase,
      combatReady: seconds >= 8,
      reveal,
      haze: 0,
      seconds,
      keepGlobe: true,
      globeOpacity: 1,
      globeScale: 1.12 + 0.28 * reveal,
      label: passage.label,
    };
  }
  const phase =
    seconds < 6
      ? 'space'
      : seconds < 12
        ? 'orbit'
        : seconds < 19
          ? 'entry'
          : seconds < ARRIVAL_SECONDS
            ? 'descent'
            : 'arena';
  const reveal = smooth((seconds - 15) / 10);
  const haze = smooth((seconds - 11) / 5) * (1 - smooth((seconds - 22) / 9));
  return {
    phase,
    combatReady: seconds >= ARRIVAL_SECONDS,
    reveal,
    haze,
    seconds,
    keepGlobe: profile.keepGlobe,
    // For orbital locations Jupiter, Saturn and the anomaly remain in view
    // as distant scenery; ground destinations reveal their own terrain.
    globeOpacity: profile.keepGlobe ? 1 - 0.28 * reveal : 1 - smooth((seconds - 16) / 9),
    globeScale: 0.74 + smooth((seconds - 3) / 15) * 1.52 - reveal * (profile.keepGlobe ? 1.2 : 0),
    label:
      phase === 'space'
        ? profile.location + ' À VISTA · APROXIMAÇÃO'
        : phase === 'orbit'
          ? profile.label
          : phase === 'entry' || phase === 'descent'
            ? profile.entry
            : profile.label + ' · COMBATE',
  };
}
export function destinationExitAt(index, seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid escape time');
  // Existing Earth/Mars/asteroid routes also receive a post-boss exit beat.
  const progress = smooth((seconds - 4.7) / 3.3);
  const defaults = [
    'RETORNO À ÓRBITA TERRESTRE',
    'ASCENSÃO · MARTE',
    'FUGA · ASTEROIDE EM COLAPSO',
  ];
  const label = DESTINATION_PROFILES[index]?.exit ?? defaults[index] ?? 'ESCAPE ORBITAL';
  return { progress, active: progress > 0.005, label };
}
