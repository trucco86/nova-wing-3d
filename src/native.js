import { Capacitor, SystemBars } from '@capacitor/core';
import { App } from '@capacitor/app';

/** Native events remain adapters to the same game state machine used on the web. */
export async function installNativeShell(
  game,
  {
    platform = Capacitor.getPlatform(),
    app = App,
    bars = SystemBars,
    document = globalThis.document,
  } = {},
) {
  if (!['android', 'ios'].includes(platform)) return () => {};
  document.body.classList.add(`native-${platform}`);
  const handles = [];
  const hideBars = () => bars.hide().catch(() => {});
  try {
    handles.push(await app.addListener('pause', () => game.setActive(false)));
    handles.push(
      await app.addListener('appStateChange', ({ isActive }) => {
        game.setActive(isActive);
        if (isActive) void hideBars();
      }),
    );
    if (platform === 'android')
      handles.push(
        await app.addListener('backButton', () => {
          const state = game.snapshot().state;
          if (['playing', 'collapsing', 'respawning'].includes(state)) game.pause();
          else void app.minimizeApp().catch(() => {});
        }),
      );
    const { isActive } = await app.getState();
    game.setActive(isActive);
    await hideBars();
  } catch (error) {
    await Promise.all(handles.map((handle) => handle.remove()));
    document.body.classList.remove(`native-${platform}`);
    throw error;
  }
  return async () => {
    await Promise.all(handles.map((handle) => handle.remove()));
    document.body.classList.remove(`native-${platform}`);
  };
}
