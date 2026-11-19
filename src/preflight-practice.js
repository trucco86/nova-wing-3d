// Reusable, consequence-free training requirements. None of these actions
// spends combat resources, modifies checkpoints or advances the mission clock.
export const PREFLIGHT_ACTIONS = Object.freeze([
  Object.freeze({ id: 'move', name: 'MOVIMENTAR', keyboard: 'WASD / SETAS', touch: 'DIRECIONAL' }),
  Object.freeze({ id: 'fire', name: 'ATIRAR', keyboard: 'ESPAÇO', touch: 'TIRO' }),
  Object.freeze({ id: 'boost', name: 'ACELERAR', keyboard: 'SHIFT', touch: 'BOOST' }),
  Object.freeze({ id: 'roll', name: 'GIRO DEFENSIVO', keyboard: 'Q / E / Z', touch: 'GIRO' }),
  Object.freeze({ id: 'transform', name: 'TRANSFORMAR', keyboard: 'T', touch: 'ROBÔ' }),
  Object.freeze({ id: 'camera', name: 'TROCAR CÂMERA', keyboard: 'C', touch: 'CÂMERA' }),
]);

const byAction = new Map(PREFLIGHT_ACTIONS.map((action) => [action.id, action]));
export const PREFLIGHT_KEY_CODES = Object.freeze({
  ArrowLeft: 'move',
  ArrowRight: 'move',
  ArrowUp: 'move',
  ArrowDown: 'move',
  KeyA: 'move',
  KeyD: 'move',
  KeyW: 'move',
  KeyS: 'move',
  Space: 'fire',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
  KeyQ: 'roll',
  KeyE: 'roll',
  KeyZ: 'roll',
  KeyT: 'transform',
  KeyC: 'camera',
});

export function createPracticeProgress() {
  const completed = new Set();
  return {
    mark(id) {
      if (!byAction.has(id)) return false;
      completed.add(id);
      return true;
    },
    reset() {
      completed.clear();
    },
    snapshot() {
      return {
        completed: [...completed],
        total: PREFLIGHT_ACTIONS.length,
        count: completed.size,
        done: completed.size === PREFLIGHT_ACTIONS.length,
        next: PREFLIGHT_ACTIONS.find(({ id }) => !completed.has(id))?.id ?? null,
      };
    },
  };
}
