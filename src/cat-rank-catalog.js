import { PILOT_PROFILES } from './pilots.js';

export const CAT_RANKS = Object.freeze([
  { title: 'Recruta', alias: 'Primeira Patrulha', threshold: 0, emblem: 'pata' },
  { title: 'Cadete', alias: 'Bigodes em Formação', threshold: 120, emblem: 'duas patas' },
  { title: 'Aspirante', alias: 'Primeira Garra', threshold: 310, emblem: 'garra' },
  { title: 'Tenente', alias: 'Asas de Órion', threshold: 550, emblem: 'duas garras' },
  { title: 'Capitão', alias: 'Guardião das Nove Vidas', threshold: 850, emblem: 'gato' },
  { title: 'Major', alias: 'Sentinela das Estrelas', threshold: 1230, emblem: 'gato e estrela' },
  { title: 'Comandante', alias: 'Líder da Patrulha', threshold: 1700, emblem: 'gato e duas estrelas' },
  { title: 'Coronel Estelar', alias: 'Garra de Órion', threshold: 2270, emblem: 'gato alado' },
  { title: 'General de Esquadra', alias: 'Nove Galáxias', threshold: 2950, emblem: 'gato alado estelar' },
  { title: 'Lenda Five Cats', alias: 'Constelação Imortal', threshold: 3750, emblem: 'constelação felina' },
].map((rank, index) => Object.freeze({ ...rank, index })));

export const CAT_MEDALS = Object.freeze([
  { id: 'bronze-claw', title: 'Garra de Bronze', hint: 'Derrote seu primeiro chefe.', type: 'bossSectors', target: 1, grade: 'bronze' },
  { id: 'silver-claw', title: 'Garra de Prata', hint: 'Derrote cinco chefes diferentes.', type: 'bossSectors', target: 5, grade: 'silver' },
  { id: 'gold-claw', title: 'Garra de Ouro', hint: 'Derrote os dez chefes diferentes.', type: 'bossSectors', target: 10, grade: 'gold' },
  { id: 'cat-eye', title: 'Olho de Gato', hint: 'Derrote um chefe usando somente a arma principal.', type: 'primaryBossWins', target: 1, grade: 'gold' },
  { id: 'nine-lives', title: 'Nove Vidas', hint: 'Conclua uma fase sem receber dano.', type: 'cleanWins', target: 1, grade: 'silver' },
  { id: 'steel-whisker', title: 'Bigode de Aço', hint: 'Supere seu próprio recorde de fase.', type: 'records', target: 1, grade: 'silver' },
  { id: 'lightning-tail', title: 'Cauda Relâmpago', hint: 'Conclua uma fase dentro do tempo-alvo.', type: 'fastWins', target: 1, grade: 'silver' },
  { id: 'feline-shield', title: 'Escudo Felino', hint: 'Conclua uma fase no Difícil.', type: 'hardWins', target: 1, grade: 'silver' },
  { id: 'metal-paw', title: 'Pata de Titânio', hint: 'Finalize um chefe transformado em robô.', type: 'mechaWins', target: 1, grade: 'gold' },
  { id: 'squad-heart', title: 'Coração de Esquadrão', hint: 'Use um especial Five Cats numa fase concluída.', type: 'squadWins', target: 1, grade: 'bronze' },
  { id: 'constellation', title: 'Constelação Felina', hint: 'Vença cinco setores diferentes com o mesmo piloto.', type: 'clearSectors', target: 5, grade: 'gold' },
  { id: 'marvin-shadow', title: 'Sombra de Marvin', hint: 'Derrote Marvin com este piloto.', type: 'marvinWins', target: 1, grade: 'gold' },
].map((medal) => Object.freeze(medal)));

export const PILOT_IDS = Object.freeze(PILOT_PROFILES.map((pilot) => pilot.id));

export const SQUAD_RANKS = Object.freeze([
  { title: 'Patrulha Orbital', threshold: 0 },
  { title: 'Esquadrão de Guarda', threshold: 900 },
  { title: 'Força Five Cats', threshold: 2300 },
  { title: 'Guardiões da Galáxia', threshold: 4500 },
  { title: 'Lendas Five Cats', threshold: 8500 },
]);

export function catRankForPoints(points) {
  const value = Number.isFinite(points) ? Math.max(0, points) : 0;
  return [...CAT_RANKS].reverse().find((rank) => value >= rank.threshold) ?? CAT_RANKS[0];
}
export function catUniformForRank(rankIndex) {
  return Math.min(4, Math.max(0, Math.floor(rankIndex / 2)));
}
export function squadRankForPoints(points) {
  return [...SQUAD_RANKS].reverse().find((rank) => points >= rank.threshold) ?? SQUAD_RANKS[0];
}
