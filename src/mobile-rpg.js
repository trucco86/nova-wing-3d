// One tactical RPG entry point: four radial categories on touch screens,
// the existing compact disclosure on desktop. No independent gameplay clocks.
const CAST_ACTIONS = new Set([
  'specialCast',
  'plasmaTitan',
  'fiveCatsOverdrive',
  'scanBoss',
  'precisionShot',
  'repairPulse',
  'homingBarrage',
  'qaBerserkAction',
  'rpgBerserkCast',
  'rpgPodsAction',
]);
const CATEGORIES = Object.freeze({
  weapons: 'ARMAS',
  specials: 'ESPECIAIS',
  berserk: 'BERSERK',
  utilities: 'UTILITÁRIOS',
});

export function installMobileRpgAccordion({
  document = globalThis.document,
  window = globalThis.window,
  game = null,
} = {}) {
  const drawer = document?.getElementById?.('strategyDrawer');
  if (!drawer) return { destroy() {} };

  const coarse = window?.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const panel = document.getElementById('rpgCategoryPanel');
  const wheel = document.getElementById('rpgRadialMenu');
  const title = document.getElementById('rpgCategoryTitle');
  const body = drawer.querySelector?.('.rpgDrawerBody');
  if (body) body.setAttribute('aria-modal', String(coarse));
  let selectedCategory = null;

  function selectCategory(category) {
    if (!panel || !wheel || !CATEGORIES[category]) return;
    selectedCategory = category;
    panel.dataset.category = category;
    if (title) title.textContent = CATEGORIES[category];
    wheel.hidden = true;
    panel.hidden = false;
    document.getElementById('rpgCategoryBack')?.focus?.({ preventScroll: true });
  }

  function showWheel() {
    selectedCategory = null;
    if (!coarse) return;
    if (wheel) wheel.hidden = false;
    if (panel) panel.hidden = true;
  }

  function syncPause() {
    if (!coarse) return;
    const active = drawer.open && document.body.classList.contains('in-mission');
    if (active && !game?.setRpgTacticalPaused?.(true)) {
      drawer.open = false;
      return;
    }
    if (!active) game?.setRpgTacticalPaused?.(false);
    if (active) showWheel();
  }

  function close() {
    if (drawer.open) drawer.open = false;
    game?.setRpgTacticalPaused?.(false);
    showWheel();
  }

  function onClick(event) {
    const target = event.target;
    const button = target?.closest?.('button');
    if (target?.id === 'rpgTacticalScrim') return close();
    if (!button || button.disabled) return;
    if (coarse && button.dataset.rpgCategory) return selectCategory(button.dataset.rpgCategory);
    if (button.id === 'rpgCategoryBack') return showWheel();
    if (button.id === 'rpgCategoryClose' || button.id === 'rpgRadialClose') return close();
    if (button.id === 'pause' || button.id === 'orbitLeft' || button.id === 'orbitRight')
      return close();
    if (drawer.contains(button) && CAST_ACTIONS.has(button.id)) close();
  }

  function onPointerDown(event) {
    // Do not cancel touch: game.js owns multitouch and pointer capture.
    if (drawer.open && !drawer.contains(event.target)) close();
  }

  function onKeyDown(event) {
    if (!drawer.open) return;
    if (event.key === 'Escape') {
      if (coarse && selectedCategory) showWheel();
      else close();
      event.preventDefault?.();
      event.stopPropagation?.();
    }
  }

  drawer.open = false;
  if (coarse) showWheel();
  else {
    if (wheel) wheel.hidden = true;
    if (panel) panel.hidden = false;
  }
  drawer.addEventListener('toggle', syncPause);
  document.addEventListener('click', onClick);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      close();
      drawer.removeEventListener('toggle', syncPause);
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
