import { installGoogleLogin } from './google-auth.js';
import { installShowroom } from './showroom.js';
import { createGame } from './game.js';
import { installNativeShell } from './native.js';
import { Capacitor } from '@capacitor/core';
const game = createGame({ nativeLifecycle: Capacitor.isNativePlatform() });
void installNativeShell(game).catch((error) => console.error('Native lifecycle:', error));

if (!Capacitor.isNativePlatform()) {
  const destroyAuth = installGoogleLogin();
  const showroom = installShowroom();
  const destroy = game.destroy.bind(game);
  game.destroy = () => {
    destroyAuth();
    showroom.destroy();
    destroy();
  };
}
