import { createVoicePool } from './audio-synth.js';
// Compositions adapted from Nova Wing, Cristian Trucco (MIT). See THIRD_PARTY_NOTICES.md.
const SCALE_MIN = [0, 2, 3, 5, 7, 8, 10]; // menor natural
const SCALE_PHRYG = [0, 1, 3, 5, 7, 8, 10]; // frígio (tenso)
const SCALE_DORIAN = [0, 2, 3, 5, 7, 9, 10];
export const TRACKS = [
  { base: 196, bpm: 96, scale: SCALE_MIN, bass: [0, 0, 7, 0, 5, 5, 7, 3], wave: 'square' }, //1 nebulosa
  { base: 174, bpm: 90, scale: SCALE_DORIAN, bass: [0, 3, 5, 3, 7, 5, 3, 0], wave: 'square' }, //2 asteroides
  { base: 185, bpm: 104, scale: SCALE_MIN, bass: [0, 0, 3, 5, 7, 5, 3, 2], wave: 'sawtooth' }, //3 estação
  { base: 208, bpm: 110, scale: SCALE_PHRYG, bass: [0, 0, 5, 0, 8, 7, 5, 3], wave: 'sawtooth' }, //4 sol
  { base: 165, bpm: 88, scale: SCALE_DORIAN, bass: [0, 5, 3, 7, 5, 3, 2, 0], wave: 'square' }, //5 gelo
  { base: 196, bpm: 112, scale: SCALE_PHRYG, bass: [0, 0, 7, 7, 5, 5, 8, 8], wave: 'sawtooth' }, //6 guerra
  { base: 174, bpm: 94, scale: SCALE_DORIAN, bass: [0, 3, 7, 3, 5, 8, 7, 5], wave: 'triangle' }, //7 verde
  { base: 155, bpm: 100, scale: SCALE_PHRYG, bass: [0, 1, 5, 1, 7, 8, 5, 1], wave: 'sawtooth' }, //8 vazio
  { base: 147, bpm: 114, scale: SCALE_PHRYG, bass: [0, 0, 8, 7, 5, 8, 10, 7], wave: 'sawtooth' }, //9 fortaleza
  { base: 131, bpm: 118, scale: SCALE_PHRYG, bass: [0, 0, 1, 0, 5, 1, 8, 7], wave: 'sawtooth' }, //10 trono
];
// Trilha de CHEFE — dramática, lenta e pesada (menor harmônica, tímpanos)
export const BOSS_TRACK = {
  base: 110,
  bpm: 100,
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
    master.gain.value = 0.48 * volume;
    let tail = input;
    if (context.createBiquadFilter) {
      for (const [type, frequency, gain] of [
        ['highpass', 25, 0],
        ['lowshelf', 135, 2.5],
        ['lowpass', 4200, 0],
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
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 3.5;
      compressor.attack.value = 0.008;
      compressor.release.value = 0.28;
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
    const bpm =
      mode === 'menu'
        ? 84
        : mode === 'enraged'
          ? 124
          : mode === 'collapse'
            ? 132
            : mode === 'subboss'
              ? 108
              : track.bpm;
    const d = 60 / bpm / 4,
      s = step % 16,
      bar = Math.floor(step / 16) % 4;
    const root = (heavy ? [0, -1, -5, -2] : [0, -3, -5, -2])[bar];
    const f = (octave, semitones = 0) => track.base * octave * 2 ** (semitones / 12);
    // Sustained, slowly opened harmony replaces the old bright sixteenth-note ostinato.
    if (s === 0) {
      const chord = mode === 'victory' ? [0, 4, 7] : [root, root + 7, root + (bar === 3 ? 2 : 3)];
      chord.forEach((n, index) => {
        note(f(1, n), d * 14, 'triangle', 0.035, {
          attack: 0.22,
          filter: 1050,
          pan: (index - 1) * 0.45,
        });
        note(f(0.5, n), d * 13, 'sine', 0.022, { attack: 0.16, pan: (1 - index) * 0.25 });
      });
      pool.noise({
        color: 'brown',
        duration: d * 13,
        gain: 0.018,
        attack: 0.3,
        filter: 380,
        filterEnd: 900,
        pan: bar % 2 ? -0.3 : 0.3,
      });
    }
    // Rounded low end plus a harmonic body still audible on phone speakers.
    if ([0, 7, 10].includes(s)) {
      const bass = mode === 'victory' ? 0 : root + track.bass[Math.floor(s / 2) % 8];
      note(f(0.25, bass), d * (s === 0 ? 6 : 3), 'sine', heavy ? 0.17 : 0.135, {
        attack: 0.018,
        filter: 240,
      });
      note(f(0.5, bass), d * 2.8, 'triangle', 0.047, { filter: 450 });
    }
    if (s === 0 || s === 8 || (heavy && (s === 6 || s === 14))) drum(heavy, s === 8 ? 0.1 : -0.1);
    // Hand-drum / metal body: filtered noise and pitched membranes, never square-wave hats.
    if (s === 4 || s === 12 || (mode === 'subboss' && s === 15)) {
      note(s === 4 ? 155 : 195, 0.23, 'sine', 0.105, { to: 72, pan: s === 4 ? -0.25 : 0.25 });
      pool.noise({
        duration: 0.19,
        gain: 0.065,
        filterType: 'bandpass',
        filter: 1400,
        filterEnd: 420,
        q: 0.8,
        pan: s === 4 ? 0.2 : -0.2,
      });
    }
    if (s % 4 === 2 || (heavy && s % 2 === 1))
      pool.noise({
        duration: 0.06,
        gain: 0.025,
        filterType: 'bandpass',
        filter: 2800,
        q: 0.8,
        pan: s % 4 ? -0.35 : 0.35,
      });
    const melody = MOTIFS[sector % MOTIFS.length][s];
    if (melody !== null && (s % 4 === 0 || (!heavy && bar === 3 && s === 10))) {
      const tone = mode === 'victory' ? [0, 4, 7, 12][Math.floor(s / 4)] : root + melody;
      note(f(1, tone), d * 4.6, 'triangle', mode === 'menu' ? 0.055 : 0.042, {
        attack: 0.045,
        filter: 1400,
        pan: -0.2,
      });
      note(f(1, tone) * 1.002, d * 3, 'sine', 0.014, { delay: d * 1.5, attack: 0.03, pan: 0.35 });
    }
    if (mode === 'collapse' && s % 4 === 0)
      pool.noise({
        duration: d * 4,
        gain: 0.065,
        filterType: 'bandpass',
        filter: 180 + s * 75,
        filterEnd: 1800,
        attack: 0.03,
      });
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
