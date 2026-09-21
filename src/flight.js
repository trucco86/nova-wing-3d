import * as T from 'three';
/** Time-based chase rig: translate faster than aim for visible near/far parallax. */
export function createFlightCamera(camera) {
  const eye = new T.Vector3(0, 10, 32),
    aim = new T.Vector3(0, 8, -70);
  let bank = 0;
  return {
    reset(player) {
      eye.set(player.x * 1.18, 6 + player.y * 0.72, 32);
      aim.set(player.x * 0.28, player.y * 0.5 + 3, -70);
      bank = 0;
      camera.position.copy(eye);
      camera.fov = 60;
      camera.lookAt(aim);
      camera.updateProjectionMatrix();
    },
    update(dt, player, steering, boosting) {
      const a = 1 - Math.exp(-4 * dt);
      eye.lerp(new T.Vector3(player.x * 1.18, 6 + player.y * 0.72, 32), a);
      aim.lerp(new T.Vector3(player.x * 0.28, player.y * 0.5 + 3, -70), a);
      bank += (-steering * 0.045 - bank) * (1 - Math.exp(-3 * dt));
      camera.position.copy(eye);
      camera.lookAt(aim);
      camera.rotateZ(bank);
      camera.fov += ((boosting ? 70 : 60) - camera.fov) * a;
      camera.updateProjectionMatrix();
    },
  };
}
/** A swept sphere/AABB broadphase, including fast forward motion through thin walls. */
export function crossesSolid(from, to, center, half, radius = 1) {
  let lo = 0,
    hi = 1;
  for (const k of ['x', 'y', 'z']) {
    const min = center[k] - half[k] - radius,
      max = center[k] + half[k] + radius;
    const d = to[k] - from[k];
    if (Math.abs(d) < 1e-9) {
      if (from[k] < min || from[k] > max) return false;
    } else {
      let a = (min - from[k]) / d,
        b = (max - from[k]) / d;
      if (a > b) [a, b] = [b, a];
      lo = Math.max(lo, a);
      hi = Math.min(hi, b);
      if (lo > hi) return false;
    }
  }
  return true;
}
