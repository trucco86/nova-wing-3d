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

// Automatic *short* camera windows. These augment, but never override, the
// player's manually selected cockpit or distant-combat camera.
const SHOT_WINDOWS = Object.freeze(
  [
    [{ from: 0.2, to: 0.34, shot: 'side' }],
    [{ from: 0.32, to: 0.53, shot: 'overhead' }],
    [
      { from: 0.08, to: 0.23, shot: 'combat' },
      { from: 0.41, to: 0.57, shot: 'side' },
    ],
    [{ from: 0.24, to: 0.44, shot: 'overhead' }],
    [{ from: 0.16, to: 0.38, shot: 'side' }],
    [{ from: 0.37, to: 0.59, shot: 'overhead' }],
    [{ from: 0.29, to: 0.5, shot: 'side' }],
    [
      { from: 0.12, to: 0.29, shot: 'combat' },
      { from: 0.45, to: 0.58, shot: 'overhead' },
    ],
    [{ from: 0.2, to: 0.39, shot: 'side' }],
    [{ from: 0.33, to: 0.53, shot: 'combat' }],
  ].map((windows) => Object.freeze(windows.map((w) => Object.freeze(w)))),
);

export function stagePerspectiveAt(index, seconds, duration, boss = false) {
  if (boss || !Number.isFinite(duration) || duration <= 0 || !Number.isFinite(seconds))
    return 'chase';
  const progress = Math.max(0, Math.min(1, seconds / duration));
  const windows = SHOT_WINDOWS[index] ?? [];
  return windows.find(({ from, to }) => progress >= from && progress < to)?.shot ?? 'chase';
}
