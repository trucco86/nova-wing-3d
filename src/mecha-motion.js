const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = (current, target, dt, speed) =>
  current + (target - current) * (1 - Math.exp(-Math.max(0, dt) * speed));

/** Position and fire-control can drive each arm independently at a stable dt. */
export function updateMechaPose(
  robot,
  {
    dt = 0,
    time = 0,
    boosting = false,
    strafe = 0,
    vertical = 0,
    firing = false,
    targetWorld = null,
    transforming = 0,
    recoil = 0,
  } = {},
) {
  const rig = robot.userData.mecha;
  if (!rig) return;
  const s = clamp(strafe, -1, 1);
  const v = clamp(vertical, -1, 1);
  const thrust = boosting ? 1 : clamp(0.32 + Math.abs(s) * 0.12 + Math.abs(v) * 0.18, 0, 0.75);
  rig.thrusters.forEach(({ nozzle, plume, exhaustCore }, i) => {
    const side = i === 0 ? -1 : 1;
    nozzle.rotation.y = ease(nozzle.rotation.y, -s * 0.26, dt, 6);
    nozzle.rotation.x = ease(nozzle.rotation.x, v * 0.19 + (boosting ? -0.14 : 0), dt, 6);
    plume.scale.y = ease(
      plume.scale.y,
      0.53 + thrust * 1.1 + Math.sin(time * (boosting ? 27 : 12) + side) * 0.08,
      dt,
      8,
    );
    plume.scale.x = ease(plume.scale.x, 0.72 + thrust * 0.5, dt, 8);
    plume.scale.z = plume.scale.x;
    plume.material.opacity = 0.38 + thrust * 0.55;
    exhaustCore.scale.y = plume.scale.y * 0.86;
  });
  const { left, right } = rig.arms;
  const firingRecoil = firing ? 0.05 + Math.sin(time * 32) * 0.045 : 0;
  right.shoulder.rotation.x = ease(right.shoulder.rotation.x, 1.07 + firingRecoil + recoil * 0.65, dt, 11);
  right.shoulder.rotation.z = ease(right.shoulder.rotation.z, -0.05 + s * 0.08, dt, 8);
  right.elbow.rotation.x = ease(right.elbow.rotation.x, -0.13 - recoil * 0.22, dt, 14);

  let leftX = 0.9 + 0.06 * Math.sin(time * 1.5);
  let leftY = 0.03;
  let leftZ = -0.04;
  if (targetWorld?.isVector3) {
    robot.updateMatrixWorld(true);
    const target = robot.worldToLocal(targetWorld.clone()).sub(left.shoulder.position);
    const yaw = Math.atan2(target.x, Math.max(1, -target.z));
    const elevation = Math.atan2(target.y, Math.max(1, -target.z));
    leftY = clamp(yaw, -0.7, 0.7);
    leftX = clamp(1.03 - elevation, 0.5, 1.55);
    leftZ = clamp(-yaw * 0.38, -0.27, 0.27);
  }
  left.shoulder.rotation.x = ease(left.shoulder.rotation.x, leftX + recoil * 0.42, dt, 7);
  left.shoulder.rotation.y = ease(left.shoulder.rotation.y, leftY, dt, 7);
  left.shoulder.rotation.z = ease(left.shoulder.rotation.z, leftZ, dt, 7);
  left.elbow.rotation.x = ease(left.elbow.rotation.x, -0.2 + recoil * 0.08, dt, 10);
  robot.rotation.z = ease(robot.rotation.z, -s * 0.12, dt, 6);
  const scale = rig.baseScale * (1 + clamp(transforming, 0, 1) * 0.14);
  robot.scale.setScalar(scale);
  return { thrust, tracking: !!targetWorld };
}

/** Lock-on requires an unobstructed, alive target in front of the player. */
export function selectMechaTarget(
  origin,
  candidates,
  { visible = () => true, maxDistance = 250 } = {},
) {
  let best = null;
  let score = Infinity;
  for (const candidate of candidates) {
    if (!candidate?.position?.isVector3 || candidate.alive === false) continue;
    const dx = candidate.position.x - origin.x;
    const dy = candidate.position.y - origin.y;
    const forward = origin.z - candidate.position.z;
    if (forward < 8 || forward > maxDistance) continue;
    const angle = Math.atan2(Math.hypot(dx, dy), forward);
    if (angle > 0.48 || !visible(origin, candidate.position)) continue;
    const priority = angle * 200 + forward * 0.2 - (candidate.weak ? 20 : 0);
    if (priority < score) {
      best = candidate;
      score = priority;
    }
  }
  return best;
}
