// Synthesized, low-fatigue SFX for the next web release. No downloads or samples.
// Envelopes are deliberately short; continuous loops must not obscure the music.
export const AUDIO_CUES = {
  plasmaTitan: {
    cooldown: 1,
    tones: [
      { from: 130, to: 40, duration: 0.9, gain: 0.048, wave: 'sawtooth' },
      { from: 540, to: 120, duration: 0.48, gain: 0.035, wave: 'triangle' },
    ],
  },
  fiveCatsOverdrive: {
    cooldown: 1,
    tones: [
      { from: 110, to: 260, duration: 0.45, gain: 0.028, wave: 'triangle' },
      { from: 370, to: 150, delay: 0.2, duration: 0.55, gain: 0.034, wave: 'sine' },
    ],
  },
  shot: {
    cooldown: 0.07,
    tones: [{ from: 440, to: 250, duration: 0.09, gain: 0.017, wave: 'triangle' }],
  },
  plasmaCharge: {
    cooldown: 0.3,
    tones: [
      { from: 250, to: 740, duration: 0.35, gain: 0.025, wave: 'sine' },
      { from: 125, to: 360, duration: 0.34, gain: 0.012, wave: 'triangle' },
    ],
  },
  plasmaRelease: {
    cooldown: 0.12,
    tones: [
      { from: 940, to: 190, duration: 0.28, gain: 0.05, wave: 'triangle' },
      { from: 185, to: 60, duration: 0.32, gain: 0.033, wave: 'sine' },
    ],
  },
  explosion: {
    cooldown: 0.09,
    tones: [
      { from: 155, to: 43, duration: 0.48, gain: 0.085, wave: 'sine' },
      { from: 88, to: 30, duration: 0.28, gain: 0.025, wave: 'triangle' },
    ],
  },
  weakPoint: {
    cooldown: 0.18,
    tones: [{ from: 850, to: 1320, duration: 0.13, gain: 0.018, wave: 'sine' }],
  },
  armorHit: {
    cooldown: 0.35,
    tones: [{ from: 260, to: 175, duration: 0.13, gain: 0.014, wave: 'triangle' }],
  },
  ringShield: {
    cooldown: 0.08,
    tones: [
      { from: 520, to: 780, duration: 0.19, gain: 0.025, wave: 'sine' },
      { from: 790, to: 1120, delay: 0.09, duration: 0.17, gain: 0.021, wave: 'triangle' },
    ],
  },
  ringBlue: {
    cooldown: 0.08,
    tones: [
      { from: 580, to: 910, duration: 0.16, gain: 0.025, wave: 'sine' },
      { from: 930, to: 1240, delay: 0.1, duration: 0.18, gain: 0.024, wave: 'sine' },
    ],
  },
  critical: {
    cooldown: 3,
    tones: [
      { from: 620, to: 540, duration: 0.12, gain: 0.037, wave: 'sine' },
      { from: 620, to: 540, delay: 0.2, duration: 0.12, gain: 0.037, wave: 'sine' },
    ],
  },
  can: {
    cooldown: 0.16,
    tones: [{ from: 420, to: 680, duration: 0.17, gain: 0.034, wave: 'sine' }],
  },
  treat: {
    cooldown: 0.16,
    tones: [{ from: 510, to: 780, duration: 0.15, gain: 0.034, wave: 'triangle' }],
  },
  toy: {
    cooldown: 0.16,
    tones: [{ from: 680, to: 980, duration: 0.18, gain: 0.03, wave: 'sine' }],
  },
  litter: {
    cooldown: 0.16,
    tones: [{ from: 410, to: 585, duration: 0.19, gain: 0.029, wave: 'triangle' }],
  },
};
const LIMIT = 24;

export function createAudioCues(context) {
  const voices = new Set();
  const output = context.createGain();
  output.gain.value = 1;
  output.connect(context.destination);
  const lastPlayed = new Map();
  let destroyed = false;

  function play(name, { enabled = true, active = true } = {}) {
    const cue = AUDIO_CUES[name];
    if (!cue || destroyed || !enabled || !active || context.state === 'suspended') return false;
    const now = context.currentTime;
    if (now - (lastPlayed.get(name) ?? -Infinity) < cue.cooldown) return false;
    if (voices.size + cue.tones.length > LIMIT) return false;
    lastPlayed.set(name, now);
    for (const tone of cue.tones) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      const delay = tone.delay ?? 0;
      const starts = now + delay;
      const ends = starts + tone.duration;
      const voice = { osc, gain };
      osc.type = tone.wave;
      osc.frequency.setValueAtTime(tone.from, starts);
      osc.frequency.exponentialRampToValueAtTime(tone.to, ends);
      gain.gain.setValueAtTime(0.0001, starts);
      gain.gain.exponentialRampToValueAtTime(tone.gain, starts + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ends);
      osc.connect(gain);
      gain.connect(output);
      voices.add(voice);
      osc.onended = () => {
        voices.delete(voice);
        osc.disconnect();
        gain.disconnect();
      };
      osc.start(starts);
      osc.stop(ends + 0.025);
    }
    return true;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const voice of [...voices]) {
      try {
        voice.osc.stop();
      } catch {
        // A source may have ended before cleanup.
      }
      voice.osc.disconnect();
      voice.gain.disconnect();
    }
    voices.clear();
    lastPlayed.clear();
    output.disconnect();
  }
  return {
    play,
    setVolume(level) {
      output.gain.value = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 1;
    },
    destroy,
    snapshot: () => ({ voices: voices.size, destroyed }),
  };
}
