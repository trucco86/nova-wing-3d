import { PILOT_PROFILES } from './pilots.js';
import { CAT_MEDALS } from './cat-rank-catalog.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const tags = (document, type, attributes = {}) => {
  const element = document.createElementNS(SVG_NS, type);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
};

/** Original cat-ear military crest, not an icon borrowed from another franchise. */
export function catCrest(document, label = 'Insígnia felina') {
  const svg = tags(document, 'svg', { viewBox: '0 0 76 72', role: 'img', 'aria-label': label });
  svg.classList.add('cat-crest');
  svg.append(
    tags(document, 'path', {
      d: 'M9 30 L13 4 L31 17 Q38 15 45 17 L63 4 L67 30 Q73 52 61 63 Q38 77 15 63 Q3 52 9 30 Z',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 4,
      'stroke-linejoin': 'round',
    }),
    tags(document, 'path', {
      d: 'M23 35 Q30 30 35 35 M41 35 Q47 30 54 35',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 3,
      'stroke-linecap': 'round',
    }),
    tags(document, 'path', {
      d: 'M34 44 L42 44 L38 49 Z M38 49 Q35 54 30 52 M38 49 Q41 54 46 52',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2.6,
      'stroke-linejoin': 'round',
    }),
    tags(document, 'path', {
      d: 'M5 43 L24 46 M5 52 L24 51 M52 46 L71 43 M52 51 L71 52',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
    }),
  );
  return svg;
}

const text = (document, name, content, className = '') => {
  const node = document.createElement(name);
  node.textContent = content;
  if (className) node.className = className;
  return node;
};

export function createCatRankUI({ document = globalThis.document, service } = {}) {
  const panel = document?.getElementById('catRanks');
  const cards = document?.getElementById('catRankCards');
  const squad = document?.getElementById('catSquadRank');
  const currentRank = document?.getElementById('pilotRankInsignia');
  const uniform = document?.getElementById('pilotUniform');
  const profileProgress = document?.getElementById('pilotRankProgress');
  const profileMedals = document?.getElementById('pilotRankMedals');
  const roster = document?.querySelector('.pilot-roster');
  const previewButton = document?.getElementById('pilotUniformPreview');
  const previewStatus = document?.getElementById('pilotUniformPreviewStatus');
  const rewardPanels = [
    document?.getElementById('shopServiceSummary'),
    document?.getElementById('resultServiceSummary'),
  ].filter(Boolean);
  if (!panel || !cards || !squad || !service) return { refresh() {}, destroy() {} };
  let timer = null,
    toast = null;
  // Non-persistent visual inspection only; never changes a pilot's rank,
  // service points, medals, save, ship stats or the actual earned uniform.
  let previewGrade = null;
  const selectedPilot = () =>
    document?.getElementById('squadSelection')?.getAttribute('data-pilot') ?? 'bia';

  const medalBadge = (medal, earned) => {
    const badge = document.createElement('span');
    badge.className = 'cat-medal-chip';
    badge.dataset.grade = medal.grade;
    badge.dataset.earned = String(earned);
    badge.title = medal.title + ' — ' + medal.hint;
    badge.setAttribute('aria-label', (earned ? 'Conquistada: ' : 'Bloqueada: ') + medal.title);
    badge.append(catCrest(document, medal.title));
    return badge;
  };

  function renderProfile() {
    const view = service.pilotView(selectedPilot());
    if (!view || !currentRank || !uniform || !profileProgress || !profileMedals) return;
    currentRank.textContent = view.rank.title + ' · ' + view.rank.alias;
    currentRank.dataset.rank = String(view.rank.index + 1);
    const shownGrade = previewGrade ?? view.uniform;
    uniform.dataset.grade = String(shownGrade);
    if (previewStatus)
      previewStatus.textContent =
        previewGrade === null
          ? 'Uniforme conquistado: Mk-' + (view.uniform + 1)
          : 'APENAS PRÉVIA · Mk-' + (shownGrade + 1) + ' (não desbloqueado)';
    if (previewButton)
      previewButton.textContent =
        previewGrade === null ? 'VISUALIZAR UNIFORMES' : 'PRÓXIMA PRÉVIA / VOLTAR AO REAL';
    const selection = document.getElementById('squadSelection');
    if (selection) {
      selection.setAttribute('data-uniform-grade', String(shownGrade));
      selection.setAttribute(
        'data-medals-count',
        String(previewGrade === null ? view.medalsEarned.length : Math.min(3, shownGrade)),
      );
    }
    uniform.setAttribute(
      'aria-label',
      (previewGrade === null ? 'Conquistado: ' : 'Prévia visual não desbloqueada: ') +
        'uniforme ' +
        (shownGrade + 1) +
        ' de 5 · ' +
        view.rank.title,
    );
    const progressLabel = view.nextRank
      ? view.points + ' / ' + view.nextRank.threshold + ' PS · Faltam ' + view.untilNext
      : view.points + ' PS · PATENTE MÁXIMA';
    profileProgress.textContent = progressLabel;
    const bar = document.getElementById('pilotServiceMeter');
    if (bar) {
      bar.value = view.progress;
      bar.max = 1;
    }
    profileMedals.replaceChildren();
    for (const medal of view.medalsEarned.slice(-3)) profileMedals.append(medalBadge(medal, true));
    if (!view.medalsEarned.length)
      profileMedals.append(text(document, 'small', 'Conquiste medalhas em missões reais.'));
  }

  function renderCards() {
    const squadStats = service.squad();
    squad.textContent = squadStats.rank.title + ' · ' + squadStats.points + ' PS DO ESQUADRÃO';
    cards.replaceChildren();
    for (const pilot of PILOT_PROFILES) {
      const view = service.pilotView(pilot.id);
      const item = document.createElement('article');
      item.className = 'cat-service-card';
      item.style.setProperty('--pilot-color', pilot.color);
      item.dataset.pilot = pilot.id;
      item.dataset.uniform = String(view.uniform);
      const avatar = text(document, 'div', '', 'cat-service-avatar');
      avatar.setAttribute('aria-hidden', 'true');
      avatar.append(catCrest(document, pilot.name + ' · ' + view.rank.title));
      const details = document.createElement('div');
      details.className = 'cat-service-details';
      details.append(
        text(document, 'strong', pilot.name),
        text(document, 'span', view.rank.title + ' · ' + view.rank.alias, 'cat-service-title'),
      );
      const meter = document.createElement('progress');
      meter.className = 'cat-service-meter';
      meter.max = 1;
      meter.value = view.progress;
      meter.setAttribute('aria-label', 'Progresso de patente de ' + pilot.name);
      details.append(
        meter,
        text(
          document,
          'small',
          view.points + ' PS · ' + view.medalsEarned.length + '/' + view.medalsTotal + ' medalhas',
        ),
      );
      const medals = document.createElement('div');
      medals.className = 'cat-service-medals';
      for (const medal of CAT_MEDALS)
        medals.append(medalBadge(medal, view.medals.includes(medal.id)));
      details.append(medals);
      item.append(avatar, details);
      cards.append(item);
    }
    renderProfile();
  }

  function refresh(reward = null, newTrophies = []) {
    renderCards();
    for (const rewardPanel of rewardPanels) {
      rewardPanel.replaceChildren();
      if (!reward?.accepted) {
        rewardPanel.hidden = true;
        continue;
      }
      const pilot = PILOT_PROFILES.find((p) => p.id === reward.id);
      rewardPanel.hidden = false;
      rewardPanel.append(
        text(document, 'strong', pilot.name + ' · +' + reward.points + ' PONTOS DE SERVIÇO'),
        text(
          document,
          'p',
          reward.promotion
            ? 'PROMOVIDO: ' +
                reward.promotion.previous.title +
                ' → ' +
                reward.promotion.current.title
            : 'Patente atual: ' + reward.rank.title,
        ),
      );
      if (reward.medals.length) {
        const earned = text(document, 'div', '', 'cat-earned-ribbons');
        for (const medal of reward.medals) {
          const node = text(document, 'span', medal.title, 'cat-earned-ribbon');
          node.dataset.grade = medal.grade;
          earned.append(node);
        }
        rewardPanel.append(earned);
      }
      if (newTrophies.length) {
        rewardPanel.append(
          text(
            document,
            'small',
            'TROFÉUS DESBLOQUEADOS: ' + newTrophies.map((t) => t.title).join(' · '),
          ),
        );
      }
    }
    if (reward?.accepted && (reward.promotion || reward.medals.length)) {
      if (!toast) {
        toast = text(document, 'div', '', 'cat-rank-toast');
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.append(toast);
      }
      const pilot = PILOT_PROFILES.find((p) => p.id === reward.id);
      toast.textContent = reward.promotion
        ? '★ PROMOÇÃO · ' +
          pilot.name +
          ' · ' +
          reward.rank.title +
          (reward.medals.length ? ' · +' + reward.medals.length + ' MEDALHAS' : '')
        : '✧ NOVAS MEDALHAS · ' + pilot.name + ' · +' + reward.medals.length;
      toast.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (toast) toast.hidden = true;
      }, 4600);
    }
  }
  const onSelect = () => {
    previewGrade = null;
    renderProfile();
  };
  const onPreview = () => {
    const ownedGrade = service.pilotView(selectedPilot())?.uniform ?? 0;
    // Tour order: subsequent grades, then the earned grade. At top rank,
    // circle through all five designs so every pilot remains inspectable.
    previewGrade = previewGrade === null ? (ownedGrade + 1) % 5 : (previewGrade + 1) % 5;
    if (previewGrade === ownedGrade) previewGrade = null;
    renderProfile();
  };
  previewButton?.addEventListener('click', onPreview);
  const onOpen = () => {
    if (panel.open) renderCards();
  };
  roster?.addEventListener('click', onSelect);
  panel.addEventListener('toggle', onOpen);
  refresh();
  return {
    refresh,
    destroy() {
      clearTimeout(timer);
      roster?.removeEventListener('click', onSelect);
      previewButton?.removeEventListener('click', onPreview);
      panel.removeEventListener('toggle', onOpen);
      toast?.remove();
      toast = null;
    },
  };
}
