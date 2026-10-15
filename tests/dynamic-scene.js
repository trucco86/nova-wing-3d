import * as T from 'three';
import { createGame } from '../src/game.js';
import { defeatBoss } from './combat-helper.mjs';
const params = new URLSearchParams(location.search);
const sector = Number(params.get('sector') ?? 0);
localStorage.setItem(
  'nova-wing-3d-v1',
  JSON.stringify({ version: 1, sector, credits: 650, weapon: 0, armor: 0, pods: 0 }),
);
let rendering = true,
  capture = true;
const game = createGame({
  autoLoop: false,
  spawnEncounters: params.get('arcade') === '1',
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
    advance(91);
    defeatBoss({ game, advance });
    capture = rendering = true;
    game.step(0);
  },
};
game.start(true);
game.step(0);
document.body.dataset.ready = 'true';
