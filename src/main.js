import { createRankingClient } from './ranking-client.js';
import { installGoogleLogin } from './google-auth.js';
import { installShowroom } from './showroom.js';
import { installOrbit9ExplorationPreview } from './exploration-preview.js';
import { createGame } from './game.js';
import { createTrophySystem, readTrophies } from './trophy-system.js';
import { createCatService } from './cat-service.js';
import { createCatRankUI } from './cat-rank-ui.js';
import { createTrophyUI } from './trophy-ui.js';
import { installNativeShell } from './native.js';
import { Capacitor } from '@capacitor/core';
let ranking;
const trophies = createTrophySystem({ storage: globalThis.localStorage });
const trophyUI = createTrophyUI({ document: globalThis.document, trophies });
const catService = createCatService({ storage: globalThis.localStorage });
let catRankUI;
const sessionId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
let runIndex = 0;
let activeRunId = '';
const game = createGame({
  nativeLifecycle: Capacitor.isNativePlatform(),
  onStageStarted: (event) => {
    activeRunId = sessionId + '-' + ++runIndex + '-' + event.sector;
    ranking?.onStageStarted(event);
  },
  onStageFinished: (event) => {
    ranking?.onStageFinished(event);
    const previousBest = readTrophies(globalThis.localStorage).stats.bestScores[event.sector] ?? 0;
    const newRecord = previousBest > 0 && event.points > previousBest;
    const unlocked = trophies.record({ ...event, type: 'stage-finished', runId: activeRunId });
    trophyUI.refresh(unlocked);
    const reward = catService.record({
      ...event,
      type: 'stage-finished',
      runId: activeRunId,
      newRecord,
      trophiesUnlocked: unlocked.length,
    });
    catRankUI?.refresh(reward);
  },
});
catRankUI = createCatRankUI({ document: globalThis.document, service: catService });
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
    destroyAuth();
    ranking?.destroy();
    trophyUI.destroy();
    catRankUI?.destroy();
    showroom.destroy();
    exploration.destroy();
    destroy();
  };
}
