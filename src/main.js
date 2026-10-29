import { installTitleFlow } from './title-flow.js';
import { createRankingClient } from './ranking-client.js';
import { installGoogleLogin } from './google-auth.js';
import { installShowroom } from './showroom.js';
import { installOrbit9ExplorationPreview } from './exploration-preview.js';
import { createGame } from './game.js';
import { installNativeShell } from './native.js';
import { Capacitor } from '@capacitor/core';
let ranking;
const game = createGame({
  nativeLifecycle: Capacitor.isNativePlatform(),
  onStageStarted: (event) => ranking?.onStageStarted(event),
  onStageFinished: (event) => ranking?.onStageFinished(event),
});
const destroyTitleFlow = installTitleFlow();
void installNativeShell(game).catch((error) => console.error('Native lifecycle:', error));

if (!Capacitor.isNativePlatform()) {
  ranking = createRankingClient();
  const destroyAuth = installGoogleLogin({
    onAuthChange: (user) => ranking?.setUser(user),
    onRuntimeConfig: (config) => ranking?.setRuntimeConfig(config),
  });
  const showroom = installShowroom();
  const exploration = installOrbit9ExplorationPreview(game);
  const destroy = game.destroy.bind(game);
  game.destroy = () => {
    destroyTitleFlow();
    destroyAuth();
    ranking?.destroy();
    showroom.destroy();
    exploration.destroy();
    destroy();
  };
}
