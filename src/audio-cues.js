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
  // Three sonic layers: a brief metallic snap, a mid-range cannon body,
  // and a small-speaker-friendly bass punch. Short noise tails prevent
  // the repeated pulse from reading as a vintage laser beep.
  shot: {
    cooldown: 0.088,
    tones: [
      {
        from: 1470,
        to: 470,
        duration: 0.055,
        gain: 0.032,
        wave: 'sawtooth',
        filter: 3800,
        attack: 0.002,
      },
      {
        from: 410,
        to: 112,
        duration: 0.155,
        gain: 0.064,
        wave: 'triangle',
        filter: 1450,
        attack: 0.004,
      },
      { from: 145, to: 61, duration: 0.19, gain: 0.041, wave: 'sine', attack: 0.006 },
      // Mechanical pressure rebound gives the post-attack 110-280ms interval
      // actual body on speakers; the short original tail had 0.0003 RMS.
      {
        from: 235,
        to: 69,
        delay: 0.068,
        duration: 0.27,
        gain: 0.078,
        wave: 'triangle',
        filter: 880,
        attack: 0.009,
      },
    ],
    noises: [
      {
        duration: 0.044,
        gain: 0.082,
        filterType: 'bandpass',
        filter: 3100,
        filterEnd: 960,
        q: 0.75,
      },
      { color: 'brown', duration: 0.15, gain: 0.06, filter: 850, filterEnd: 210, attack: 0.009 },
    ],
  },
  // The robot fires a larger cannon with a distinct mechanical tail.
  mechaShot: {
    cooldown: 0.125,
    tones: [
      {
        from: 960,
        to: 215,
        duration: 0.11,
        gain: 0.045,
        wave: 'sawtooth',
        filter: 2600,
        attack: 0.003,
      },
      {
        from: 275,
        to: 59,
        duration: 0.255,
        gain: 0.078,
        wave: 'triangle',
        filter: 1050,
        attack: 0.004,
      },
      { from: 106, to: 42, duration: 0.285, gain: 0.063, wave: 'sine', attack: 0.005 },
    ],
    noises: [
      {
        duration: 0.066,
        gain: 0.085,
        filterType: 'bandpass',
        filter: 2400,
        filterEnd: 560,
        q: 0.7,
      },
      { color: 'brown', delay: 0.024, duration: 0.2, gain: 0.07, filter: 760, filterEnd: 130 },
    ],
  },
  mechaImpact: {
    cooldown: 0.18,
    tones: [
      { from: 170, to: 48, duration: 0.19, gain: 0.058, wave: 'triangle' },
      { from: 920, to: 260, duration: 0.085, gain: 0.022, wave: 'sawtooth', filter: 2400 },
    ],
    noises: [{ duration: 0.13, gain: 0.09, filterType: 'bandpass', filter: 1700, filterEnd: 320 }],
  },
  mechaPrecision: {
    cooldown: 0.5,
    tones: [
      { from: 1350, to: 350, duration: 0.19, gain: 0.053, wave: 'sawtooth', filter: 3000 },
      { from: 280, to: 52, duration: 0.34, gain: 0.092, wave: 'triangle', filter: 1600 },
      { from: 100, to: 38, duration: 0.4, gain: 0.072, wave: 'sine' },
    ],
    noises: [{ duration: 0.25, gain: 0.11, filterType: 'bandpass', filter: 2350, filterEnd: 370 }],
  },
  mechaChargeRelease: {
    cooldown: 0.28,
    tones: [
      { from: 1250, to: 180, duration: 0.33, gain: 0.065, wave: 'sawtooth', filter: 2900 },
      { from: 245, to: 48, duration: 0.46, gain: 0.095, wave: 'triangle', filter: 1200 },
      { from: 90, to: 32, duration: 0.48, gain: 0.082, wave: 'sine' },
    ],
    noises: [{ duration: 0.34, gain: 0.12, filterType: 'bandpass', filter: 2600, filterEnd: 180 }],
  },
  // Short mechanical ignition when holding FIRE begins; the continuous
  // level-aware charge layer below handles the actual rising energy.
  plasmaCharge: {
    cooldown: 0.4,
    tones: [
      {
        from: 125,
        to: 320,
        duration: 0.24,
        gain: 0.031,
        wave: 'triangle',
        filter: 920,
        attack: 0.075,
      },
      { from: 70, to: 115, duration: 0.26, gain: 0.024, wave: 'sine', attack: 0.06 },
    ],
    noises: [
      {
        duration: 0.27,
        gain: 0.042,
        attack: 0.095,
        filterType: 'bandpass',
        filter: 320,
        filterEnd: 1650,
        q: 0.62,
      },
    ],
  },
  // The release must feel larger than the charging sound: initial magnetic
  // snap, pressure-wave body, sub pulse, and a brief spent-energy rumble.
  plasmaRelease: {
    cooldown: 0.16,
    tones: [
      {
        from: 1220,
        to: 330,
        duration: 0.12,
        gain: 0.048,
        wave: 'sawtooth',
        filter: 3300,
        attack: 0.002,
      },
      {
        from: 370,
        to: 67,
        duration: 0.39,
        gain: 0.083,
        wave: 'triangle',
        filter: 1450,
        attack: 0.004,
      },
      { from: 118, to: 37, duration: 0.53, gain: 0.078, wave: 'sine', attack: 0.006 },
    ],
    noises: [
      { duration: 0.13, gain: 0.12, filterType: 'bandpass', filter: 2800, filterEnd: 460, q: 0.62 },
      {
        color: 'brown',
        delay: 0.027,
        duration: 0.47,
        gain: 0.095,
        filter: 1050,
        filterEnd: 135,
        attack: 0.012,
      },
    ],
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
// Stage-1 destruction sound design. Synthetic originals keep the game fully
// offline, avoid large downloaded recordings and respect the existing SFX bus.
// Each event has a deliberately different body (metal, vehicle, concrete,
// electrical alert, rail scrape, train collapse).
Object.assign(AUDIO_CUES, {
  cityMetalDrop: {
    cooldown: 0.36,
    tones: [
      {
        from: 670,
        to: 118,
        duration: 0.22,
        gain: 0.028,
        wave: 'triangle',
        filter: 2100,
        pan: -0.38,
      },
      { from: 172, to: 58, duration: 0.32, gain: 0.033, wave: 'sine', pan: -0.38 },
    ],
    noises: [
      {
        duration: 0.3,
        gain: 0.075,
        filterType: 'bandpass',
        filter: 2900,
        filterEnd: 390,
        pan: -0.38,
      },
    ],
  },
  cityConcreteDebris: {
    cooldown: 0.5,
    tones: [
      { from: 205, to: 63, duration: 0.4, gain: 0.041, wave: 'triangle', pan: -0.41 },
      { from: 93, to: 34, duration: 0.7, gain: 0.054, wave: 'sine', pan: -0.41 },
    ],
    noises: [
      { duration: 0.73, gain: 0.11, color: 'brown', filter: 890, filterEnd: 145, pan: -0.41 },
    ],
  },
  cityVehicleCrash: {
    cooldown: 0.55,
    tones: [
      { from: 920, to: 180, duration: 0.28, gain: 0.028, wave: 'sawtooth', filter: 3000, pan: 0.4 },
      { from: 116, to: 35, duration: 0.68, gain: 0.065, wave: 'sine', pan: 0.36 },
    ],
    noises: [
      { duration: 0.68, gain: 0.12, color: 'brown', filter: 1250, filterEnd: 130, pan: 0.38 },
    ],
  },
  cityFacadeCollapse: {
    cooldown: 0.7,
    tones: [{ from: 145, to: 38, duration: 0.85, gain: 0.064, wave: 'sine', pan: -0.42 }],
    noises: [
      { duration: 0.98, gain: 0.13, color: 'brown', filter: 760, filterEnd: 105, pan: -0.42 },
    ],
  },
  cityTrainAlarm: {
    cooldown: 2.3,
    tones: [
      { from: 520, to: 520, duration: 0.14, gain: 0.034, wave: 'triangle', pan: 0.3 },
      { from: 520, to: 520, delay: 0.23, duration: 0.14, gain: 0.034, wave: 'triangle', pan: 0.3 },
      { from: 410, to: 390, delay: 0.48, duration: 0.2, gain: 0.03, wave: 'sine', pan: 0.3 },
    ],
  },
  cityRailTear: {
    cooldown: 0.8,
    tones: [
      {
        from: 1250,
        to: 95,
        duration: 0.82,
        gain: 0.038,
        wave: 'sawtooth',
        filter: 2200,
        pan: -0.17,
      },
    ],
    noises: [
      {
        duration: 0.75,
        gain: 0.09,
        filterType: 'bandpass',
        filter: 3300,
        filterEnd: 310,
        pan: -0.17,
      },
    ],
  },
  cityTrainCrash: {
    cooldown: 1.1,
    tones: [
      { from: 105, to: 32, duration: 1.05, gain: 0.082, wave: 'sine', pan: -0.18 },
      { from: 270, to: 65, delay: 0.08, duration: 0.55, gain: 0.04, wave: 'triangle', pan: -0.18 },
    ],
    noises: [
      { duration: 1.12, gain: 0.16, color: 'brown', filter: 1450, filterEnd: 95, pan: -0.18 },
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
    engineActive = false,
    chargeLoop,
    chargeActive = false,
    chargeProgress = -1,
    shotVariant = 0;
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
  // Unlike a one-shot beep, charging has continuous timbre and amplitude.
  // One set of cached Web Audio nodes follows the real charge meter, with
  // no interval, no per-frame source creation and no sound after pause.
  function prepareCharge() {
    if (chargeLoop) return true;
    const buffer = noiseBuffer(context, 'white');
    if (!buffer || !context.createBiquadFilter || !context.createOscillator) return false;
    const bass = context.createOscillator();
    const flux = context.createOscillator();
    const hiss = context.createBufferSource();
    const fluxFilter = context.createBiquadFilter();
    const hissFilter = context.createBiquadFilter();
    const bassGain = context.createGain();
    const fluxGain = context.createGain();
    const hissGain = context.createGain();
    bass.type = 'triangle';
    flux.type = 'sawtooth';
    hiss.buffer = buffer;
    hiss.loop = true;
    fluxFilter.type = 'lowpass';
    fluxFilter.frequency.value = 800;
    hissFilter.type = 'bandpass';
    hissFilter.frequency.value = 450;
    hissFilter.Q.value = 0.65;
    bassGain.gain.value = fluxGain.gain.value = hissGain.gain.value = 0;
    bass.connect(bassGain);
    bassGain.connect(bus);
    flux.connect(fluxFilter);
    fluxFilter.connect(fluxGain);
    fluxGain.connect(bus);
    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(bus);
    bass.start();
    flux.start();
    hiss.start();
    chargeLoop = {
      bass,
      flux,
      hiss,
      fluxFilter,
      hissFilter,
      bassGain,
      fluxGain,
      hissGain,
    };
    return true;
  }
  function chargeOff() {
    if (!chargeActive) return;
    chargeActive = false;
    chargeProgress = -1;
    const now = context.currentTime || 0;
    for (const node of [chargeLoop.bassGain, chargeLoop.fluxGain, chargeLoop.hissGain]) {
      if (node.gain.setTargetAtTime) node.gain.setTargetAtTime(0, now, 0.018);
      else node.gain.value = 0;
    }
  }
  function setCharge({ active = false, progress = 0 } = {}) {
    const suspended = context.state === 'suspended' && typeof context.startRendering !== 'function';
    if (!active || !enabled || destroyed || !level || suspended) {
      chargeOff();
      return;
    }
    if (!prepareCharge()) return;
    const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
    if (chargeActive && Math.abs(p - chargeProgress) < 0.045) return;
    chargeActive = true;
    chargeProgress = p;
    const now = context.currentTime || 0;
    const smooth = (param, value) => {
      if (param.setTargetAtTime) param.setTargetAtTime(value, now, 0.055);
      else param.value = value;
    };
    // Rising, filtered bass/metallic current/hiss build physical pressure.
    // Energy ramps continuously until FIRE is released or the game pauses.
    smooth(chargeLoop.bass.frequency, 68 + 105 * p);
    smooth(chargeLoop.flux.frequency, 190 + 360 * p);
    smooth(chargeLoop.fluxFilter.frequency, 770 + 1620 * p);
    smooth(chargeLoop.hissFilter.frequency, 430 + 2200 * p);
    smooth(chargeLoop.bassGain.gain, 0.012 + 0.028 * p);
    smooth(chargeLoop.fluxGain.gain, 0.01 + 0.024 * p);
    smooth(chargeLoop.hissGain.gain, 0.012 + 0.026 * p);
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
    // A subtle, deterministic ±2% pitch rotation gives rapid volleys some
    // natural articulation without random bursts or extra source allocation.
    const pitch =
      name === 'shot'
        ? [0.982, 1.014, 0.991, 1.024][shotVariant++ % 4]
        : name === 'mechaShot'
          ? [0.988, 1.012][shotVariant++ % 2]
          : 1;
    for (const tone of cue.tones)
      pool.tone(pitch === 1 ? tone : { ...tone, from: tone.from * pitch, to: tone.to * pitch });
    for (const noise of cue.noises || []) pool.noise(noise);
    return true;
  }
  function silence() {
    pool.silence();
    engineOff();
    chargeOff();
  }
  return {
    play,
    setFlight,
    setCharge,
    silence,
    setEnabled(value) {
      enabled = !!value;
      if (!enabled) {
        pool.silence();
        engineOff();
        chargeOff();
      }
    },
    setVolume(value) {
      level = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
      output.gain.value = 0.7 * level;
      if (level === 0) {
        pool.silence();
        engineOff();
        chargeOff();
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      pool.silence();
      engineOff();
      chargeOff();
      if (chargeLoop) {
        for (const source of [chargeLoop.bass, chargeLoop.flux, chargeLoop.hiss]) source.stop();
        for (const node of Object.values(chargeLoop)) node.disconnect?.();
        chargeLoop = null;
      }
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
      chargeActive,
      chargeProgress: chargeActive ? chargeProgress : 0,
      lastCue,
    }),
  };
}
