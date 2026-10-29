/**
 * Console-style progressive title navigation.
 * Never replaces game's start/continue/settings/hangar handlers; only exposes them.
 */
export function installCompactMenu({
  document = globalThis.document,
  window = globalThis.window,
} = {}) {
  const menu = document?.getElementById('menu');
  if (!menu) return { navigate() {}, destroy() {} };
  const $ = (id) => document.getElementById(id);
  const start = $('pressStart'), back = $('menuBack');
  const play = $('menuPlay'), hangar = $('menuHangar'), hub = $('menuHub');
  const prepare = $('prepareSquad'), selection = $('squadSelection');
  const labels = { home: '', play: '01 / MISSÃO', hangar: '02 / HANGAR', central: '03 / CENTRAL DO PILOTO' };
  const listeners = [];
  const on = (target, type, handler, capture = false) => {
    target?.addEventListener(type, handler, capture);
    listeners.push(() => target?.removeEventListener(type, handler, capture));
  };
  function navigate(screen) {
    if (!['splash', 'home', 'play', 'hangar', 'central'].includes(screen)) return;
    if (menu.hidden || !document.body.classList.contains('menu')) return;
    // The existing game handler owns the 360-degree inspection lifecycle.
    if (screen === 'hangar' && selection.hidden) prepare?.click();
    else if (screen !== 'hangar' && !selection.hidden) prepare?.click();
    menu.dataset.screen = screen;
    $('menuScreenLabel').textContent = labels[screen] ?? '';
    if (screen !== 'central') $('novaAuth')?.removeAttribute('open');
    if (screen === 'central') {
      $('novaAuth')?.removeAttribute('open');
      for (const id of ['novaRanking', 'catRanks', 'novaTrophies'])
        $(id)?.removeAttribute('open');
    }
    menu.scrollTop = 0;
    const focusId = { splash: 'pressStart', home: 'menuPlay', play: 'start', hangar: 'pilot-bia', central: 'menuBack' }[screen];
    $(focusId)?.focus?.({ preventScroll: true });
  }
  on(start, 'click', () => navigate('home'));
  on(back, 'click', () => navigate('home'));
  on(play, 'click', () => navigate('play'));
  on(hangar, 'click', () => navigate('hangar'));
  on(hub, 'click', () => navigate('central'));
  on(window, 'keydown', (event) => {
    if (menu.hidden || !document.body.classList.contains('menu') ||
      event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape' && !document.getElementById('settingsMenu')?.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      $('settingsClose')?.click();
      return;
    }
    if (event.key === 'Escape' && menu.dataset.screen !== 'splash') {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      navigate('home');
    }
    if (event.key !== 'Enter' && event.code !== 'Enter') return;
    // Game's legacy global Enter-to-start must not bypass Press Start.
    event.stopImmediatePropagation?.();
    if (menu.dataset.screen === 'splash') {
      event.preventDefault();
      navigate('home');
    }
    // On menu controls leave browser's normal Enter->click behavior untouched.
  }, true);
  let wasHidden = menu.hidden;
  const observer = new window.MutationObserver(() => {
    if (wasHidden && !menu.hidden && document.body.classList.contains('menu')) navigate('splash');
    wasHidden = menu.hidden;
  });
  observer.observe(menu, { attributes: true, attributeFilter: ['hidden'] });
  menu.dataset.screen = 'splash';
  return {
    navigate,
    destroy() {
      observer.disconnect();
      listeners.forEach((off) => off());
    },
  };
}
