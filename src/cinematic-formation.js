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
