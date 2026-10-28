import * as T from 'three';
/** Time-based chase rig: translate faster than aim for visible near/far parallax. */
export function createFlightCamera(camera, wideFlight = false) {
  const eye = new T.Vector3(0, 10, 32),
    aim = new T.Vector3(0, 8, -70);
  let bank = 0;
  let mode = 'chase';
  let directedShot = 'chase';
  const anchor = new T.Vector2(0, 6);
  const previousPlayer = new T.Vector3(0, 6, 9);
  const targetEye = new T.Vector3(),
    targetAim = new T.Vector3();
  function targets(player, route) {
    const shot = mode === 'chase' ? directedShot : mode;
    if (shot === 'side') {
      // Oblique cinematic chase: retains the ship, reticle and the actual flight corridor.
      targetEye.set(player.x + 33, player.y + 13, player.z + 30);
      targetAim.set(player.x, player.y + 3 + route.ascent * 10, -70);
      return;
    }
    if (shot === 'overhead') {
      // Top-down tactical reveal: shorter than a full-level camera override.
      targetEye.set(player.x, player.y + 75, player.z + 28);
      targetAim.set(player.x, player.y + route.ascent * 9, -74);
      return;
    }
    if (shot === 'cockpit') {
      targetEye.set(player.x, player.y + 1.4, player.z + 2);
      targetAim.set(player.x, player.y + 1.4 + route.ascent * 22, -100);
      return;
    }
    const distant = shot === 'combat';
    const horizontal = Math.min(distant ? 22 : 14, camera.aspect * (distant ? 14 : 7));
    const vertical = distant ? 12 : 7;
    anchor.x = T.MathUtils.clamp(anchor.x, player.x - horizontal, player.x + horizontal);
    anchor.y = T.MathUtils.clamp(anchor.y, player.y - vertical, player.y + vertical);
    targetEye.set(anchor.x, anchor.y + (distant ? 12 : 6), distant ? 62 : 43);
    targetAim.set(anchor.x, anchor.y + 1 + route.ascent * 22, -90);
  }
  return {
    setShot(value) {
      if (wideFlight && ['chase', 'combat', 'side', 'overhead'].includes(value))
        directedShot = value;
    },
    getShot() {
      return mode === 'chase' ? directedShot : mode;
    },
    setMode(value) {
      if (wideFlight && ['chase', 'cockpit', 'combat'].includes(value)) mode = value;
    },
    reset(player) {
      anchor.set(player.x, player.y);
      previousPlayer.copy(player);
      eye.set(player.x * 1.18, 6 + player.y * 0.72, 32);
      aim.set(player.x * 0.28, player.y * 0.5 + 3, -70);
      bank = 0;
      directedShot = 'chase';
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
        const shot = mode === 'chase' ? directedShot : mode;
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
          const maxOffset =
            shot === 'side'
              ? 39
              : shot === 'overhead'
                ? 10
                : Math.min(
                    shot === 'combat' ? 29 : 19,
                    camera.aspect * (shot === 'combat' ? 20 : 10),
                  );
          eye.x = T.MathUtils.clamp(eye.x, player.x - maxOffset, player.x + maxOffset);
        }
        const targetBank = ['cockpit', 'side', 'overhead'].includes(shot)
          ? 0
          : -steering * 0.025 + route.bank * 0.45;
        bank += (targetBank - bank) * (1 - Math.exp(-3 * dt));
        camera.position.copy(eye);
        camera.lookAt(aim);
        camera.rotateZ(bank);
        const fov =
          shot === 'combat' ? 78 : shot === 'cockpit' ? 74 : shot === 'overhead' ? 67 : 64;
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
// Shared city-to-orbit transition used by rendering and encounters.
export function launchAmount(seconds, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return T.MathUtils.clamp((seconds / duration - 0.48) / 0.46, 0, 1);
}
export function launchOrbitReady(amount) {
  const x = T.MathUtils.clamp(amount, 0, 1);
  return x * x * (3 - 2 * x) >= 0.65;
}
export function projectileHitsObstacle(from, to, obstacle, travel = 0, radius = 0.3) {
  if (!obstacle.userData?.solids?.length) return false;
  const previous = from.clone().sub(obstacle.position);
  previous.z += travel;
  const current = to.clone().sub(obstacle.position);
  return obstacle.userData.solids.some((s) =>
    crossesSolid(previous, current, s.center, s.half, radius),
  );
}
/** Before obstacles advance: resolve their swept motion before projectile damage.
 * Unlike projectileHitsObstacle(), the obstacle position is still at frame start.
 */
export function projectileHitsApproachingObstacle(from, to, obstacle, travel = 0, radius = 0.3) {
  if (!obstacle.userData?.solids?.length) return false;
  const previous = from.clone().sub(obstacle.position);
  const current = to.clone().sub(obstacle.position);
  current.z -= travel;
  return obstacle.userData.solids.some((solid) =>
    crossesSolid(previous, current, solid.center, solid.half, radius),
  );
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
