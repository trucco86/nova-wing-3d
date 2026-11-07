const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ease = (current, target, dt, speed) =>
  current + (target - current) * (1 - Math.exp(-Math.max(0, dt) * speed));

/**
 * A lightweight, deterministic flying-mech animation layer.
 * The world-space muzzle and flight camera remain owned by the game; only
 * visual bones are animated. The rig never allocates geometry in the frame loop.
 */
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
    precisionRecoil = 0,
    dashing = false,
    dashDirection = 1,
  } = {},
) {
  const rig = robot.userData.mecha;
  if (!rig) return;
  const step = clamp(dt, 0, 0.05);
  if (step === 0) return { thrust: 0, tracking: !!targetWorld, moving: false };
  const s = clamp(strafe, -1, 1);
  const v = clamp(vertical, -1, 1);
  const move = Math.min(1, Math.hypot(s, v));
  const power = boosting ? 1 : clamp(0.29 + move * 0.27, 0, 0.72);
  const fireKick = clamp(recoil, 0, 1);
  const precisionKick = clamp(precisionRecoil, 0, 1);
  const dashSide = dashing ? (dashDirection < 0 ? -1 : 1) : 0;
  const breathing = Math.sin(time * 2.2);
  const stride = Math.sin(time * (boosting ? 7.3 : 4.5));
  const motion = rig.motion;
  const previousStrafe = motion?.strafe ?? s;
  const sensedStrafe = motion ? (motion.strafe = ease(previousStrafe, s, step, 8)) : s;
  const turnImpulse = s - sensedStrafe;
  const sensedVertical = motion ? (motion.vertical = ease(motion.vertical, v, step, 8)) : v;

  // Dorsal gimbals react to lateral flight and vertical steering separately;
  // layered blue plasma becomes warm at full BOOST, like the concept's engine.
  if (rig.boostPalette !== boosting) {
    rig.boostPalette = boosting;
    for (const { plume, innerPlume } of rig.thrusters) {
      plume.material.color.set(boosting ? '#ff9750' : '#4fd5ff');
      innerPlume?.material.color.set(boosting ? '#fff0be' : '#d7faff');
    }
  }
  rig.thrusters.forEach(({ nozzle, plume, innerPlume, boostBeam, exhaustCore, rotor }, i) => {
    const side = i === 0 ? -1 : 1;
    nozzle.rotation.y = ease(nozzle.rotation.y, -s * 0.26, dt, 6);
    nozzle.rotation.x = ease(nozzle.rotation.x, v * 0.19 + (boosting ? -0.14 : 0), dt, 6);
    plume.scale.y = ease(
      plume.scale.y,
      0.42 +
        thrust * (boosting ? 4.35 : 1.45) +
        Math.sin(time * (boosting ? 27 : 12) + side) * 0.08,
      dt,
      12,
    );
    // Rotate cone toward -Z at authoring time and translate its center
    // so the narrow nozzle tip stays at the actual engine outlet.
    plume.position.z = 0.6 + plume.scale.y * 0.675;
    plume.scale.x = ease(plume.scale.x, 0.72 + thrust * (boosting ? 0.78 : 0.26), dt, 10);
    plume.scale.z = plume.scale.x;
    plume.material.opacity = 0.44 + thrust * 0.48;
    exhaustCore.scale.setScalar(boosting ? 1.28 : 1);
  });
  const { left, right } = rig.arms;
  const firePulse = firing ? 0.042 + Math.sin(time * 32) * 0.025 : 0;
  right.shoulder.rotation.x = ease(
    right.shoulder.rotation.x,
    1.07 + firePulse + fireKick * 0.57 + v * 0.04,
    step,
    12,
  );
  // Right cannon stays on its forward axis; the torso absorbs the turn.
  // The left arm alone yaws to lock-on targets, per the dual-aim contract.
  right.shoulder.rotation.y = ease(right.shoulder.rotation.y, 0, step, 8);
  right.shoulder.rotation.z = ease(
    right.shoulder.rotation.z,
    -0.05 + s * 0.1 + breathing * 0.016,
    step,
    8,
  );
  right.elbow.rotation.x = ease(right.elbow.rotation.x, -0.13 - fireKick * 0.38, step, 15);
  right.elbow.rotation.y = ease(right.elbow.rotation.y, s * 0.055, step, 12);
  right.muzzle.position.z = ease(
    right.muzzle.position.z,
    right.muzzle.userData.restBarrelZ + fireKick * 0.24,
    step,
    20,
  );

  let leftX = 0.93 + 0.06 * Math.sin(time * 1.5);
  let leftY = -s * 0.06;
  let leftZ = -0.04;
  if (targetWorld?.isVector3) {
    robot.updateMatrixWorld(true);
    // The left shoulder is now anchored to the moving torso. Project the
    // target into that parent's local space so aim does not drift with sway.
    const target = left.shoulder.parent
      .worldToLocal(targetWorld.clone())
      .sub(left.shoulder.position);
    const yaw = Math.atan2(target.x, Math.max(1, -target.z));
    const elevation = Math.atan2(target.y, Math.max(1, -target.z));
    leftY = clamp(yaw, -0.7, 0.7);
    leftX = clamp(1.03 - elevation, 0.5, 1.55);
    leftZ = clamp(-yaw * 0.38, -0.27, 0.27);
  }
  left.shoulder.rotation.x = ease(
    left.shoulder.rotation.x,
    leftX + precisionKick * 0.53 - v * 0.025,
    step,
    9,
  );
  left.shoulder.rotation.y = ease(left.shoulder.rotation.y, leftY, step, 9);
  left.shoulder.rotation.z = ease(left.shoulder.rotation.z, leftZ - s * 0.03, step, 9);
  left.elbow.rotation.x = ease(left.elbow.rotation.x, -0.19 - precisionKick * 0.34, step, 14);
  left.muzzle.position.z = ease(
    left.muzzle.position.z,
    left.muzzle.userData.restBarrelZ + precisionKick * 0.24,
    step,
    20,
  );

  robot.rotation.z = ease(
    robot.rotation.z,
    -s * 0.12 - dashSide * 0.3 + breathing * 0.012,
    step,
    dashing ? 14 : 6,
  );
  robot.rotation.x = ease(robot.rotation.x, v * 0.045 + (boosting ? -0.055 : 0), step, 6);
  const scale = rig.baseScale * (1 + clamp(transforming, 0, 1) * 0.14);
  robot.scale.setScalar(scale);
  return { thrust: power, tracking: !!targetWorld, moving: move > 0.05 };
}

export function resetMechaPose(robot) {
  const rig = robot.userData.mecha;
  if (!rig) return;
  for (const group of [rig.torso, rig.head, ...rig.legs, ...rig.knees, ...rig.wingPivots]) {
    group?.rotation.set(0, 0, 0);
  }
  for (const arm of Object.values(rig.arms)) {
    arm.shoulder.rotation.set(0, 0, 0);
    arm.elbow.rotation.set(0, 0, 0);
    arm.muzzle.position.z = arm.muzzle.userData.restBarrelZ;
  }
  for (const { nozzle, plume, innerPlume, boostBeam, exhaustCore, rotor } of rig.thrusters) {
    nozzle.rotation.set(0, 0, 0);
    plume.scale.set(1, 1, 1);
    plume.material.opacity = 0.46;
    plume.material.color.set('#4fd5ff');
    if (innerPlume) {
      innerPlume.scale.set(1, 1, 1);
      innerPlume.material.color.set('#d7faff');
    }
    if (boostBeam) {
      boostBeam.visible = false;
      boostBeam.material.opacity = 0;
      boostBeam.scale.set(1, 1, 1);
    }
    exhaustCore.scale.setScalar(1);
    if (rotor) rotor.rotation.z = 0;
  }
  if (rig.motion) {
    rig.motion.strafe = 0;
    rig.motion.vertical = 0;
  }
  rig.boostPalette = null;
  for (const jet of rig.hipJets ?? []) {
    jet.visible = false;
    jet.material.opacity = 0;
    jet.scale.set(1, 1, 1);
  }
  robot.rotation.set(0, 0, 0);
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
