import * as T from 'three';

// VFX-only pooling. No VFX participates in collisions or damage calculation.
// Keep the original spark/halo/ring materials, scale curves and lifetimes.
// Materials are unique per particle so fading one does not fade its neighbors.
export function createParticlePool({
  scene,
  sparkGeometry,
  createHalo,
  maxRetained = { spark: 256, flash: 64, wave: 32 },
} = {}) {
  const limits = { spark: maxRetained.spark, flash: maxRetained.flash, wave: maxRetained.wave };
  for (const limit of Object.values(limits))
    if (!Number.isInteger(limit) || limit < 0 || limit > 1000)
      throw new RangeError('particle pool limits must be between 0 and 1000');
  const idle = { spark: [], flash: [], wave: [] };
  const active = new Set();
  const created = { spark: 0, flash: 0, wave: 0 };
  const reused = { spark: 0, flash: 0, wave: 0 };
  // Every shockwave shared this identical geometry even before pooling.
  const waveGeometry = new T.RingGeometry(1, 1.2, 48);

  function make(kind) {
    let o;
    if (kind === 'spark') {
      o = new T.Mesh(
        sparkGeometry,
        new T.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          blending: T.AdditiveBlending,
          depthWrite: false,
        }),
      );
    } else if (kind === 'wave') {
      o = new T.Mesh(
        waveGeometry,
        new T.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.9,
          blending: T.AdditiveBlending,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
    } else {
      o = createHalo(0xffffff, 1, 0.85);
      // halo() caches a shared material: the independent clone is required
      // for color, opacity and impact-through-armor depthTest.
      o.material = o.material.clone();
    }
    created[kind]++;
    return { kind, o, v: new T.Vector3(), life: 0 };
  }
  function acquire(kind, position, color, life, size, opacity, depthTest) {
    const wasIdle = idle[kind].length > 0;
    const particle = wasIdle ? idle[kind].pop() : make(kind);
    if (wasIdle) reused[kind]++;
    const { o } = particle;
    o.position.copy(position);
    o.rotation.set(0, 0, 0);
    if (kind === 'flash') o.scale.set(size, size, 1);
    else o.scale.setScalar(1);
    o.material.color.set(color);
    if (kind === 'spark') o.material.color.multiplyScalar(2.2);
    o.material.opacity = opacity;
    o.material.depthTest = depthTest;
    o.renderOrder = kind === 'flash' && !depthTest ? 100 : 0;
    particle.v.set(0, 0, 0);
    particle.life = life;
    active.add(particle);
    scene.add(o);
    return particle;
  }
  function spark(position, color, vx, vy, vz, life) {
    const particle = acquire('spark', position, color, life, 1, 1, true);
    particle.v.set(vx, vy, vz);
    return particle;
  }
  function flash(position, color, size, opacity, life, depthTest = true) {
    return acquire('flash', position, color, life, size, opacity, depthTest);
  }
  function wave(position, color, life = 0.6) {
    return acquire('wave', position, color, life, 1, 0.9, true);
  }
  function release(particle) {
    if (!active.delete(particle)) return false;
    scene.remove(particle.o);
    particle.life = 0;
    const list = idle[particle.kind];
    if (list.length < limits[particle.kind]) list.push(particle);
    else particle.o.material.dispose();
    return true;
  }
  function clear() {
    for (const particle of active) {
      scene.remove(particle.o);
      particle.o.material.dispose();
    }
    active.clear();
    for (const list of Object.values(idle)) {
      for (const particle of list) particle.o.material.dispose();
      list.length = 0;
    }
    waveGeometry.dispose();
  }
  function stats() {
    return {
      active: active.size,
      created: { ...created },
      reused: { ...reused },
      retained: Object.fromEntries(Object.entries(idle).map(([kind, list]) => [kind, list.length])),
    };
  }
  return Object.freeze({ spark, flash, wave, release, clear, stats });
}
