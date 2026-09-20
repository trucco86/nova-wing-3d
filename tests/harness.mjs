import { readFileSync } from 'node:fs';
import { createGame } from '../src/game.js';
function target() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    emit(type, event = {}) {
      for (const fn of listeners.get(type) ?? []) fn(event);
    },
  };
}
function element() {
  const classes = new Set();
  return {
    ...target(),
    style: {},
    hidden: false,
    disabled: false,
    textContent: '',
    classList: {
      add(...names) {
        names.forEach((n) => classes.add(n));
      },
      remove(...names) {
        names.forEach((n) => classes.delete(n));
      },
      contains(n) {
        return classes.has(n);
      },
    },
    setPointerCapture() {},
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 100, height: 100 };
    },
  };
}
export function harness({ spawnEncounters = false, seed = 42 } = {}) {
  const elements = new Map(
    [
      ...readFileSync(new URL('../src/shell.html', import.meta.url), 'utf8').matchAll(
        /id="([^"]+)"/g,
      ),
    ].map((m) => [m[1], element()]),
  );
  const document = {
    ...target(),
    hidden: false,
    body: element(),
    getElementById(id) {
      if (!elements.has(id)) throw new Error('Missing DOM id ' + id);
      return elements.get(id);
    },
  };
  const calls = { audio: 0, renders: 0 };
  class AudioContext {
    constructor() {
      calls.audio++;
      this.currentTime = 0;
    }
    resume() {
      return Promise.resolve();
    }
    createOscillator() {
      return {
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    }
  }
  const window = {
    ...target(),
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    matchMedia: () => ({ matches: false }),
    AudioContext,
  };
  const renderer = {
    extensions: { has: () => true },
    setPixelRatio() {},
    getPixelRatio: () => 1,
    setSize() {},
    setRenderTarget() {},
    render() {
      calls.renders++;
    },
    dispose() {},
  };
  let clock = 0;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  }
  const game = createGame({
    window,
    document,
    rendererFactory: () => renderer,
    autoLoop: false,
    now: () => clock * 1000,
    random,
    spawnEncounters,
  });
  return {
    game,
    window,
    document,
    elements,
    calls,
    key(code, down = true) {
      window.emit(down ? 'keydown' : 'keyup', { code, repeat: false, preventDefault() {} });
    },
    advance(seconds, dt = 0.05) {
      for (let t = 0; t < seconds - 1e-9; t += dt) {
        let step = Math.min(dt, seconds - t);
        clock += step;
        game.step(step);
      }
    },
    close() {
      game.destroy();
    },
  };
}
