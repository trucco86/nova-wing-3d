import { SQUAD_PILOTS } from './five-cats-squad.js';

const SHIPS = Object.freeze({
  bia: Object.freeze({ model: 'nova7', color: 'mint' }),
  jenifer: Object.freeze({ model: 'specter', color: 'crimson' }),
  bob: Object.freeze({ model: 'aegis', color: 'cobalt' }),
  christopher: Object.freeze({ model: 'aegis', color: 'gold' }),
  calvin: Object.freeze({ model: 'specter', color: 'polar' }),
});

/** Every playable cat has its own ship; Bia is the forward center leader. */
export const CINEMATIC_FLEET = Object.freeze(
  SQUAD_PILOTS.map(({ id, slot, name }) => Object.freeze({ id, slot, name, ...SHIPS[id] })),
);

/**
 * The optional story and stage-one launch share the same selected center.
 * Default roster paint is stable for escort ships; the hero uses the player's
 * actual ship model and selected color. Gameplay remains the single source.
 */
export function cinematicFleetForLoadout(loadout = null) {
  const active = SQUAD_PILOTS.some(({ id }) => id === loadout?.pilot) ? loadout.pilot : 'bia';
  const selected = CINEMATIC_FLEET.find(({ id }) => id === active);
  const escortSlots = [-2, -1, 1, 2];
  return [
    {
      ...selected,
      slot: 0,
      model: ['nova7', 'specter', 'aegis'].includes(loadout?.ship)
        ? loadout.ship
        : selected.model,
      color: ['polar', 'mint', 'cobalt', 'crimson', 'gold'].includes(loadout?.color)
        ? loadout.color
        : selected.color,
    },
    ...CINEMATIC_FLEET.filter(({ id }) => id !== active).map((pilot, index) => ({
      ...pilot,
      slot: escortSlots[index],
    })),
  ];
}

/** Cinematic composition adapts to tall screens without hiding the wing cats. */
export function cinematicFormationPosition(slot, elapsed = 0, viewportAspect = 16 / 9) {
  const aspect = Number.isFinite(viewportAspect) ? viewportAspect : 16 / 9;
  const squeeze = Math.max(0.43, Math.min(1, aspect));
  const wing = Math.abs(slot);
  return {
    x: slot * 3.9 * squeeze,
    y: -0.7 + wing * 0.45 + Math.sin(elapsed * 0.9 + wing) * 0.17,
    z: -4 - wing * 2.8,
    bank: -slot * 0.075,
  };
}
