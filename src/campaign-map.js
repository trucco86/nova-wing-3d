const THREATS = {
  city: 'Torres, sentinelas e caças de interceptação',
  ocean: 'Defesas costeiras e máquinas submarinas',
  asteroids: 'Detritos em alta velocidade e perfuradores',
  station: 'Geradores externos e baterias orbitais',
  sun: 'Rajadas de plasma e instabilidade térmica',
  ice: 'Blindados e disparos congelantes',
  nebula: 'Organismos hostis e ataques em múltiplas direções',
  fleet: 'Formações pesadas e barragens de mísseis',
  void: 'Gravidade anômala e escuridão espacial',
  throne: 'Fortaleza final e a frota de Marvin',
};
const ICONS = {
  city: '▥',
  ocean: '≈',
  asteroids: '✦',
  station: '◎',
  sun: '☼',
  ice: '❄',
  nebula: '✺',
  fleet: '≋',
  void: '◉',
  throne: '♛',
};

export function campaignMapSteps(sectors, nextIndex) {
  return sectors.map((sector, index) => ({
    number: index + 1,
    name: sector.name,
    boss: sector.boss,
    accent: sector.accent,
    icon: ICONS[sector.theme] ?? '◆',
    threat: THREATS[sector.theme] ?? 'Ameaças desconhecidas',
    brief: sector.brief,
    status: index < nextIndex ? 'completed' : index === nextIndex ? 'next' : 'locked',
  }));
}

export function drawCampaignMap(document, sectors, nextIndex) {
  const steps = campaignMapSteps(sectors, nextIndex);
  const route = document.getElementById('campaignRoute');
  route.replaceChildren();
  for (const step of steps) {
    const card = document.createElement('article');
    card.className = 'campaign-node ' + step.status;
    card.style.setProperty('--sector-accent', step.accent);
    card.setAttribute('aria-label', 'Setor ' + step.number + ': ' + step.name);
    const badge = document.createElement('span');
    badge.className = 'campaign-node-icon';
    badge.textContent = step.icon;
    const title = document.createElement('strong');
    title.textContent = String(step.number).padStart(2, '0') + ' · ' + step.name;
    const status = document.createElement('small');
    status.textContent =
      step.status === 'completed'
        ? 'CONCLUÍDO'
        : step.status === 'next'
          ? 'PRÓXIMA MISSÃO'
          : 'ROTA A SEGUIR';
    card.append(badge, title, status);
    route.append(card);
  }
  const next = steps[nextIndex];
  if (!next) return;
  document.getElementById('mapSectorTitle').textContent =
    'SETOR ' + String(next.number).padStart(2, '0') + ' — ' + next.name;
  document.getElementById('mapSectorBrief').textContent = next.brief;
  document.getElementById('mapSectorThreat').textContent = 'AMEAÇAS: ' + next.threat;
  document.getElementById('mapSectorBoss').textContent = 'ALVO PRIORITÁRIO: ' + next.boss;
  document.getElementById('mapProgress').textContent =
    nextIndex + ' / ' + sectors.length + ' SETORES CONCLUÍDOS';
}
