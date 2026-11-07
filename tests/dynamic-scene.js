import * as T from 'three';
import { createGame } from '../src/game.js';
import { defeatBoss } from './combat-helper.mjs';
import { SECTORS } from '../src/campaign.js';
const params = new URLSearchParams(location.search);
const sector = Number(params.get('sector') ?? 0);
localStorage.setItem(
  'nova-wing-3d-v1',
  JSON.stringify({
    version: 1,
    sector,
    credits: 650,
    weapon: 0,
    armor: 0,
    pods: Number(params.get('pods') ?? 0),
    strategy: { xp: Number(params.get('xp') ?? 0), arsenal: 0, special: 0 },
  }),
);
let rendering = true,
  capture = true;
let lastRenderStats = null;
const game = createGame({
  autoLoop: false,
  // Existing gameplay probes skip the pre-mission film; opt in with ?intro=1
  // for dedicated browser assertions of the real Five Cats opening.
  enableSquadIntro: params.get('intro') === '1',
  spawnEncounters: params.get('arcade') === '1' || params.get('encounters') === '1',
  enableCitySetpieces: params.get('citySetpieces') === '1' || params.get('encounters') === '1',
  rendererFactory(options) {
    const renderer = new T.WebGLRenderer(options);
    const render = renderer.render.bind(renderer);
    renderer.render = (...args) => {
      if (!rendering) return;
      render(...args);
      // Actual WebGL stats from the final rendered frame, not an FPS guess.
      // Capture only immutable scalar values; renderer.info resets per frame.
      lastRenderStats = {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        lines: renderer.info.render.lines,
        points: renderer.info.render.points,
      };
    };
    return renderer;
  },
});
function advance(seconds, { renderAfter = true } = {}) {
  // Fast deterministic simulation can postpone the expensive software-GPU
  // frame until a visual checkpoint, without skipping physics or game logic.
  rendering = false;
  for (let t = 0; t < seconds - 1e-8; t += 0.05) game.step(Math.min(0.05, seconds - t));
  rendering = capture && renderAfter;
  game.step(0);
  rendering = capture;
}
window.fixture = {
  game,
  advance,
  renderStats: () => (lastRenderStats ? { ...lastRenderStats } : null),
  hangar() {
    capture = false;
    // Exercise the first-sector launch with the same keyboard controls as the
    // player. A timed wait alone must never bypass BOOST exhaustion.
    if (sector === 0) {
      advance(23);
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'ShiftLeft',
          key: 'Shift',
          bubbles: true,
          cancelable: true,
        }),
      );
      advance(3.6);
      window.dispatchEvent(
        new KeyboardEvent('keyup', {
          code: 'ShiftLeft',
          key: 'Shift',
          bubbles: true,
          cancelable: true,
        }),
      );
      advance(38.3);
    }
    const duration = SECTORS[sector].duration;
    advance(Math.max(0, duration + 6 - game.snapshot().seconds));
    defeatBoss({ game, advance });
    capture = rendering = true;
    game.step(0);
  },
};
// QA encounter variants start from the same authorized developer path that
// players use, not from an artificial HUD mock or an incomplete wave timer.
// These URLs exist only on the localhost visual fixture server.
const qaSector = params.get('qaBoss');
const qaSubboss = params.get('qaSubboss');
const qaTunnel = params.get('qaTunnel');
if (qaTunnel !== null) {
  if (!game.startDeveloperScenario(Number(qaTunnel), 'tunnel'))
    throw new Error('Developer/QA Europa tunnel fixture unavailable');
} else if (qaSubboss !== null) {
  if (!game.startDeveloperScenario(Number(qaSubboss), 'subboss'))
    throw new Error('Developer/QA subboss fixture unavailable');
} else if (qaSector !== null) {
  if (!game.startDeveloperScenario(Number(qaSector), 'boss'))
    throw new Error('Developer/QA boss fixture unavailable');
} else game.start(true);
game.step(0);
document.body.dataset.ready = 'true';
