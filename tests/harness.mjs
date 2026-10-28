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
    style: {
      setProperty(key, value) {
        this[key] = value;
      },
    },
    children: [],
    setAttribute(key, value) {
      this[key] = value;
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    replaceChildren(...nodes) {
      this.children = nodes;
    },
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
export function harness({
  spawnEncounters = false,
  seed = 42,
  storage,
  nativeLifecycle = false,
  coarsePointer = false,
  onStageStarted = () => {},
  onStageFinished = () => {},
} = {}) {
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
    createElement: element,
    getElementById(id) {
      if (!elements.has(id)) throw new Error('Missing DOM id ' + id);
      return elements.get(id);
    },
  };
  const calls = { audio: 0, audioResume: 0, audioSuspend: 0, renders: 0 };
  class AudioContext {
    constructor() {
      calls.audio++;
      this.currentTime = 0;
    }
    resume() {
      calls.audioResume++;
      return Promise.resolve();
    }
    suspend() {
      calls.audioSuspend++;
      return Promise.resolve();
    }
    createOscillator() {
      return {
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
      };
    }
  }
  const window = {
    ...target(),
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    matchMedia: (query) => ({
      matches: coarsePointer && query.replaceAll(' ', '') === '(pointer:coarse)',
    }),
    AudioContext,
    localStorage: storage,
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
    nativeLifecycle,
    onStageStarted,
    onStageFinished,
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
