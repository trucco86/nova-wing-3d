import * as T from 'three';

// Small fixed-size pool of world-space streaks. Never parent these to the
// robot: a trail that moves with the player cannot show lateral velocity.
const STREAKS = 16;
const LIFETIME = 0.32;
export function createMechaDashTrail(scene) {
  const geometry = new T.PlaneGeometry(1, 1);
  const rails = Array.from({ length: STREAKS }, (_, index) => {
    const material = new T.MeshBasicMaterial({
      color: index % 2 ? '#99f4ff' : '#d6b6ff',
      transparent: true,
      opacity: 0,
      blending: T.AdditiveBlending,
      depthWrite: false,
      side: T.DoubleSide,
    });
    const mesh = new T.Mesh(geometry, material);
    mesh.name = 'mecha-dash-afterimage-' + index;
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.userData.visualOnly = true;
    scene.add(mesh);
    return { mesh, age: LIFETIME };
  });
  let cursor = 0;
  function reset() {
    for (const item of rails) {
      item.age = LIFETIME;
      item.mesh.visible = false;
      item.mesh.material.opacity = 0;
    }
    cursor = 0;
  }
  function emit(previous, current) {
    const dx = current.x - previous.x;
    if (!Number.isFinite(dx) || Math.abs(dx) < 0.04) return;
    for (const offset of [-1.5, 1.5]) {
      const item = rails[cursor];
      cursor = (cursor + 1) % rails.length;
      item.age = 0;
      const mesh = item.mesh;
      mesh.visible = true;
      mesh.material.opacity = 0.83;
      // Two energy rails stay behind at the positions the robot occupied.
      mesh.position.set(
        (previous.x + current.x) / 2,
        (previous.y + current.y) / 2 + offset,
        current.z + 1.7,
      );
      mesh.scale.set(Math.abs(dx) + 1.4, 0.27, 1);
    }
  }
  function update(dt) {
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dash trail dt');
    for (const item of rails) {
      if (!item.mesh.visible) continue;
      item.age = Math.min(LIFETIME, item.age + dt);
      const fade = 1 - item.age / LIFETIME;
      item.mesh.material.opacity = Math.max(0, fade * fade * 0.83);
      item.mesh.visible = item.age < LIFETIME;
    }
  }
  function snapshot() {
    return {
      visible: rails.filter((item) => item.mesh.visible).length,
      max: STREAKS,
      longest: Math.max(0, ...rails.filter((item) => item.mesh.visible).map((item) => item.mesh.scale.x)),
    };
  }
  function destroy() {
    for (const { mesh } of rails) {
      scene.remove(mesh);
      mesh.material.dispose();
    }
    geometry.dispose();
  }
  return { emit, update, reset, snapshot, destroy };
}
