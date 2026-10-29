// Authored sector signatures. No random calls: camera and scenery must agree
// on where the story takes place, rather than falling back to Earth's orbit.
export const STAGE_VISUALS = Object.freeze(
  [
    { location: 'earth-ascent', globe: 'earth', motif: 'city', encounter: 'intercept' },
    { location: 'submerged-port', globe: 'none', motif: 'submerged-spires', encounter: 'escort' },
    { location: 'asteroid-belt', globe: 'fractured-moon', motif: 'debris', encounter: 'drill' },
    { location: 'orbital-station', globe: 'none', motif: 'airlocks', encounter: 'reactor' },
    { location: 'plasma-storm', globe: 'sun', motif: 'plasma-streams', encounter: 'solar-dive' },
    { location: 'frozen-moon', globe: 'ice-world', motif: 'crystal-rifts', encounter: 'stomp' },
    { location: 'bio-nebula', globe: 'none', motif: 'bio-spires', encounter: 'swarm' },
    { location: 'mothership-battle', globe: 'none', motif: 'fleet-wrecks', encounter: 'broadside' },
    {
      location: 'orion-gravity-well',
      globe: 'none',
      motif: 'gravity-lenses',
      encounter: 'gravity',
    },
    {
      location: 'marvin-fortress',
      globe: 'black-hole',
      motif: 'fortress-gates',
      encounter: 'eclipse',
    },
  ].map((value) => Object.freeze(value)),
);

export function stageVisualAt(index) {
  if (!Number.isInteger(index) || index < 0 || index >= STAGE_VISUALS.length)
    throw new RangeError('Invalid sector signature');
  return STAGE_VISUALS[index];
}

// No camera cuts on elapsed percentage: a viewpoint must correspond to a
// deliberate mission mechanic, with matching controls and safe ship framing.
// Overhead is exclusive to station reactor-grid traversal; all other sectors
// retain the pilot's chase/cockpit/combat choice until dedicated mechanics exist.
export function stagePerspectiveAt(index, seconds, duration, boss = false, context = {}) {
  if (boss || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(seconds))
    return 'chase';
  if (index === 3 && context.mission === 'reactor-grid') return 'overhead';
  if (index === 2 && context.mission === 'asteroid-escape') return 'combat';
  return 'chase';
}
