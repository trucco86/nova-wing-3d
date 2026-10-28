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
