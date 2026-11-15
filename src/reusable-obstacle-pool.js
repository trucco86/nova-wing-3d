/**
 * Bounded recycling for immutable standard space obstacles. The factory may
 * return shallow scene clones that SHARE geometry/material with archetypes.
 * This pool never disposes those shared GPU resources and never handles
 * encounter state machines (Europa breach, moving trains, reactors or bosses).
 */
const SAFE_KINDS = new Set(['satellite', 'carrier', 'debris', 'gantry']);

export function createReusableObstaclePool({ create, maxRetainedPerKind = 3, maxTotal = 12 } = {}) {
  if (typeof create !== 'function') throw new TypeError('Expected obstacle factory');
  if (!Number.isInteger(maxRetainedPerKind) || maxRetainedPerKind < 0 || maxRetainedPerKind > 32)
    throw new RangeError('Invalid per-kind retention limit');
  if (!Number.isInteger(maxTotal) || maxTotal < 0 || maxTotal > 128)
    throw new RangeError('Invalid total retention limit');
  const idle = new Map();
  const leased = new WeakMap();
  const initial = new WeakMap();
  let retained = 0;
  let created = 0;
  let reused = 0;
  let rejected = 0;
  let closed = false;

  function poolable(kind, variant) {
    return SAFE_KINDS.has(kind) && variant === 'standard';
  }
  function snapshot(root) {
    const entries = [];
    root.traverse((part) => {
      entries.push({
        part,
        x: part.position.x,
        y: part.position.y,
        z: part.position.z,
        rx: part.rotation.x,
        ry: part.rotation.y,
        rz: part.rotation.z,
        sx: part.scale.x,
        sy: part.scale.y,
        sz: part.scale.z,
        visible: part.visible,
      });
    });
    initial.set(root, entries);
  }
  function reset(root) {
    const entries = initial.get(root);
    if (!entries) return;
    for (const state of entries) {
      const o = state.part;
      o.position.set(state.x, state.y, state.z);
      o.rotation.set(state.rx, state.ry, state.rz);
      o.scale.set(state.sx, state.sy, state.sz);
      o.visible = state.visible;
    }
  }
  function acquire(kind, variant = 'standard') {
    if (closed) throw new Error('Obstacle pool already cleared');
    const key = kind + ':' + variant;
    const list = poolable(kind, variant) ? idle.get(key) : null;
    let object = list?.pop();
    if (object) {
      retained--;
      reused++;
      reset(object);
    } else {
      object = create(kind, variant);
      created++;
      if (poolable(kind, variant)) snapshot(object);
    }
    leased.set(object, { key, kind, variant, inUse: true });
    return object;
  }
  function release(object) {
    const entry = leased.get(object);
    if (!entry || !entry.inUse) return false;
    if (object.parent) return false; // Never recycle a still-visible entity.
    entry.inUse = false;
    const { kind, variant, key } = entry;
    const list = idle.get(key) ?? [];
    if (
      closed ||
      !poolable(kind, variant) ||
      list.length >= maxRetainedPerKind ||
      retained >= maxTotal
    ) {
      rejected++;
      return false;
    }
    reset(object);
    list.push(object);
    idle.set(key, list);
    retained++;
    return true;
  }
  function stats() {
    return {
      created,
      reused,
      retained,
      rejected,
      limits: { maxRetainedPerKind, maxTotal },
      kinds: Object.fromEntries([...idle].map(([key, list]) => [key, list.length])),
    };
  }
  function clear() {
    if (closed) return;
    closed = true;
    // Each clone references prototype-owned materials and geometries; dropping
    // JS references is correct. Disposing the prototypes would break all live
    // models with those exact materials, even in other pools or scenes.
    idle.clear();
    retained = 0;
  }
  return Object.freeze({ acquire, release, clear, stats });
}
