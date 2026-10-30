import { createVoicePool, noiseBuffer } from './audio-synth.js';
// Original procedural mechanical effects; no runtime downloads or licensed recordings.
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
// Physical transients and staged mechanical events replace electronic beeps.
Object.assign(AUDIO_CUES, {
  shot: {
    cooldown: 0.085,
    tones: [
      { from: 1120, to: 320, duration: 0.075, gain: 0.029, wave: 'sawtooth', filter: 2900 },
      { from: 290, to: 96, duration: 0.145, gain: 0.052, wave: 'triangle', filter: 1350 },
      { from: 135, to: 65, duration: 0.12, gain: 0.021, wave: 'sine' },
    ],
    noises: [
      { duration: 0.055, gain: 0.06, filterType: 'bandpass', filter: 2500, filterEnd: 760 },
    ],
  },
  plasmaCharge: {
    cooldown: 0.5,
    tones: [
      { from: 95, to: 380, duration: 0.65, gain: 0.035, wave: 'sine' },
      { from: 190, to: 570, duration: 0.6, gain: 0.015, wave: 'triangle', filter: 900 },
    ],
    noises: [
      {
        duration: 0.65,
        gain: 0.055,
        attack: 0.14,
        filterType: 'bandpass',
        filter: 160,
        filterEnd: 1500,
      },
    ],
  },
  plasmaRelease: {
    cooldown: 0.16,
    tones: [
      { from: 330, to: 65, duration: 0.42, gain: 0.06, wave: 'triangle', filter: 1000 },
      { from: 95, to: 34, duration: 0.6, gain: 0.075, wave: 'sine' },
    ],
    noises: [{ duration: 0.48, gain: 0.14, filter: 2400, filterEnd: 150 }],
  },
  explosion: {
    cooldown: 0.09,
    tones: [
      { from: 120, to: 32, duration: 0.8, gain: 0.09, wave: 'sine' },
      { from: 170, to: 54, duration: 0.35, gain: 0.035, wave: 'triangle', filter: 550 },
    ],
    noises: [
      { duration: 1.15, gain: 0.2, color: 'brown', filter: 1800, filterEnd: 90 },
      { duration: 0.15, gain: 0.075, filter: 2600, filterEnd: 650 },
    ],
  },
  weakPoint: {
    cooldown: 0.18,
    tones: [{ from: 780, to: 380, duration: 0.19, gain: 0.018, wave: 'sine' }],
    noises: [{ duration: 0.11, gain: 0.05, filterType: 'bandpass', filter: 1800, filterEnd: 500 }],
  },
  armorHit: {
    cooldown: 0.25,
    tones: [{ from: 290, to: 140, duration: 0.24, gain: 0.025, wave: 'triangle', filter: 650 }],
    noises: [
      { duration: 0.12, gain: 0.09, filterType: 'bandpass', filter: 2100, filterEnd: 700, q: 1.2 },
    ],
  },
  shipImpact: {
    cooldown: 0.4,
    tones: [
      { from: 135, to: 42, duration: 0.5, gain: 0.085, wave: 'sine' },
      { from: 470, to: 160, duration: 0.28, gain: 0.023, wave: 'triangle' },
    ],
    noises: [
      { duration: 0.35, gain: 0.15, filter: 1700, filterEnd: 160 },
      {
        delay: 0.045,
        duration: 0.16,
        gain: 0.065,
        filterType: 'bandpass',
        filter: 2700,
        filterEnd: 1200,
      },
    ],
  },
  transformRobot: {
    cooldown: 0.65,
    tones: [
      { from: 190, to: 570, duration: 0.21, gain: 0.03, wave: 'sawtooth', filter: 1000 },
      {
        from: 540,
        to: 160,
        delay: 0.17,
        duration: 0.29,
        gain: 0.035,
        wave: 'triangle',
        filter: 1100,
      },
      { from: 95, to: 38, delay: 0.43, duration: 0.45, gain: 0.085, wave: 'sine' },
    ],
    noises: [
      {
        duration: 0.22,
        gain: 0.1,
        filterType: 'bandpass',
        filter: 450,
        filterEnd: 1900,
        q: 1.4,
        pan: -0.25,
      },
      {
        delay: 0.19,
        duration: 0.21,
        gain: 0.11,
        filterType: 'bandpass',
        filter: 1700,
        filterEnd: 350,
        pan: 0.25,
      },
      { delay: 0.43, duration: 0.2, gain: 0.14, filter: 2200, filterEnd: 220 },
    ],
  },
  transformShip: {
    cooldown: 0.65,
    tones: [
      { from: 520, to: 170, duration: 0.25, gain: 0.03, wave: 'sawtooth', filter: 1000 },
      { from: 130, to: 430, delay: 0.21, duration: 0.25, gain: 0.028, wave: 'triangle' },
      { from: 85, to: 42, delay: 0.46, duration: 0.36, gain: 0.07, wave: 'sine' },
    ],
    noises: [
      {
        duration: 0.25,
        gain: 0.095,
        filterType: 'bandpass',
        filter: 1800,
        filterEnd: 380,
        pan: 0.25,
      },
      {
        delay: 0.22,
        duration: 0.22,
        gain: 0.09,
        filterType: 'bandpass',
        filter: 400,
        filterEnd: 1600,
        pan: -0.25,
      },
      { delay: 0.46, duration: 0.14, gain: 0.12, filter: 2000, filterEnd: 300 },
    ],
  },
  boostIgnition: {
    cooldown: 0.7,
    tones: [{ from: 65, to: 120, duration: 0.4, gain: 0.065, wave: 'sine' }],
    noises: [
      { duration: 0.65, gain: 0.16, color: 'brown', filter: 180, filterEnd: 1600, attack: 0.035 },
    ],
  },
});
const LIMIT = 32;

export function createAudioCues(context) {
  const output = context.createGain();
  const bus = context.createGain();
  output.gain.value = 0.7;
  let compressor;
  if (context.createDynamicsCompressor) {
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 5;
    bus.connect(compressor);
    compressor.connect(output);
  } else bus.connect(output);
  output.connect(context.destination);
  const pool = createVoicePool(context, bus, LIMIT);
  const lastPlayed = new Map();
  let destroyed = false,
    enabled = true,
    level = 1,
    lastCue = null,
    engine,
    engineActive = false;
  function engineOff() {
    if (!engineActive) return;
    engineActive = false;
    if (engine) {
      engine.mode = null;
      engine.gain.gain.cancelScheduledValues?.(context.currentTime);
      engine.gain.gain.setValueAtTime(0, context.currentTime);
    }
  }
  function prepareEngine() {
    const buffer = noiseBuffer(context);
    if (!buffer || !context.createBiquadFilter) return false;
    const noise = context.createBufferSource(),
      low = context.createBiquadFilter();
    const high = context.createBiquadFilter(),
      hum = context.createOscillator();
    const humGain = context.createGain(),
      gain = context.createGain();
    high.type = 'highpass';
    high.frequency.value = 32;
    low.type = 'lowpass';
    low.frequency.value = 350;
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(high);
    high.connect(low);
    low.connect(gain);
    hum.type = 'triangle';
    hum.frequency.value = 82;
    humGain.gain.value = 0.16;
    hum.connect(humGain);
    humGain.connect(gain);
    gain.connect(bus);
    gain.gain.value = 0;
    noise.start();
    hum.start();
    engine = { noise, low, high, hum, humGain, gain };
    return true;
  }
  function setFlight({ active = false, boosting = false, robot = false } = {}) {
    const suspended = context.state === 'suspended' && typeof context.startRendering !== 'function';
    if (!active || !enabled || destroyed || level === 0 || suspended) {
      engineOff();
      return;
    }
    if (!engine && !prepareEngine()) return;
    const mode = boosting ? 'boost' : robot ? 'robot' : 'cruise';
    if (engineActive && engine.mode === mode) return;
    engineActive = true;
    engine.mode = mode;
    const now = context.currentTime;
    const smooth = (param, value, time) => {
      if (param.setTargetAtTime) param.setTargetAtTime(value, now, time);
      else param.value = value;
    };
    smooth(engine.gain.gain, boosting ? 0.22 : robot ? 0.105 : 0.055, 0.12);
    smooth(engine.low.frequency, boosting ? 1450 : robot ? 520 : 350, 0.16);
    smooth(engine.hum.frequency, boosting ? 145 : robot ? 62 : 82, 0.13);
    smooth(engine.noise.playbackRate, boosting ? 1.45 : robot ? 0.85 : 1, 0.16);
  }
  function play(name, { enabled: allowed = true, active = true } = {}) {
    const cue = AUDIO_CUES[name];
    if (
      !cue ||
      destroyed ||
      !enabled ||
      level === 0 ||
      !allowed ||
      !active ||
      (context.state === 'suspended' && typeof context.startRendering !== 'function')
    )
      return false;
    const now = context.currentTime || 0;
    if (now - (lastPlayed.get(name) ?? -Infinity) < cue.cooldown) return false;
    if (pool.count() + cue.tones.length + (cue.noises?.length || 0) > LIMIT) {
      if (
        ['transformRobot', 'transformShip', 'shipImpact', 'critical', 'boostIgnition'].includes(
          name,
        )
      )
        pool.silence();
      else return false;
    }
    lastPlayed.set(name, now);
    lastCue = name;
    for (const tone of cue.tones) pool.tone(tone);
    for (const noise of cue.noises || []) pool.noise(noise);
    return true;
  }
  function silence() {
    pool.silence();
    engineOff();
  }
  return {
    play,
    setFlight,
    silence,
    setEnabled(value) {
      enabled = !!value;
      if (!enabled) {
        pool.silence();
        engineOff();
      }
    },
    setVolume(value) {
      level = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
      output.gain.value = 0.7 * level;
      if (level === 0) {
        pool.silence();
        engineOff();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pool.silence();
      engineOff();
      if (engine) {
        engine.noise.stop();
        engine.hum.stop();
        for (const node of Object.values(engine)) node?.disconnect?.();
        engine = null;
      }
      bus.disconnect();
      output.disconnect();
      compressor?.disconnect();
      lastPlayed.clear();
    },
    snapshot: () => ({
      voices: pool.count(),
      destroyed,
      engineActive,
      engineMode: engineActive ? engine.mode : null,
      lastCue,
    }),
  };
}
