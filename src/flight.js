import * as T from 'three';
/** Time-based chase rig: translate faster than aim for visible near/far parallax. */
export function createFlightCamera(camera, wideFlight = false) {
  const eye = new T.Vector3(0, 10, 32),
    aim = new T.Vector3(0, 8, -70);
  let bank = 0;
  let mode = 'chase';
  const anchor = new T.Vector2(0, 6);
  const previousPlayer = new T.Vector3(0, 6, 9);
  const targetEye = new T.Vector3(),
    targetAim = new T.Vector3();
  function targets(player, route) {
    if (mode === 'cockpit') {
      targetEye.set(player.x, player.y + 1.4, player.z + 2);
      targetAim.set(player.x, player.y + 1.4 + route.ascent * 22, -100);
      return;
    }
    const distant = mode === 'combat';
    const horizontal = Math.min(distant ? 22 : 14, camera.aspect * (distant ? 14 : 7));
    const vertical = distant ? 12 : 7;
    anchor.x = T.MathUtils.clamp(anchor.x, player.x - horizontal, player.x + horizontal);
    anchor.y = T.MathUtils.clamp(anchor.y, player.y - vertical, player.y + vertical);
    targetEye.set(anchor.x, anchor.y + (distant ? 12 : 6), distant ? 62 : 43);
    targetAim.set(anchor.x, anchor.y + 1 + route.ascent * 22, -90);
  }
  return {
    setMode(value) {
      if (wideFlight && ['chase', 'cockpit', 'combat'].includes(value)) mode = value;
    },
    reset(player) {
      anchor.set(player.x, player.y);
      previousPlayer.copy(player);
      eye.set(player.x * 1.18, 6 + player.y * 0.72, 32);
      aim.set(player.x * 0.28, player.y * 0.5 + 3, -70);
      bank = 0;
      if (wideFlight) {
        targets(player, { ascent: 0 });
        eye.copy(targetEye);
        aim.copy(targetAim);
      }
      camera.position.copy(eye);
      camera.fov = 60;
      camera.lookAt(aim);
      camera.updateProjectionMatrix();
    },
    update(dt, player, steering, boosting, route = { bank: 0, ascent: 0 }) {
      const a = 1 - Math.exp(-4 * dt);
      if (wideFlight) {
        if (mode === 'cockpit') {
          const delta = player.clone().sub(previousPlayer);
          eye.add(delta);
          aim.add(delta);
        }
        previousPlayer.copy(player);
        targets(player, route);
        eye.lerp(targetEye, a);
        aim.lerp(targetAim, a);
        // Limit lag relative to the ship so fast input cannot leave a narrow screen.
        if (mode !== 'cockpit') {
          const maxOffset = Math.min(
            mode === 'combat' ? 29 : 19,
            camera.aspect * (mode === 'combat' ? 20 : 10),
          );
          eye.x = T.MathUtils.clamp(eye.x, player.x - maxOffset, player.x + maxOffset);
        }
        const targetBank = mode === 'cockpit' ? 0 : -steering * 0.025 + route.bank * 0.45;
        bank += (targetBank - bank) * (1 - Math.exp(-3 * dt));
        camera.position.copy(eye);
        camera.lookAt(aim);
        camera.rotateZ(bank);
        const fov = mode === 'combat' ? 78 : mode === 'cockpit' ? 74 : 64;
        camera.fov += (fov + (boosting ? 6 : 0) - camera.fov) * a;
        camera.updateProjectionMatrix();
        return;
      }
      eye.lerp(new T.Vector3(player.x * 1.18, 6 + player.y * 0.72 + route.ascent * 4, 32), a);
      aim.lerp(new T.Vector3(player.x * 0.28, player.y * 0.5 + 3 + route.ascent * 12, -70), a);
      bank += (-steering * 0.045 + route.bank - bank) * (1 - Math.exp(-3 * dt));
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
