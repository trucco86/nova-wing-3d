const gameKeys = new Set([
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyV',
  'KeyB',
  'KeyX',
  'KeyQ',
  'KeyE',
  'KeyZ',
  'KeyP',
  'Escape',
  'ShiftLeft',
  'ShiftRight',
]);

export function isGameKey(event) {
  return gameKeys.has(event.code);
}
/** Suppress browser gestures only while playing; return deterministic cleanup. */
export function protectFlightSurface(document, canvas, touch, inFlight) {
  const cleanups = [];
  for (const type of ['contextmenu', 'selectstart', 'dragstart']) {
    const prevent = (e) => {
      if (inFlight()) e.preventDefault();
    };
    document.addEventListener(type, prevent, true);
    cleanups.push(() => document.removeEventListener(type, prevent, true));
  }
  for (const surface of [canvas, touch])
    for (const type of [
      'touchstart',
      'touchmove',
      'contextmenu',
      'selectstart',
      'dragstart',
      'gesturestart',
    ]) {
      const prevent = (e) => {
        if (inFlight()) e.preventDefault();
      };
      surface.addEventListener(type, prevent, { passive: false });
      cleanups.push(() => surface.removeEventListener(type, prevent));
    }
  return () => cleanups.forEach((fn) => fn());
}
