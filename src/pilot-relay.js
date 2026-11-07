import { PILOT_PROFILES, SHIP_MODELS } from './pilots.js';

export const PILOT_SWAP_COOLDOWN = 9;
const colors = Object.freeze({
  bia: 'mint',
  bob: 'cobalt',
  christopher: 'gold',
  calvin: 'polar',
  jenifer: 'crimson',
});

/** One commander per active craft. Damage disables a ship, never a cat. */
export function createPilotRelay(initial = { pilot: 'bia', ship: 'nova7', color: 'polar' }) {
  let cooldown = 0;
  let active = 'bia';
  const damaged = new Set();
  const assigned = new Map();

  function reset(loadout = initial) {
    cooldown = 0;
    damaged.clear();
    const pilotIndex = Math.max(0, PILOT_PROFILES.findIndex((p) => p.id === loadout.pilot));
    const shipIndex = Math.max(0, SHIP_MODELS.findIndex((p) => p.id === loadout.ship));
    active = PILOT_PROFILES[pilotIndex].id;
    assigned.clear();
    PILOT_PROFILES.forEach((pilot, index) => {
      const offset = (index - pilotIndex + PILOT_PROFILES.length) % PILOT_PROFILES.length;
      assigned.set(pilot.id, {
        pilot: pilot.id,
        ship: SHIP_MODELS[(shipIndex + offset) % SHIP_MODELS.length].id,
        color: offset === 0 ? loadout.color : colors[pilot.id],
      });
    });
    return current();
  }
  function current() {
    return { ...assigned.get(active) };
  }
  function chooseNext() {
    const position = PILOT_PROFILES.findIndex((p) => p.id === active);
    for (let offset = 1; offset < PILOT_PROFILES.length; offset++) {
      const id = PILOT_PROFILES[(position + offset) % PILOT_PROFILES.length].id;
      if (!damaged.has(id)) return id;
    }
    return null;
  }
  function switchPilot() {
    if (cooldown > 0) return null;
    const next = chooseNext();
    if (!next) return null;
    const previous = current();
    active = next;
    cooldown = PILOT_SWAP_COOLDOWN;
    return { previous, next: current(), manual: true };
  }
  function retire() {
    const previous = current();
    damaged.add(active);
    const next = chooseNext();
    if (!next) return null;
    active = next;
    cooldown = 0;
    return { previous, next: current(), manual: false };
  }
  function advance(dt) {
    if (Number.isFinite(dt) && dt > 0) cooldown = Math.max(0, cooldown - dt);
  }
  function snapshot() {
    return {
      active,
      cooldown,
      damaged: [...damaged],
      available: PILOT_PROFILES.filter((pilot) => !damaged.has(pilot.id)).map((pilot) => pilot.id),
      canSwitch: cooldown <= 0 && chooseNext() !== null,
      assigned: [...assigned.values()].map((loadout) => ({ ...loadout })),
    };
  }
  reset(initial);
  return { reset, current, switchPilot, retire, advance, snapshot };
}
