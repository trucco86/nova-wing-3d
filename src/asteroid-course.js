import * as T from 'three';

// Metres in the same local flight coordinates as the asteroid cavern.
// These boxes are the rendered rock itself, not invisible bounding volumes.
export const ASTEROID_COURSE = Object.freeze(
  [
    { x: -20.8, y: 10, z: -850, hx: 18.2, hy: 36, hz: 18, kind: 'fissure' },
    { x: 20.8, y: 10, z: -850, hx: 18.2, hy: 36, hz: 18, kind: 'fissure' },
    { x: 0, y: 10, z: -1170, hx: 5, hy: 8, hz: 10, kind: 'fragment' },
    { x: -19, y: 5, z: -1410, hx: 7, hy: 12, hz: 8, kind: 'fragment' },
    { x: 19, y: 18, z: -1410, hx: 7, hy: 12, hz: 8, kind: 'fragment' },
    { x: -10, y: 36, z: -1630, hx: 10, hy: 6, hz: 12, kind: 'tooth' },
    { x: -10, y: 28, z: -1630, hx: 6, hy: 2, hz: 8, kind: 'tooth' },
    { x: -10, y: 24, z: -1630, hx: 2, hy: 2, hz: 4, kind: 'tooth' },
    { x: 14, y: -13, z: -1750, hx: 9, hy: 6, hz: 12, kind: 'tooth' },
    { x: 14, y: -5, z: -1750, hx: 5, hy: 2, hz: 8, kind: 'tooth' },
    { x: 14, y: -1, z: -1750, hx: 2, hy: 2, hz: 4, kind: 'tooth' },
  ].map(Object.freeze),
);

// Conservative chassis envelope measured once, excluding translucent engine
// plumes, lights and shields. Keep attachments inside the physical hull.
export function measurePilotHull(root, excluded = null) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert();
  const bounds = new T.Box3();
  const transform = new T.Matrix4();
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    for (let parent = mesh; parent && parent !== root; parent = parent.parent)
      if (parent === excluded) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.some((material) => material.transparent)) return;
    mesh.geometry.computeBoundingBox();
    transform.multiplyMatrices(inverse, mesh.matrixWorld);
    bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(transform));
  });
  return {
    x: Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x)),
    y: Math.max(Math.abs(bounds.min.y), Math.abs(bounds.max.y)),
    z: Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z)),
  };
}
const rotationMatrix = new T.Matrix4();
export function projectPilotHull(hull, rotation, scale = 1) {
  const e = rotationMatrix.makeRotationFromEuler(rotation).elements;
  return {
    x: (Math.abs(e[0]) * hull.x + Math.abs(e[4]) * hull.y + Math.abs(e[8]) * hull.z) * scale,
    y: (Math.abs(e[1]) * hull.x + Math.abs(e[5]) * hull.y + Math.abs(e[9]) * hull.z) * scale,
    z: (Math.abs(e[2]) * hull.x + Math.abs(e[6]) * hull.y + Math.abs(e[10]) * hull.z) * scale,
  };
}

// Slab intersection in Minkowski space; hull extents come from visible bank.
// An axis resting on a boundary is clear, so sliding away never gets trapped.
export function rockSweep(from, to, solid, half, offset = 0) {
  let enter = 0;
  let exit = 1;
  for (const axis of ['x', 'y', 'z']) {
    const center = solid[axis] + (axis === 'z' ? offset : 0);
    const extent = solid['h' + axis] + half[axis];
    const min = center - extent;
    const max = center + extent;
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < 1e-10) {
      if (from[axis] <= min + 1e-6 || from[axis] >= max - 1e-6) return null;
      continue;
    }
    let near = (min - from[axis]) / delta;
    let far = (max - from[axis]) / delta;
    if (near > far) [near, far] = [far, near];
    enter = Math.max(enter, near);
    exit = Math.min(exit, far);
    if (enter >= exit || exit <= 0) return null;
  }
  return enter < 1 ? enter : null;
}

export function createAsteroidCourse(scene, enabled = true) {
  const root = new T.Group();
  root.name = 'asteroid-physical-course';
  const geometry = new T.BoxGeometry(1, 1, 1);
  const material = new T.MeshStandardMaterial({
    color: '#89717b',
    roughness: 0.91,
    metalness: 0.2,
  });
  const rocks = new T.InstancedMesh(geometry, material, ASTEROID_COURSE.length);
  rocks.name = 'asteroid-course-rocks';
  const dummy = new T.Object3D();
  for (let i = 0; i < ASTEROID_COURSE.length; i++) {
    const rock = ASTEROID_COURSE[i];
    dummy.position.set(rock.x, rock.y, rock.z);
    dummy.scale.set(rock.hx * 2, rock.hy * 2, rock.hz * 2);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    rocks.setColorAt(i, new T.Color(['#83737d', '#796882', '#637480'][i % 3]));
  }
  rocks.instanceMatrix.needsUpdate = true;
  rocks.instanceColor.needsUpdate = true;
  root.add(rocks);
  const signalMaterial = new T.MeshBasicMaterial({ color: '#89e4e8', toneMapped: false });
  const markers = new T.InstancedMesh(geometry, signalMaterial, 8);
  for (let i = 0; i < 8; i++) {
    dummy.position.set(i % 2 ? 2.85 : -2.85, -5 + Math.floor(i / 2) * 10, -831.8);
    dummy.scale.set(0.2, 4, 0.2);
    dummy.updateMatrix();
    markers.setMatrixAt(i, dummy.matrix);
  }
  markers.instanceMatrix.needsUpdate = true;
  root.add(markers);
  scene.add(root);
  let phase = 'inactive';
  let offset = 0;
  let blocked = false;
  let recovering = false;
  function active() {
    return enabled && ['transition', 'interior'].includes(phase);
  }
  function firstHit(from, to, half) {
    let first = null;
    for (const rock of ASTEROID_COURSE) {
      const hit = rockSweep(from, to, rock, half, offset);
      if (hit !== null && (first === null || hit < first)) first = hit;
    }
    return first;
  }
  return {
    setPhase(next) {
      phase = next;
      root.visible = enabled && ['approach', 'transition', 'interior'].includes(next);
      if (!active()) blocked = false;
    },
    reset() {
      offset = 0;
      blocked = false;
      recovering = false;
      root.position.z = 0;
    },
    overlaps(position, half) {
      return active() && firstHit(position, position, half) !== null;
    },
    constrain(from, to, half) {
      const hit = active() ? firstHit(from, to, half) : null;
      const fraction = hit === null ? 1 : Math.max(0, hit - 1e-5);
      return {
        collided: hit !== null,
        x: from.x + (to.x - from.x) * fraction,
        y: from.y + (to.y - from.y) * fraction,
        z: from.z + (to.z - from.z) * fraction,
      };
    },
    advance(distance, position, half, clearanceHalf = half) {
      if (!active() || !position || !half || distance <= 0) return { distance, collided: false };
      // Death, relay or a longer transforming chassis may need real space.
      // Back the whole cavern away continuously, never teleport the player
      // or disable the rock. Normal contact stops just outside this case.
      recovering = firstHit(position, position, clearanceHalf) !== null;
      if (recovering) {
        offset -= distance;
        root.position.z = offset;
        blocked = false;
        return { distance: -distance, collided: false };
      }
      // Moving rocks are equivalent to sweeping the pilot backwards in Z.
      const hit = firstHit(position, { ...position, z: position.z - distance }, half);
      const allowed = hit === null ? distance : Math.max(0, distance * hit - 0.001);
      offset += allowed;
      root.position.z = offset;
      blocked = hit !== null;
      return { distance: allowed, collided: blocked };
    },
    projectileBlocked(from, to) {
      return active() && firstHit(from, to, { x: 0, y: 0, z: 0 }) !== null;
    },
    snapshot() {
      return {
        enabled,
        offset,
        blocked,
        recovering,
        complete: !enabled || offset > 2000,
        solids: ASTEROID_COURSE.length,
      };
    },
    destroy() {
      scene.remove(root);
      rocks.dispose();
      markers.dispose();
      geometry.dispose();
      material.dispose();
      signalMaterial.dispose();
    },
  };
}
