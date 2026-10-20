export const PILOT_PROFILES = [
  {
    id: 'bia',
    name: 'BIA',
    role: 'COMANDANTE VANGUARDA',
    specialty: 'attack',
    skill: 'Sobrecarga',
    description: 'A gatinha preta que lidera o esquadrão. Potência ofensiva e tiros carregados.',
    color: '#67ffe0',
    stats: { attack: 5, defense: 3, agility: 4, force: 4, vitality: 3, spirit: 2 },
    bonuses: { damage: 1.12, shield: 1, speed: 1.04, arcana: 1, bomb: 1.08 },
  },
  {
    id: 'bob',
    name: 'BOB',
    role: 'GUARDIÃO DE CERCO',
    specialty: 'defense',
    skill: 'Muralha orbital',
    description:
      'Gato preto, um pouco menor que Christopher. Escudo e vida para combates prolongados.',
    color: '#77b8ff',
    stats: { attack: 3, defense: 5, agility: 2, force: 4, vitality: 5, spirit: 2 },
    bonuses: { damage: 1, shield: 1.22, speed: 0.96, arcana: 1, bomb: 1.05 },
  },
  {
    id: 'christopher',
    name: 'CHRISTOPHER',
    role: 'ARTILHEIRO PESADO',
    specialty: 'attack',
    skill: 'Impacto gravitacional',
    description: 'O maior e mais forte dos gatos. Casco resistente e bombas de alto impacto.',
    color: '#ffbf5e',
    stats: { attack: 4, defense: 4, agility: 2, force: 5, vitality: 4, spirit: 2 },
    bonuses: { damage: 1.08, shield: 1.08, speed: 0.94, arcana: 0.96, bomb: 1.35 },
  },
  {
    id: 'calvin',
    name: 'CALVINHO',
    role: 'MÍSTICO DO VAZIO',
    specialty: 'spirit',
    skill: 'Fluxo arcano',
    description:
      'Pequeno e com pouco pelo. Recarga espiritual acelerada para dominar os especiais.',
    color: '#c28aff',
    stats: { attack: 3, defense: 2, agility: 3, force: 2, vitality: 3, spirit: 5 },
    bonuses: { damage: 1, shield: 1, speed: 1.02, arcana: 1.28, bomb: 1.12 },
  },
  {
    id: 'jenifer',
    name: 'JENIFER',
    role: 'INTERCEPTADORA',
    specialty: 'attack',
    skill: 'Instinto de caça',
    description:
      'Gata cinza do tamanho da Bia. Ágil para perseguir alvos e escapar do fogo inimigo.',
    color: '#ff718f',
    stats: { attack: 4, defense: 2, agility: 5, force: 3, vitality: 3, spirit: 3 },
    bonuses: { damage: 1.06, shield: 0.96, speed: 1.14, arcana: 1.05, bomb: 1 },
  },
];

export const SHIP_MODELS = [
  {
    id: 'nova7',
    name: 'NOVA-7',
    role: 'MULTIFUNÇÃO',
    description: 'Chassi equilibrado com boa resposta em qualquer especialidade.',
    stats: { attack: 0, defense: 0, agility: 0 },
  },
  {
    id: 'specter',
    name: 'SPECTER-X',
    role: 'INTERCEPTADOR',
    description: 'Asas compactas, aceleração superior e menor blindagem.',
    stats: { attack: 0, defense: -1, agility: 1 },
  },
  {
    id: 'aegis',
    name: 'AEGIS-R',
    role: 'FORTALEZA',
    description: 'Placas reforçadas e estabilidade, com resposta mais pesada.',
    stats: { attack: 0, defense: 1, agility: -1 },
  },
];

export const SHIP_COLORS = [
  { id: 'polar', name: 'POLAR', color: '#c4d5e3', accent: '#15243e' },
  { id: 'mint', name: 'MINT', color: '#63e7c3', accent: '#0c3d46' },
  { id: 'cobalt', name: 'COBALTO', color: '#5f91ed', accent: '#142b55' },
  { id: 'crimson', name: 'CARMESIM', color: '#e65f70', accent: '#4a1726' },
  { id: 'gold', name: 'OURO', color: '#e7bd63', accent: '#4a3316' },
];

export function readPilotLoadout(value) {
  // Preserve checkpoints created before the corrected roster.
  const pilotId = value?.pilot === 'antonio' ? 'christopher' : value?.pilot;
  const pilot = PILOT_PROFILES.some((p) => p.id === pilotId) ? pilotId : 'bia';
  const ship = SHIP_MODELS.some((p) => p.id === value?.ship) ? value.ship : 'nova7';
  const color = SHIP_COLORS.some((entry) => entry.id === value?.color) ? value.color : 'polar';
  return { pilot, ship, color };
}

export const pilotAt = (id) => PILOT_PROFILES.find((p) => p.id === id) ?? PILOT_PROFILES[0];
export const shipAt = (id) => SHIP_MODELS.find((p) => p.id === id) ?? SHIP_MODELS[0];
export const shipColorAt = (id) => SHIP_COLORS.find((p) => p.id === id) ?? SHIP_COLORS[0];
