// RPG commands are optional during flight. Preserve the native <details>
// disclosure and never intercept shooting, boost or orbital input.
const CAST_ACTIONS = new Set([
  'specialCast',
  'plasmaTitan',
  'fiveCatsOverdrive',
  'scanBoss',
  'precisionShot',
  'repairPulse',
  'homingBarrage',
  'qaBerserkAction',
]);
const FOLD_ACTIONS = new Set(['pause', 'orbitLeft', 'orbitRight']);

export function installMobileRpgAccordion({ document = globalThis.document } = {}) {
  const drawer = document?.getElementById?.('strategyDrawer');
  if (!drawer) return { destroy() {} };

  drawer.open = false;
  const fold = () => {
    if (drawer.open) drawer.open = false;
  };
  const onClick = (event) => {
    const button = event.target?.closest?.('button');
    if (!button || button.disabled) return;
    if (FOLD_ACTIONS.has(button.id) || (drawer.contains(button) && CAST_ACTIONS.has(button.id)))
      fold();
  };
  const onPointerDown = (event) => {
    // Starting to pilot the ship immediately gives the full scene back.
    // Do not preventDefault: multitouch and pointer capture belong to game.js.
    if (drawer.open && !drawer.contains(event.target)) fold();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') fold();
  };

  document.addEventListener('click', onClick);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown);

  return {
    destroy() {
      document.removeEventListener('click', onClick);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
