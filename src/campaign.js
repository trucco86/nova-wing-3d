// Names and narrative adapted from Cristian Trucco's Nova Wing (MIT).
export const SECTORS = [
  {
    name: 'CIDADE DAS MÁQUINAS',
    boss: 'CAÇA-LÍDER ROK',
    kind: 'carrier',
    theme: 'city',
    accent: '#39ffb0',
    sky: '#041711',
    duration: 65,
    brief: 'Bia, liberte a costa. As torres alimentam a frota de Marvin.',
  },
  {
    name: 'DISTRITO PORTUÁRIO',
    boss: 'NAVE-FERRÃO',
    kind: 'stingray',
    theme: 'ocean',
    accent: '#48e5ff',
    sky: '#042036',
    duration: 70,
    brief: 'Bob detectou uma máquina colossal sob o porto. Proteja a rota de fuga.',
  },
  {
    name: 'CINTURÃO DE DESTROÇOS',
    boss: 'PERFURADOR',
    kind: 'drill',
    theme: 'asteroids',
    accent: '#ff6ddd',
    sky: '#1b092d',
    duration: 70,
    brief: 'Subindo para a órbita. Atravesse os destroços sem perder os pods.',
  },
  {
    name: 'ESTAÇÃO ÓRBITA-9',
    boss: 'FORTALEZA ÓRBITA',
    kind: 'station',
    theme: 'station',
    accent: '#5dffee',
    sky: '#06262c',
    duration: 75,
    brief: 'Christopher encontrou o núcleo da estação. Desative os geradores externos.',
  },
  {
    name: 'TEMPESTADE DE DADOS',
    boss: 'FÊNIX DE PLASMA',
    kind: 'phoenix',
    theme: 'sun',
    accent: '#ff9a45',
    sky: '#2c0d04',
    duration: 75,
    brief: 'A rede entrou em colapso. Cuidado com as rajadas de plasma.',
  },
  {
    name: 'SETOR CONGELADO',
    boss: 'COLOSSO GLACIAL',
    kind: 'mech',
    theme: 'ice',
    accent: '#a3eaff',
    sky: '#08253f',
    duration: 80,
    brief: 'Bloco dois. Um colosso protege os depósitos de energia de Marvin.',
  },
  {
    name: 'NÚCLEO PÚRPURA',
    boss: 'COLMEIA VIVA',
    kind: 'hydra',
    theme: 'nebula',
    accent: '#d36aff',
    sky: '#200535',
    duration: 80,
    brief: 'A biofrota reage aos nossos sinais. Quebre as cabeças da colmeia.',
  },
  {
    name: 'GRADE DE BATALHA',
    boss: 'COURAÇADO ÔMEGA',
    kind: 'dreadnought',
    theme: 'fleet',
    accent: '#a18aff',
    sky: '#100b29',
    duration: 85,
    brief: 'Toda a frota está aqui. Guarde uma bomba para a barragem.',
  },
  {
    name: 'ABISMO DE ÓRION',
    boss: 'NÚCLEO BASTIÃO',
    kind: 'orbital',
    theme: 'void',
    accent: '#ba7aff',
    sky: '#11051f',
    duration: 85,
    brief: 'Sem sinal da Terra. Siga o disco de acreção até o Bastião.',
  },
  {
    name: 'TRONO DE MARVIN',
    boss: 'IMPERADOR MARVIN',
    kind: 'emperor',
    theme: 'throne',
    accent: '#ff4e79',
    sky: '#23030d',
    duration: 90,
    brief: 'Five Cats reunidos. A Devastador está à frente. Termine esta guerra.',
  },
];
export const PILOTS = ['BIA', 'BOB', 'CHRISTOPHER'];
export const WEAPONS = [
  'PULSO MK-I',
  'GÊMEO MK-II',
  'TRÍADE MK-III',
  'PLASMA VÓRTICE',
  'PLASMA NOVA',
  'ANIQUILADOR Ω',
];
export const SHOT_COUNTS = [2, 2, 3, 4, 6, 8];
export const WEAPON_COLORS = ['#64ffe4', '#4cecff', '#64c8ff', '#8d91ff', '#d37bff', '#ff60d2'];
export const SHOP = {
  weapon: { label: 'CANHÃO', base: 180, max: 5 },
  armor: { label: 'BLINDAGEM', base: 120, max: 4 },
  pods: { label: 'POD ORBITAL', base: 220, max: 3 },
  repair: { label: 'REPARAR ESCUDO', base: 70, max: 99 },
  bomb: { label: 'BOMBA', base: 90, max: 5 },
};
export function shopPrice(kind, level = 0) {
  return SHOP[kind] ? SHOP[kind].base * (1 + level) : Infinity;
}
export function readSave(storage) {
  try {
    const d = JSON.parse(storage?.getItem('nova-wing-3d-v1') ?? 'null');
    if (!d || d.version !== 1) return null;
    const integer = (n, a, b) => Number.isInteger(n) && n >= a && n <= b;
    if (
      !integer(d.sector, 0, 9) ||
      !integer(d.credits, 0, 1000000) ||
      !integer(d.weapon, 0, 5) ||
      !integer(d.armor, 0, 4) ||
      !integer(d.pods, 0, 3)
    )
      return null;
    return {
      version: 1,
      sector: d.sector,
      credits: d.credits,
      weapon: d.weapon,
      armor: d.armor,
      pods: d.pods,
    };
  } catch {
    return null;
  }
}
export function writeSave(storage, data) {
  try {
    storage?.setItem('nova-wing-3d-v1', JSON.stringify({ version: 1, ...data }));
    return !!storage;
  } catch {
    return false;
  }
}
