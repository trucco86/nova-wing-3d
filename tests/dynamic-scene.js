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
const game = createGame({
  autoLoop: false,
  // Existing gameplay probes skip the pre-mission film; opt in with ?intro=1
  // for dedicated browser assertions of the real Five Cats opening.
  enableSquadIntro: params.get('intro') === '1',
  spawnEncounters: params.get('arcade') === '1' || params.get('encounters') === '1',
  rendererFactory(options) {
    const renderer = new T.WebGLRenderer(options);
    const render = renderer.render.bind(renderer);
    renderer.render = (...args) => {
      if (rendering) render(...args);
    };
    return renderer;
  },
});
function advance(seconds) {
  rendering = false;
  for (let t = 0; t < seconds - 1e-8; t += 0.05) game.step(Math.min(0.05, seconds - t));
  rendering = capture;
  game.step(0);
}
window.fixture = {
  game,
  advance,
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
// The QA query must be launched while still in the menu; developer sessions
// never load or overwrite a player's campaign checkpoint.
const qaSector = params.get('qaBoss');
if (qaSector !== null) {
  if (!game.startDeveloperScenario(Number(qaSector), 'boss'))
    throw new Error('Developer/QA boss fixture unavailable');
} else game.start(true);
game.step(0);
document.body.dataset.ready = 'true';
