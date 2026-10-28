import { createVoicePool } from './audio-synth.js';
// Compositions adapted from Nova Wing, Cristian Trucco (MIT). See THIRD_PARTY_NOTICES.md.
const SCALE_MIN = [0, 2, 3, 5, 7, 8, 10]; // menor natural
const SCALE_PHRYG = [0, 1, 3, 5, 7, 8, 10]; // frígio (tenso)
const SCALE_DORIAN = [0, 2, 3, 5, 7, 9, 10];
export const TRACKS = [
  { base: 196, bpm: 136, scale: SCALE_MIN, bass: [0, 0, 7, 0, 5, 5, 7, 3], wave: 'square' }, //1 nebulosa
  { base: 174, bpm: 132, scale: SCALE_DORIAN, bass: [0, 3, 5, 3, 7, 5, 3, 0], wave: 'square' }, //2 asteroides
  { base: 185, bpm: 140, scale: SCALE_MIN, bass: [0, 0, 3, 5, 7, 5, 3, 2], wave: 'sawtooth' }, //3 estação
  { base: 208, bpm: 144, scale: SCALE_PHRYG, bass: [0, 0, 5, 0, 8, 7, 5, 3], wave: 'sawtooth' }, //4 sol
  { base: 165, bpm: 130, scale: SCALE_DORIAN, bass: [0, 5, 3, 7, 5, 3, 2, 0], wave: 'square' }, //5 gelo
  { base: 196, bpm: 148, scale: SCALE_PHRYG, bass: [0, 0, 7, 7, 5, 5, 8, 8], wave: 'sawtooth' }, //6 guerra
  { base: 174, bpm: 134, scale: SCALE_DORIAN, bass: [0, 3, 7, 3, 5, 8, 7, 5], wave: 'triangle' }, //7 verde
  { base: 155, bpm: 142, scale: SCALE_PHRYG, bass: [0, 1, 5, 1, 7, 8, 5, 1], wave: 'sawtooth' }, //8 vazio
  { base: 147, bpm: 150, scale: SCALE_PHRYG, bass: [0, 0, 8, 7, 5, 8, 10, 7], wave: 'sawtooth' }, //9 fortaleza
  { base: 131, bpm: 154, scale: SCALE_PHRYG, bass: [0, 0, 1, 0, 5, 1, 8, 7], wave: 'sawtooth' }, //10 trono
];
// Boss theme: weighty sub-bass plus propulsive, urgent 16-step percussion.
export const BOSS_TRACK = {
  base: 110,
  bpm: 150,
  scale: [0, 2, 3, 5, 6, 8, 11],
  bass: [0, 0, 0, 3, 5, 3, 0, -2],
  wave: 'sawtooth',
};

// Original arrangements: sixteen-step motifs and four-bar harmonic movement.
const MOTIFS = [
  [0, null, 4, 7, 9, 7, 4, null, 2, null, 4, 2, 0, null, -3, null],
  [0, 2, 3, null, 7, 5, 3, 2, 0, null, 5, 7, 10, 7, 5, null],
  [0, null, 0, 7, 3, null, 5, 7, 10, 7, 5, null, 3, 2, 0, null],
  [7, 5, 3, null, 2, 3, 5, null, 7, 10, 7, 5, 3, null, 2, null],
  [0, null, 7, null, 10, 9, 7, null, 5, null, 3, 2, 0, null, 2, null],
];
export const MUSIC_MODES = ['sector', 'subboss', 'boss', 'enraged', 'collapse', 'victory'];
/**
 * Original combat score: driving pulse without losing the low orchestral body.
 * Tempo and density are observable so we can regression-test the mix.
 */
export function musicEnergyProfile(mode = 'sector', sector = 0) {
  const track = TRACKS[Math.max(0, Math.min(9, sector))];
  switch (mode) {
    case 'menu':
      return { bpm: 122, intensity: 0.76, highPulse: false };
    case 'subboss':
      return { bpm: 146, intensity: 1.06, highPulse: true };
    case 'boss':
      return { bpm: 150, intensity: 1.13, highPulse: true };
    case 'enraged':
      return { bpm: 164, intensity: 1.2, highPulse: true };
    case 'collapse':
      return { bpm: 168, intensity: 1.2, highPulse: true };
    case 'victory':
      return { bpm: 140, intensity: 0.98, highPulse: true };
    default:
      return { bpm: track.bpm, intensity: 0.94, highPulse: true };
  }
}

export function createMusic(context) {
  let master,
    input,
    pool,
    step = 0,
    remaining = 0,
    enabled = true,
    playing = false,
    volume = 1,
    sector = 0,
    mode = 'sector';
  const nodes = [];
  function prepare() {
    if (master) return;
    input = context.createGain();
    master = context.createGain();
    master.gain.value = 0.56 * volume;
    let tail = input;
    if (context.createBiquadFilter) {
      for (const [type, frequency, gain] of [
        ['highpass', 25, 0],
        ['lowshelf', 135, 2.5],
        ['lowpass', 7000, 0],
        ['highshelf', 2800, 1.6],
      ]) {
        const filter = context.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        filter.gain.value = gain;
        tail.connect(filter);
        tail = filter;
        nodes.push(filter);
      }
    }
    if (context.createDynamicsCompressor) {
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 3.5;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.2;
      tail.connect(compressor);
      tail = compressor;
      nodes.push(compressor);
    }
    tail.connect(master);
    master.connect(context.destination);
    pool = createVoicePool(context, input, 56);
  }
  function note(from, duration, wave, gain, extra = {}) {
    pool.tone({ from, to: from, duration, wave, gain, filter: 1800, ...extra });
  }
  function drum(heavy, pan = 0) {
    note(heavy ? 115 : 135, 0.42, 'sine', 0.28, { to: heavy ? 39 : 46, attack: 0.004, pan });
    note(190, 0.12, 'triangle', 0.045, { to: 65, filter: 380, pan });
    pool.noise({ color: 'brown', duration: 0.17, gain: 0.16, filter: 650, filterEnd: 100, pan });
  }
  function beat() {
    const heavy = ['boss', 'enraged', 'collapse'].includes(mode);
    const track = heavy ? BOSS_TRACK : TRACKS[sector];
    const { bpm, intensity, highPulse } = musicEnergyProfile(mode, sector);
    const d = 60 / bpm / 4;
    const s = step % 16;
    const bar = Math.floor(step / 16) % 4;
    const root = (heavy ? [0, -1, -5, -2] : [0, -3, -5, -2])[bar];
    const f = (octave, semitones = 0) => track.base * octave * 2 ** (semitones / 12);

    // Four-bar orchestral harmonic layer: retain the bass weight of the
    // previous score, but leave rhythmic space for faster attacks.
    if (s === 0) {
      const chord = mode === 'victory' ? [0, 4, 7] : [root, root + 7, root + (bar === 3 ? 2 : 3)];
      chord.forEach((n, index) => {
        note(f(1, n), d * 12, 'triangle', 0.03 * intensity, {
          attack: 0.095,
          filter: 1750,
          pan: (index - 1) * 0.38,
        });
        note(f(0.5, n), d * 11, 'sine', 0.016 * intensity, {
          attack: 0.12,
          pan: (1 - index) * 0.24,
        });
      });
    }

    // The sub-bass remains powerful while its octave harmonics read on phones.
    if ([0, 3, 6, 8, 10, 13].includes(s)) {
      const bass = mode === 'victory' ? (s < 8 ? 0 : 7) : root + track.bass[(s + bar) % 8];
      note(f(0.25, bass), d * (s % 8 === 0 ? 3.8 : 2), 'sine', 0.14 * intensity, {
        attack: 0.012,
        filter: 260,
      });
      note(f(0.5, bass), d * 1.8, 'triangle', 0.067 * intensity, {
        attack: 0.01,
        filter: 650,
      });
      if (highPulse)
        note(f(1, bass), d * 1.15, 'sawtooth', 0.021 * intensity, {
          attack: 0.006,
          filter: 1250,
          pan: s % 4 ? -0.2 : 0.2,
        });
    }

    // Active 4/4 propulsion; boss battles add a syncopated second kick.
    if (s % 4 === 0 || (heavy && [3, 11].includes(s))) {
      const backbeat = s === 4 || s === 12;
      drum(heavy || backbeat, s % 8 ? 0.1 : -0.1);
    }
    if (s === 4 || s === 12 || (heavy && s === 15)) {
      note(175, 0.19, 'sine', 0.09 * intensity, {
        to: 77,
        attack: 0.005,
        pan: s === 4 ? -0.2 : 0.2,
      });
      pool.noise({
        color: 'white',
        duration: 0.11,
        gain: 0.058 * intensity,
        filterType: 'bandpass',
        filter: 1650,
        filterEnd: 690,
        q: 0.85,
        pan: s === 4 ? 0.2 : -0.2,
      });
    }
    // Fast but soft high percussion, avoiding harsh, arcade-like square hats.
    if (s % (heavy ? 1 : 2) === 0 && (mode !== 'menu' || s % 4 === 0)) {
      pool.noise({
        color: 'white',
        duration: heavy && s % 4 === 3 ? 0.09 : 0.045,
        gain: (s % 4 === 0 ? 0.021 : 0.016) * intensity,
        filterType: 'bandpass',
        filter: heavy ? 3600 : 3000,
        q: 0.72,
        pan: ((s % 4) - 1.5) * 0.2,
      });
    }

    // Rhythmic low-string synth ostinato: motion and urgency in the middle
    // frequencies, rather than a long ambient pad with occasional notes.
    if (highPulse && [0, 2, 3, 6, 8, 10, 11, 14].includes(s)) {
      const pitch = root + track.bass[(s + bar * 2) % 8] + (s >= 8 ? 7 : 0);
      note(f(1, pitch), d * (s % 4 === 0 ? 1.9 : 1.25), 'sawtooth', 0.029 * intensity, {
        attack: 0.014,
        filter: 2350,
        pan: s % 4 ? 0.23 : -0.23,
      });
    }

    // Distinct melody runs create a feeling of pursuit; the menu is a calmer
    // preview of the same original theme before the player starts the mission.
    const melody = MOTIFS[sector % MOTIFS.length][s];
    const foreground = mode === 'menu' ? [0, 8].includes(s) : [0, 3, 6, 8, 11, 14].includes(s);
    if (melody !== null && foreground) {
      const tone = mode === 'victory' ? [0, 4, 7, 12][Math.floor(s / 4)] : root + melody;
      note(
        f(1, tone + (heavy ? 12 : 7)),
        d * (mode === 'menu' ? 4 : 2.4),
        'triangle',
        (mode === 'menu' ? 0.062 : 0.064) * intensity,
        {
          attack: 0.028,
          filter: heavy ? 3050 : 2600,
          pan: s < 8 ? -0.28 : 0.28,
        },
      );
      note(f(1, tone), d * 2.6, 'sine', 0.017 * intensity, {
        delay: d * 0.48,
        attack: 0.02,
        pan: s < 8 ? 0.24 : -0.24,
      });
    }
    if (mode === 'collapse' && s % 4 === 0) {
      pool.noise({
        duration: d * 3.5,
        gain: 0.065,
        filterType: 'bandpass',
        filter: 240 + s * 85,
        filterEnd: 2300,
        attack: 0.018,
      });
    }
    step++;
    return d;
  }
  return {
    start(index = 0, mood = false) {
      pool?.silence();
      sector = Math.max(0, Math.min(9, index));
      mode =
        typeof mood === 'string' && (MUSIC_MODES.includes(mood) || mood === 'menu')
          ? mood
          : mood
            ? 'boss'
            : 'sector';
      step = remaining = 0;
      playing = true;
      prepare();
    },
    update(dt) {
      if (!playing || !enabled) return;
      remaining -= dt;
      let count = 0;
      while (remaining <= 0 && count++ < 8) remaining += beat();
    },
    pause() {
      playing = false;
      pool?.silence();
    },
    resume() {
      playing = true;
      remaining = 0;
    },
    setVolume(value) {
      volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
      if (master) master.gain.value = 0.48 * volume;
    },
    setEnabled(value) {
      enabled = !!value;
      if (!enabled) pool?.silence();
    },
    snapshot: () => ({
      enabled,
      playing,
      sector,
      boss: ['boss', 'enraged', 'collapse'].includes(mode),
      mode,
      bpm: musicEnergyProfile(mode, sector).bpm,
      intensity: musicEnergyProfile(mode, sector).intensity,
      step,
      voices: pool?.count() ?? 0,
    }),
    destroy() {
      playing = false;
      pool?.silence();
      for (const node of [input, master, ...nodes]) node?.disconnect?.();
      nodes.length = 0;
      input = master = pool = null;
    },
  };
}
