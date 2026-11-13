// Five Cats: introductory flight formation and independent combat roles.
// Pure timing/geometry contracts enable deterministic QA without rendering.
export const SQUAD_INTRO_DURATION = 5;
export const SQUAD_PILOTS = [
  { id: 'bia', name: 'BIA', color: '#67ffe0', slot: 0, role: 'leader' },
  { id: 'jenifer', name: 'JENIFER', color: '#ff718f', slot: -1, role: 'intercept' },
  { id: 'bob', name: 'BOB', color: '#77b8ff', slot: 1, role: 'guard' },
  { id: 'christopher', name: 'CHRISTOPHER', color: '#ffbf5e', slot: -2, role: 'heavy' },
  { id: 'calvin', name: 'CALVINHO', color: '#c28aff', slot: 2, role: 'arcane' },
];

export const SQUAD_SPECIALS = {
  plasma: { cost: 75, cooldown: 38, duration: 8, pulseInterval: 0.25 },
  overdrive: { cost: 90, cooldown: 46, duration: 10, pulseInterval: 0.42 },
};

/** Symmetrical five-ship V with Bia in the center and forward. */
export function formationPose(slot, t = 0) {
  const wing = Math.abs(slot);
  const progress = Math.min(1, Math.max(0, t / SQUAD_INTRO_DURATION));
  const ease = progress * progress * (3 - 2 * progress);
  return {
    x: slot * (8 + ease * 0.9),
    y: 7 + wing * 1.6 + Math.sin(t * 1.5 + wing) * 0.2,
    z: -17 + wing * 7 - ease * 5,
    bank: -slot * 0.04,
  };
}

/** Each non-player pilot is dispatched to a separate section of the stage. */
export function allySortieAt(seconds, ownPilot) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const wing = SQUAD_PILOTS.filter((pilot) => pilot.id !== ownPilot);
  const times = [19, 42, 66, 91];
  const index = times.findIndex((start) => seconds >= start && seconds < start + 5);
  if (index < 0) return null;
  return {
    pilot: wing[index % wing.length],
    seconds: seconds - times[index],
    section: index,
  };
}

export function canActivateSquadSpecial(kind, { playing, intro, energy, cooldown }) {
  const cfg = SQUAD_SPECIALS[kind];
  return !!cfg && !!playing && !intro && cooldown <= 0 && energy >= cfg.cost;
}


/**
 * Long-running support flights. Ships approach from outside the battle space,
 * provide support and leave on a banked tangent. Never toggle visibility
 * while close to the player's ship.
 */
export const ALLY_SORTIE_FLIGHT = Object.freeze({
  entry: 1.6,
  escortEnd: 5.4,
  duration: 8.2,
  overdriveExit: 2.6,
});
const SORTIE_STARTS = Object.freeze([19, 42, 66, 91]);
const WINGS_BY_PILOT = Object.fromEntries(
  SQUAD_PILOTS.map(({ id }) => [
    id,
    Object.freeze(SQUAD_PILOTS.filter((pilot) => pilot.id !== id)),
  ]),
);
const smoothFlight = (value) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

export function allySortieFlightAt(seconds, ownPilot) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const wing = WINGS_BY_PILOT[ownPilot] ?? SQUAD_PILOTS;
  const section = SORTIE_STARTS.findIndex(
    (start) => seconds >= start && seconds < start + ALLY_SORTIE_FLIGHT.duration,
  );
  if (section < 0 || !wing.length) return null;
  const age = seconds - SORTIE_STARTS[section];
  return {
    pilot: wing[section % wing.length],
    section,
    seconds: age,
    phase:
      age < ALLY_SORTIE_FLIGHT.entry
        ? 'arrival'
        : age < ALLY_SORTIE_FLIGHT.escortEnd
          ? 'escort'
          : 'departure',
  };
}

export function allySortieFlightPose(sortie, player = { x: 0, y: 0, z: 0 }) {
  if (!sortie) return null;
  const side = sortie.section % 2 ? 1 : -1;
  const t = sortie.seconds;
  let x;
  let y;
  let z;
  let bank;
  if (t < ALLY_SORTIE_FLIGHT.entry) {
    const ease = smoothFlight(t / ALLY_SORTIE_FLIGHT.entry);
    x = side * (110 - 92 * ease);
    y = 35 - 31 * ease;
    z = -240 + 219 * ease;
    bank = -side * (0.7 - 0.56 * ease);
  } else if (t < ALLY_SORTIE_FLIGHT.escortEnd) {
    const age = t - ALLY_SORTIE_FLIGHT.entry;
    x = side * (18 + Math.sin(age * 1.6) * 1.4);
    y = 4 + Math.sin(age * 1.3) * 0.9;
    z = -21 - age * 1.8;
    bank = -side * 0.14;
  } else {
    const age = t - ALLY_SORTIE_FLIGHT.escortEnd;
    const ease = smoothFlight(
      age / (ALLY_SORTIE_FLIGHT.duration - ALLY_SORTIE_FLIGHT.escortEnd),
    );
    const escortAge = ALLY_SORTIE_FLIGHT.escortEnd - ALLY_SORTIE_FLIGHT.entry;
    const exitX = side * (18 + Math.sin(escortAge * 1.6) * 1.4);
    const exitY = 4 + Math.sin(escortAge * 1.3) * 0.9;
    const exitZ = -21 - escortAge * 1.8;
    x = exitX + side * 135 * ease;
    y = exitY + 65 * ease;
    z = exitZ - 260 * ease;
    bank = -side * (0.14 + 0.78 * ease);
  }
  return { x: player.x + x, y: player.y + y, z: player.z + z, bank };
}

/** Approach and tangent exit for all wings of the Overdrive special. */
export function overdriveWingPose(slot, seconds, player = { x: 0, y: 0, z: 0 }) {
  const side = slot < 0 ? -1 : 1;
  const spread = Math.max(1, Math.abs(slot));
  const escortX = side * (14 + spread * 8);
  const escortY = 4 + spread * 1.5;
  const escortZ = -17 + spread * 5;
  const entry = ALLY_SORTIE_FLIGHT.entry;
  const exitStart = SQUAD_SPECIALS.overdrive.duration;
  let x = escortX;
  let y = escortY;
  let z = escortZ;
  let bank = -side * 0.11;
  if (seconds < entry) {
    const ease = smoothFlight(seconds / entry);
    x += side * 98 * (1 - ease);
    y += 34 * (1 - ease);
    z -= 245 * (1 - ease);
    bank -= side * 0.55 * (1 - ease);
  } else if (seconds > exitStart) {
    const ease = smoothFlight((seconds - exitStart) / ALLY_SORTIE_FLIGHT.overdriveExit);
    x += side * 142 * ease;
    y += 65 * ease;
    z -= 255 * ease;
    bank -= side * 0.85 * ease;
  }
  return { x: player.x + x, y: player.y + y, z: player.z + z, bank };
}
