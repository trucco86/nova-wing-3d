import { TROPHY_TIERS } from './trophy-catalog.js';

/** Local trophy showcase; no remote calls, HTML injection or gameplay-center overlays. */
export function createTrophyUI({ document = globalThis.document, trophies } = {}) {
  const panel = document?.getElementById('novaTrophies');
  const list = document?.getElementById('novaTrophyList');
  const counter = document?.getElementById('novaTrophyCounter');
  const points = document?.getElementById('novaTrophyPoints');
  if (!panel || !list || !counter || !points || !trophies) return { refresh() {}, destroy() {} };
  let timer = null;
  let toast = null;
  const refresh = (newUnlocks = []) => {
    const summary = trophies.summary();
    counter.textContent = summary.unlocked + ' / ' + summary.total;
    points.textContent =
      summary.points +
      ' pontos de troféu · ' +
      Math.round((summary.unlocked / summary.total) * 100) +
      '% concluído';
    const values = trophies.list().sort((a, b) => Number(!!b.unlockedAt) - Number(!!a.unlockedAt));
    list.replaceChildren();
    for (const trophy of values) {
      const entry = document.createElement('li');
      entry.dataset.tier = trophy.tier;
      entry.dataset.earned = String(!!trophy.unlockedAt);
      const mark = document.createElement('span');
      mark.className = 'trophy-mark';
      mark.textContent = trophy.unlockedAt ? '◆' : '◇';
      mark.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div');
      body.className = 'trophy-copy';
      const title = document.createElement('strong');
      title.textContent = trophy.secret && !trophy.unlockedAt ? 'Troféu secreto' : trophy.title;
      const description = document.createElement('p');
      description.textContent =
        trophy.secret && !trophy.unlockedAt ? 'Desbloqueie para revelar o desafio.' : trophy.detail;
      const progress = document.createElement('small');
      progress.textContent = trophy.unlockedAt
        ? TROPHY_TIERS[trophy.tier].label.toUpperCase() +
          ' · CONQUISTADO · +' +
          trophy.points +
          ' PTS'
        : TROPHY_TIERS[trophy.tier].label.toUpperCase() +
          ' · ' +
          Math.min(trophy.target, trophy.progress) +
          ' / ' +
          trophy.target;
      body.append(title, description, progress);
      entry.append(mark, body);
      list.append(entry);
    }
    if (newUnlocks.length) {
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'novaTrophyToast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.append(toast);
      }
      const first = newUnlocks[0];
      toast.textContent =
        '◆ TROFÉU DESBLOQUEADO · ' +
        first.title +
        (newUnlocks.length > 1 ? ' · +' + (newUnlocks.length - 1) + ' conquistas' : '');
      toast.hidden = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (toast) toast.hidden = true;
      }, 4200);
    }
  };
  const onOpen = () => {
    if (panel.open) refresh();
  };
  panel.addEventListener('toggle', onOpen);
  refresh();
  return {
    refresh,
    destroy() {
      clearTimeout(timer);
      panel.removeEventListener('toggle', onOpen);
      toast?.remove();
      toast = null;
    },
  };
}
