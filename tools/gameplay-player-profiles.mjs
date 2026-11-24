// Reproducible steering scripts. These are synthetic probes, not LLM players.
export const playerProfiles = Object.freeze({
  cautious: [
    { direction: 0, ticks: 8 },
    { direction: 1, ticks: 6 },
    { direction: 0, ticks: 8 },
    { direction: -1, ticks: 6 },
  ],
  explorer: [
    { direction: 1, ticks: 26 },
    { direction: -1, ticks: 48 },
    { direction: 0, ticks: 5 },
  ],
  adversarial: [
    { direction: 1, ticks: 10 },
    { direction: -1, ticks: 10 },
    { direction: 1, ticks: 10 },
    { direction: -1, ticks: 10 },
    { direction: 0, ticks: 5 },
  ],
});

export function steeringPlan(name) {
  if (!Object.hasOwn(playerProfiles, name)) throw new Error('Unknown synthetic player: ' + name);
  return playerProfiles[name].map((step) => ({ ...step }));
}
