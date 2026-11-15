// Haptic feedback is a capability, not an advertised guarantee on every
// phone. Safari on iPhone does not expose navigator.vibrate(), and WebKit's
// undocumented switch-click workaround no longer works on recent iOS.
export function createHapticFeedback(window) {
  const navigator = window?.navigator;
  const capacitor = window?.Capacitor;
  const native =
    capacitor?.isNativePlatform?.() === true &&
    typeof capacitor?.Plugins?.Haptics?.vibrate === 'function'
      ? capacitor.Plugins.Haptics
      : null;
  const web = typeof navigator?.vibrate === 'function' ? navigator : null;
  return {
    available: Boolean(native || web),
    kind: native ? 'native' : web ? 'web' : 'unsupported',
    pulse(duration = 45) {
      const ms = Math.min(250, Math.max(1, Math.round(Number(duration) || 45)));
      try {
        if (native) {
          Promise.resolve(native.vibrate({ duration: ms })).catch(() => {});
          return true;
        }
        if (web) return web.vibrate(ms) !== false;
      } catch {
        // Unsupported devices and denied haptics never interrupt gameplay.
      }
      return false;
    },
  };
}
