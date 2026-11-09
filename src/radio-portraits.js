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
  // Native/headless gameplay harnesses may expose minimal element stubs
  // without DOMStringMap or setAttribute. Radio visuals are optional there.
  if (!portrait?.dataset || typeof portrait.setAttribute !== 'function' || !label) return speaker;
  portrait.dataset.pilot = speaker.id;
  portrait.setAttribute('aria-label', speaker.name + ', transmissão Five Cats');
  label.textContent = speaker.name;
  return speaker;
}

/** Cutscene speakers reuse the same approved cat crops as in-flight radio.
 * Narrator remains caption-only; unknown speaker names never show the wrong cat.
 */
export function renderCinematicPortrait(document, speakerName) {
  const portrait = document?.getElementById('cinematicPortrait');
  const entry = PILOT_PROFILES.find(({ name }) => name === speakerName);
  if (!portrait) return entry?.id ?? null;
  portrait.hidden = !entry;
  if (!entry || !portrait.dataset || typeof portrait.setAttribute !== 'function')
    return entry?.id ?? null;
  portrait.dataset.pilot = entry.id;
  portrait.setAttribute('aria-label', entry.name + ', diálogo Five Cats');
  return entry.id;
}
