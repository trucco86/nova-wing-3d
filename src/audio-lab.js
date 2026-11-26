// QA-only candidate bank. Original presets are never mutated.
export const AUDIO_LAB_KEYS = Object.freeze([
  'shot',
  'mechaShot',
  'plasmaRelease',
  'plasmaTitan',
  'boostIgnition',
]);
export const AUDIO_LAB_VARIANTS = Object.freeze([
  'Original',
  'Heavy',
  'Crisp',
  'Deep',
  'Compact',
  'Cinematic',
]);
const profiles = [
  [1, 1, 1],
  [0.83, 1.18, 1.08],
  [1.25, 0.8, 0.95],
  [0.65, 1.12, 1],
  [1.08, 0.58, 0.92],
  [0.92, 1.45, 0.88],
];
export function audioLabCandidate(base, index) {
  if (!base || !Number.isInteger(index) || index < 0 || index >= profiles.length) return null;
  if (!index) return base;
  const [pitch, duration, gain] = profiles[index];
  const layer = (x) => ({
    ...x,
    duration: x.duration * duration,
    gain: x.gain * gain,
    ...(x.from === undefined ? {} : { from: x.from * pitch, to: x.to * pitch }),
    ...(x.filter === undefined ? {} : { filter: x.filter * pitch }),
    ...(x.filterEnd === undefined ? {} : { filterEnd: x.filterEnd * pitch }),
  });
  return { ...base, tones: base.tones.map(layer), noises: (base.noises || []).map(layer) };
}
export function createAudioLab(allowed, presets) {
  const selected = new Map();
  return {
    select(key, index) {
      if (!allowed || !AUDIO_LAB_KEYS.includes(key) || !audioLabCandidate(presets[key], index))
        return false;
      selected.set(key, index);
      return true;
    },
    resolve(key, qaSession) {
      return allowed && qaSession && selected.has(key)
        ? audioLabCandidate(presets[key], selected.get(key))
        : presets[key];
    },
    snapshot: () => Object.fromEntries(selected),
    reset: () => selected.clear(),
  };
}
