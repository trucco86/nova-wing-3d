const TAU = Math.PI * 2;

export const SUBBOSS_TACTICS = [
  {
    attack: 'RAJADA FRONTAL',
    motion: 'strafe',
    color: '#ff784f',
    cadence: 0.94,
    approach: 2.25,
    anchorZ: -82,
    aim: [0],
    spell: '',
  },
  {
    attack: 'PINÇA ABISSAL',
    motion: 'sweep',
    color: '#59dcff',
    cadence: 0.88,
    approach: 2.45,
    anchorZ: -88,
    aim: [-8, 8],
    spell: 'arcane',
  },
  {
    attack: 'ESPIRAL PERFURANTE',
    motion: 'spiral',
    color: '#ffc04f',
    cadence: 0.9,
    approach: 2.65,
    anchorZ: -76,
    aim: [0],
    spell: 'fire',
  },
  {
    attack: 'CRUZ LASER',
    motion: 'cross',
    color: '#a5a7ff',
    cadence: 1.02,
    approach: 2.3,
    anchorZ: -92,
    aim: [-6, 6],
    spell: 'arcane',
  },
  {
    attack: 'MERGULHO SOLAR',
    motion: 'dive',
    color: '#ff5b35',
    cadence: 0.84,
    approach: 2.5,
    anchorZ: -80,
    aim: [0],
    spell: 'fire',
  },
  {
    attack: 'MARTELO GLACIAL',
    motion: 'hammer',
    color: '#8deaff',
    cadence: 1.08,
    approach: 2.15,
    anchorZ: -86,
    aim: [-10, 0, 10],
    spell: '',
  },
  {
    attack: 'CAÇADA TRIPLA',
    motion: 'weave',
    color: '#7dffae',
    cadence: 0.82,
    approach: 2.6,
    anchorZ: -78,
    aim: [-7, 0, 7],
    spell: 'arcane',
  },
  {
    attack: 'BATERIA ÔMEGA',
    motion: 'siege',
    color: '#ff6f9b',
    cadence: 1.12,
    approach: 2.05,
    anchorZ: -96,
    aim: [-12, 0, 12],
    spell: 'fire',
  },
  {
    attack: 'PULSO PRISMÁTICO',
    motion: 'orbit',
    color: '#d178ff',
    cadence: 0.86,
    approach: 2.4,
    anchorZ: -84,
    aim: [-5, 5],
    spell: 'arcane',
  },
  {
    attack: 'COROA BALÍSTICA',
    motion: 'crown',
    color: '#ffd56d',
    cadence: 0.8,
    approach: 2.55,
    anchorZ: -90,
    aim: [-9, 0, 9],
    spell: 'fire',
  },
];

// The first urban subboss cannot remain in the player's camera lane indefinitely. 
// A timed retreat preserves the chance to defeat it while allowing the orbital chase.
export const FIRST_SUBBOSS_RETREAT = Object.freeze({ startAge: 22, duration: 4 });
export function firstSubbossDeparture(index, age) {
  const eligible = index === 0 && Number.isFinite(age) && age >= FIRST_SUBBOSS_RETREAT.startAge;
  const progress = eligible
    ? Math.min(1, Math.max(0, (age - FIRST_SUBBOSS_RETREAT.startAge) / FIRST_SUBBOSS_RETREAT.duration))
    : 0;
  return { retreating: eligible, complete: eligible && progress >= 1, progress };
}

export function subbossProfile(index = 0) {
  return SUBBOSS_TACTICS[
    ((index % SUBBOSS_TACTICS.length) + SUBBOSS_TACTICS.length) % SUBBOSS_TACTICS.length
  ];
}

export function subbossMotion(index, age, phase = 1, originX = 0, originY = 10) {
  const profile = subbossProfile(index);
  const pressure = 1 + (Math.max(1, phase) - 1) * 0.16;
  const t = Math.max(0, age);
  let x,
    y,
    bank,
    lunge = 0;
  switch (profile.motion) {
    case 'strafe':
      x = Math.sin(t * 1.65) * 22;
      y = Math.sin(t * 0.8) * 3;
      bank = Math.cos(t * 1.65) * 0.14;
      break;
    case 'sweep':
      x = Math.sin(t * 1.15) * 30;
      y = Math.cos(t * 1.8) * 7;
      bank = -Math.cos(t * 1.15) * 0.2;
      break;
    case 'spiral':
      x = Math.cos(t * 1.7) * 18;
      y = Math.sin(t * 1.7) * 12;
      bank = t * 0.35;
      break;
    case 'cross':
      x = Math.sin(t * 1.35) * 25;
      y = Math.sin(t * 2.7) * 8;
      bank = Math.sin(t * 2.7) * 0.16;
      break;
    case 'dive':
      x = Math.sin(t * 1.2) * 18;
      y = Math.cos(t * 1.45) * 12;
      lunge = Math.max(0, Math.sin(t * 1.45)) * 10;
      bank = Math.cos(t * 1.2) * 0.18;
      break;
    case 'hammer':
      x = Math.sin(t * 0.8) * 14;
      y = Math.abs(Math.sin(t * 1.1)) * 10 - 5;
      bank = Math.sin(t * 0.8) * 0.1;
      break;
    case 'weave':
      x = Math.sin(t * 2.1) * 27;
      y = Math.sin(t * 3.15) * 9;
      bank = Math.cos(t * 2.1) * 0.24;
      break;
    case 'siege':
      x = Math.sin(t * 0.65) * 12;
      y = Math.cos(t * 0.9) * 4;
      bank = Math.sin(t * 0.65) * 0.06;
      break;
    case 'orbit':
      x = Math.cos(t * 1.45) * 22;
      y = Math.sin(t * 1.45) * 13;
      bank = Math.sin(t * 1.45) * 0.2;
      break;
    default:
      x = Math.sin(t * 1.9) * 24;
      y = Math.cos(t * 0.95) * 10;
      lunge = Math.max(0, Math.sin((t * TAU) / 4.8)) * 7;
      bank = Math.sin(t * 1.9) * 0.2;
  }
  const approach = Math.exp(-profile.approach * t);
  const retreat = firstSubbossDeparture(index, t);
  const glide = retreat.progress * retreat.progress * (3 - 2 * retreat.progress);
  return {
    x: originX + x * pressure + glide * 18,
    y: originY + y * pressure + glide * 32,
    z: profile.anchorZ + (-200 - profile.anchorZ) * approach + lunge - glide * 280,
    bank: bank + glide * 0.22,
  };
}

export function subbossCooldown(index, phase = 1) {
  const base = [1.65, 1.22, 0.9][Math.max(1, Math.min(3, phase)) - 1];
  return base * subbossProfile(index).cadence;
}

export function subbossWindup(index, phase = 1) {
  return Math.max(0.42, 0.72 * subbossProfile(index).cadence - (Math.max(1, phase) - 1) * 0.06);
}
