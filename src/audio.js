// Compositions adapted from Nova Wing, Cristian Trucco (MIT). See THIRD_PARTY_NOTICES.md.
const SCALE_MIN = [0, 2, 3, 5, 7, 8, 10]; // menor natural
const SCALE_PHRYG = [0, 1, 3, 5, 7, 8, 10]; // frígio (tenso)
const SCALE_DORIAN = [0, 2, 3, 5, 7, 9, 10];
export const TRACKS = [
  { base: 196, bpm: 128, scale: SCALE_MIN, bass: [0, 0, 7, 0, 5, 5, 7, 3], wave: 'square' }, //1 nebulosa
  { base: 174, bpm: 120, scale: SCALE_DORIAN, bass: [0, 3, 5, 3, 7, 5, 3, 0], wave: 'square' }, //2 asteroides
  { base: 185, bpm: 134, scale: SCALE_MIN, bass: [0, 0, 3, 5, 7, 5, 3, 2], wave: 'sawtooth' }, //3 estação
  { base: 208, bpm: 140, scale: SCALE_PHRYG, bass: [0, 0, 5, 0, 8, 7, 5, 3], wave: 'sawtooth' }, //4 sol
  { base: 165, bpm: 118, scale: SCALE_DORIAN, bass: [0, 5, 3, 7, 5, 3, 2, 0], wave: 'square' }, //5 gelo
  { base: 196, bpm: 144, scale: SCALE_PHRYG, bass: [0, 0, 7, 7, 5, 5, 8, 8], wave: 'sawtooth' }, //6 guerra
  { base: 174, bpm: 126, scale: SCALE_DORIAN, bass: [0, 3, 7, 3, 5, 8, 7, 5], wave: 'triangle' }, //7 verde
  { base: 155, bpm: 132, scale: SCALE_PHRYG, bass: [0, 1, 5, 1, 7, 8, 5, 1], wave: 'sawtooth' }, //8 vazio
  { base: 147, bpm: 150, scale: SCALE_PHRYG, bass: [0, 0, 8, 7, 5, 8, 10, 7], wave: 'sawtooth' }, //9 fortaleza
  { base: 131, bpm: 158, scale: SCALE_PHRYG, bass: [0, 0, 1, 0, 5, 1, 8, 7], wave: 'sawtooth' }, //10 trono
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
  let master = null,
    filter = null,
    compressor = null,
    step = 0,
    remaining = 0,
    enabled = true,
    playing = false,
    sector = 0,
    mode = 'sector';
  const voices = new Set();
  function release(v) {
    voices.delete(v);
    v.o.disconnect?.();
    v.g.disconnect?.();
  }
  function silence() {
    for (const v of [...voices]) {
      try {
        v.o.stop();
      } catch {
        /* ended */
      }
      release(v);
    }
  }
  function note(freq, duration, type, volume, endFreq) {
    if (!enabled || !playing || !master || voices.size >= 48) return;
    const now = context.currentTime,
      o = context.createOscillator(),
      g = context.createGain(),
      v = { o, g };
    o.type = type;
    o.frequency.value = freq;
    if (endFreq) {
      o.frequency.setValueAtTime?.(freq, now);
      o.frequency.exponentialRampToValueAtTime?.(endFreq, now + duration);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.connect(g);
    g.connect(master);
    voices.add(v);
    o.onended = () => release(v);
    o.start(now);
    o.stop(now + duration + 0.03);
  }
  function beat() {
    const combat = mode === 'boss' || mode === 'enraged' || mode === 'collapse',
      t = combat ? BOSS_TRACK : TRACKS[sector],
      bpm = mode === 'enraged' ? 144 : mode === 'collapse' ? 168 : mode === 'subboss' ? 140 : t.bpm,
      d = 60 / bpm / 4,
      s = step % 16,
      bar = Math.floor(step / 16) % 4,
      root = (combat ? [0, -1, -5, -2] : [0, -3, -5, -2])[bar],
      f = (oct, n) => t.base * oct * 2 ** (n / 12),
      heavy = mode !== 'sector';
    if (mode === 'victory') {
      if (s % 4 === 0) for (const n of [0, 4, 7, 12]) note(f(1, n), d * 7, 'triangle', 0.08);
      if (s % 2 === 0) note(f(2, [0, 4, 7, 12, 7, 12, 16, 19][s / 2]), d * 3, 'sine', 0.08);
    } else {
      // Sub bass + plucked upper bass, with rests to preserve the kick transient.
      if (s % 2 === 0) {
        note(f(0.25, root + t.bass[(s / 2) % 8]), d * 1.7, 'sine', 0.16);
        note(f(0.5, root), d * 1.2, 'triangle', 0.065);
      }
      if (s === 0 || s === 8)
        for (const n of [0, 3, 7]) note(f(1, root + n), d * 7, 'triangle', 0.035);
      const melody = MOTIFS[sector % MOTIFS.length][s];
      if (mode === 'sector' && melody !== null) {
        note(f(2, root + melody), d * 2.2, 'triangle', 0.065);
        note(f(2, root + melody) * 1.003, d * 1.8, 'sine', 0.024);
      }
      if (heavy || bar % 2 === 1)
        note(
          f(heavy ? 1 : 2, root + t.scale[(s + (step % 32 >= 16 ? 2 : 0)) % 7]),
          d * 0.85,
          heavy ? 'sawtooth' : 'sine',
          heavy ? 0.025 : 0.02,
        );
      // Synthesized kick, snare pair and metallic hats (no external sample files).
      if (s % 4 === 0 || (mode === 'enraged' && s === 14)) note(130, 0.19, 'sine', 0.24, 38);
      if (s === 4 || s === 12) {
        note(190, 0.12, 'triangle', 0.1, 75);
        note(2200, 0.085, 'square', 0.023, 750);
      }
      if (s % 2 === 0 || heavy) {
        note(7200, 0.035, 'square', 0.009, 4300);
        note(9600, 0.025, 'triangle', 0.012);
      }
      if (mode === 'collapse') note(130 + step * 12, 0.15, 'sawtooth', 0.028, 160 + step * 13);
      if (heavy && s === 0) note(f(0.125, root), d * 10, 'sine', 0.12);
    }
    step++;
    return d;
  }
  return {
    start(index = 0, mood = false) {
      silence();
      sector = Math.max(0, Math.min(9, index));
      mode =
        typeof mood === 'string' && MUSIC_MODES.includes(mood) ? mood : mood ? 'boss' : 'sector';
      step = 0;
      remaining = 0;
      playing = true;
      if (!master) {
        master = context.createGain();
        master.gain.value = 0.55;
        let output = master;
        if (context.createBiquadFilter) {
          filter = context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 6500;
          output.connect(filter);
          output = filter;
        }
        if (context.createDynamicsCompressor) {
          compressor = context.createDynamicsCompressor();
          compressor.threshold.value = -16;
          compressor.ratio.value = 5;
          output.connect(compressor);
          output = compressor;
        }
        output.connect(context.destination);
      }
    },
    update(dt) {
      if (!playing || !enabled) return;
      remaining -= dt;
      let count = 0;
      while (remaining <= 0 && count++ < 8) remaining += beat();
    },
    pause() {
      playing = false;
      silence();
    },
    resume() {
      playing = true;
      remaining = 0;
    },
    setEnabled(value) {
      enabled = !!value;
      if (!enabled) silence();
    },
    snapshot: () => ({
      enabled,
      playing,
      sector,
      boss: ['boss', 'enraged', 'collapse'].includes(mode),
      mode,
      step,
      voices: voices.size,
    }),
    destroy() {
      playing = false;
      silence();
      master?.disconnect?.();
      filter?.disconnect?.();
      compressor?.disconnect?.();
      master = null;
    },
  };
}
