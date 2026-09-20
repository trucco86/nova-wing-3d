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

export function createMusic(context) {
  let master = null,
    step = 0,
    remaining = 0,
    enabled = true,
    playing = false,
    sector = 0,
    boss = false;
  const voices = new Set();
  function silence() {
    for (const o of voices) {
      try {
        o.stop();
      } catch {
        /* Already ended. */
      }
      o.disconnect?.();
    }
    voices.clear();
  }
  function note(freq, duration, type, volume) {
    if (!enabled || !playing || !master || voices.size >= 64) return;
    const now = context.currentTime,
      o = context.createOscillator(),
      g = context.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.connect(g);
    g.connect(master);
    voices.add(o);
    o.onended = () => {
      voices.delete(o);
      o.disconnect?.();
      g.disconnect?.();
    };
    o.start(now);
    o.stop(now + duration + 0.03);
  }
  function beat() {
    const t = boss ? BOSS_TRACK : TRACKS[sector],
      d = 60 / t.bpm / 2,
      s = step % 16,
      f = (oct, n) => t.base * oct * 2 ** (n / 12);
    if (s % 2 === 0) note(f(0.5, t.bass[(s / 2) % 8]), d * 1.8, t.wave, 0.12);
    if (boss) {
      if (s % 2 === 0) note(f(0.25, t.bass[(s / 2) % 8]), d * 2, 'triangle', 0.1);
      if (s % 4 === 0) {
        note(f(1, t.scale[step % 7]), d * 1.6, 'square', 0.035);
        note(f(1, t.scale[(step + 2) % 7]), d * 1.6, 'square', 0.03);
      }
      if (s % 2 === 1) note(f(2, t.scale[(step * 2) % 7]), d * 1.2, 'sawtooth', 0.035);
    } else if (s % 2 === 1 || s % 4 === 0)
      note(f(step % 32 < 16 ? 1 : 2, t.scale[(step * 3 + (s % 5)) % 7]), d * 1.1, 'square', 0.045);
    if (s % 4 === 0) note(55, 0.09, 'sine', 0.16);
    else note(f(4, t.scale[s % 7]), 0.035, 'triangle', 0.016);
    step++;
    return d;
  }
  return {
    start(index = 0, isBoss = false) {
      silence();
      sector = Math.max(0, Math.min(9, index));
      boss = isBoss;
      step = 0;
      remaining = 0;
      playing = true;
      if (!master) {
        master = context.createGain();
        master.gain.value = 0.4;
        master.connect(context.destination);
      }
    },
    update(dt) {
      if (!playing || !enabled) return;
      remaining -= dt;
      if (remaining <= 0) remaining += beat();
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
    snapshot: () => ({ enabled, playing, sector, boss, step, voices: voices.size }),
    destroy() {
      playing = false;
      silence();
      master?.disconnect?.();
      master = null;
    },
  };
}
