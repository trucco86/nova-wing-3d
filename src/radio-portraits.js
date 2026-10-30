import { PILOT_PROFILES } from './pilots.js';

/** Shared, original-art radio identities. No external avatars or generic placeholders. */
export const RADIO_PILOTS = Object.freeze(
  Object.fromEntries(PILOT_PROFILES.map(({ id, name }) => [id, Object.freeze({ id, name })])),
);

export function radioSpeaker(id) {
  return Object.hasOwn(RADIO_PILOTS, id) ? RADIO_PILOTS[id] : RADIO_PILOTS.bia;
}

/**
 * Update an existing HUD portrait, without inserting remote imagery or altering
 * mission state. Original-art crop CSS is shared with the hangar roster.
 */
export function renderRadioSpeaker(document, id) {
  const speaker = radioSpeaker(id);
  const portrait = document?.getElementById('commsPortrait');
  const label = document?.getElementById('commsSpeaker');
  if (!portrait || !label) return speaker;
  portrait.dataset.pilot = speaker.id;
  portrait.setAttribute('aria-label', speaker.name + ', transmissão Five Cats');
  label.textContent = speaker.name;
  return speaker;
}
