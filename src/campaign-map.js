import { campaignSectorArtwork } from './campaign-map-art.js';

const THREATS = {
  city: 'Torres, sentinelas e caças de interceptação',
  ocean: 'Defesas costeiras e máquinas submarinas',
  mars: 'Tempestades de areia, sentinelas alienígenas e colossos do deserto',
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
  mars: '◈',
  asteroids: '✦',
  station: '◎',
  sun: '☼',
  ice: '❄',
  nebula: '✺',
  fleet: '≋',
  void: '◉',
  throne: '♛',
};
const STATUS = {
  completed: 'CONCLUÍDO',
  next: 'PRÓXIMA MISSÃO',
  locked: 'ROTA A SEGUIR',
};
const NS = 'http://www.w3.org/2000/svg';

export function campaignMapSteps(sectors, nextIndex) {
  const current = Math.max(0, Math.min(sectors.length, Math.trunc(nextIndex) || 0));
  return sectors.map((sector, index) => ({
    number: index + 1,
    name: sector.name,
    boss: sector.boss,
    theme: sector.theme,
    accent: sector.accent,
    icon: ICONS[sector.theme] ?? '◆',
    threat: THREATS[sector.theme] ?? 'Ameaças desconhecidas',
    brief: sector.brief,
    status: index < current ? 'completed' : index === current ? 'next' : 'locked',
  }));
}

function element(doc, tag, className, text) {
  const item = doc.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}

function galaxyTrack(doc, count) {
  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'campaign-route-thread');
  svg.setAttribute('viewBox', '0 0 120 1000');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const stars = doc.createElementNS(NS, 'path');
  // Route stays centered between the two columns as each pair crosses the
  // center lane and descends to the next encounter.
  let path = 'M 51 73';
  for (let i = 1; i < count; i++) {
    const y = 73 + i * 94;
    const x = i % 2 ? 69 : 51;
    const previousY = 73 + (i - 1) * 94;
    path +=
      ' C ' +
      (i % 2 ? 22 : 98) +
      ' ' +
      (previousY + 39) +
      ' ' +
      (i % 2 ? 98 : 22) +
      ' ' +
      (y - 39) +
      ' ' +
      x +
      ' ' +
      y;
  }
  stars.setAttribute('d', path);
  stars.setAttribute('class', 'campaign-route-stroke');
  const glow = doc.createElementNS(NS, 'path');
  glow.setAttribute('d', path);
  glow.setAttribute('class', 'campaign-route-glow');
  svg.append(stars, glow);
  return svg;
}

function showIntel(doc, step, buttons, steps) {
  doc.getElementById('mapSectorTitle').textContent =
    'SETOR ' + String(step.number).padStart(2, '0') + ' · ' + step.name;
  doc.getElementById('mapSectorBrief').textContent = step.brief;
  doc.getElementById('mapSectorThreat').textContent = 'AMEAÇAS: ' + step.threat;
  doc.getElementById('mapSectorBoss').textContent = 'ALVO PRIORITÁRIO: ' + step.boss;
  const status = doc.getElementById('mapIntelStatus');
  if (status) {
    status.textContent =
      step.status === 'next'
        ? 'DESTINO ATUAL · PRONTO PARA LANÇAMENTO'
        : step.status === 'completed'
          ? 'MISSÃO CONCLUÍDA · CONSULTA AO ARQUIVO'
          : 'SETOR FUTURO · RECONHECIMENTO DISPONÍVEL';
  }
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].setAttribute('aria-pressed', String(steps[i] === step));
    buttons[i].classList.toggle('is-selected', steps[i] === step);
  }
}

export function drawCampaignMap(doc, sectors, nextIndex) {
  const steps = campaignMapSteps(sectors, nextIndex);
  const completed = steps.filter((step) => step.status === 'completed').length;
  const route = doc.getElementById('campaignRoute');
  route.replaceChildren();
  route.append(galaxyTrack(doc, steps.length));
  const buttons = [];
  for (const [index, step] of steps.entries()) {
    const card = element(doc, 'button', 'campaign-node ' + step.status);
    card.type = 'button';
    card.style.setProperty('--sector-accent', step.accent);
    card.setAttribute('data-sector', String(step.number));
    card.setAttribute('data-side', index % 2 ? 'right' : 'left');
    card.setAttribute(
      'aria-label',
      'Setor ' +
        step.number +
        ': ' +
        step.name +
        ', ' +
        STATUS[step.status] +
        '. Consultar missão.',
    );
    card.setAttribute('aria-pressed', 'false');
    if (step.status === 'next') card.setAttribute('aria-current', 'step');

    const artwork = element(doc, 'span', 'campaign-sector-art');
    artwork.setAttribute('aria-hidden', 'true');
    artwork.style.setProperty('--sector-art', campaignSectorArtwork(step.theme));

    const text = element(doc, 'span', 'campaign-node-content');
    const badge = element(doc, 'span', 'campaign-node-icon', step.icon);
    badge.setAttribute('aria-hidden', 'true');
    const title = element(
      doc,
      'strong',
      'campaign-node-name',
      String(step.number).padStart(2, '0') + ' · ' + step.name,
    );
    const status = element(doc, 'small', 'campaign-node-status', STATUS[step.status]);
    const marker = element(
      doc,
      'span',
      'campaign-route-marker',
      String(step.number).padStart(2, '0'),
    );
    marker.setAttribute('aria-hidden', 'true');
    text.append(badge, title, status);
    card.append(artwork, text, marker);
    card.addEventListener('click', () => showIntel(doc, step, buttons, steps));
    buttons.push(card);
    route.append(card);
  }

  const progress = completed + ' / ' + steps.length;
  doc.getElementById('mapProgress').textContent = progress + ' SETORES CONCLUÍDOS';
  const progressFill = doc.getElementById('mapProgressFill');
  if (progressFill)
    progressFill.style.width = (steps.length ? (completed / steps.length) * 100 : 0) + '%';
  const progressCount = doc.getElementById('mapProgressCount');
  if (progressCount) progressCount.textContent = progress;
  const progressMeter = doc.getElementById('mapProgressMeter');
  if (progressMeter) {
    progressMeter.setAttribute('aria-valuenow', String(completed));
    progressMeter.setAttribute('aria-valuemax', String(steps.length));
    progressMeter.setAttribute('aria-valuetext', progress + ' setores concluídos');
  }

  const next = steps.find((step) => step.status === 'next') ?? steps.at(-1);
  const launch = doc.getElementById('mapLaunch');
  if (launch) launch.disabled = !steps.some((step) => step.status === 'next');
  if (next) showIntel(doc, next, buttons, steps);
}
