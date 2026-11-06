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
    nozzle.rotation.y = ease(nozzle.rotation.y, -s * 0.31 - side * move * 0.035, step, 8);
    nozzle.rotation.x = ease(nozzle.rotation.x, v * 0.22 - (boosting ? 0.16 : 0), step, 8);
    const pulse = Math.sin(time * (boosting ? 25 : 13) + side * 1.2) * 0.07;
    const length = 0.55 + power * 1.35 + pulse;
    plume.scale.y = ease(plume.scale.y, length, step, 12);
    plume.scale.x = ease(plume.scale.x, 0.77 + power * 0.48, step, 10);
    plume.scale.z = plume.scale.x;
    plume.material.opacity = 0.32 + power * 0.5;
    if (innerPlume) {
      innerPlume.scale.y = ease(innerPlume.scale.y, length * 1.16, step, 14);
      innerPlume.scale.x = 0.62 + power * 0.19;
      innerPlume.scale.z = innerPlume.scale.x;
      innerPlume.material.opacity = 0.52 + power * 0.38;
    }
    if (boostBeam) {
      boostBeam.material.opacity = ease(
        boostBeam.material.opacity,
        boosting ? 0.76 : 0,
        step,
        boosting ? 12 : 16,
      );
      boostBeam.scale.y = ease(boostBeam.scale.y, boosting ? 1.25 : 0.55, step, 11);
      boostBeam.scale.x = ease(boostBeam.scale.x, boosting ? 1.12 : 0.7, step, 9);
      boostBeam.scale.z = boostBeam.scale.x;
      boostBeam.visible = boostBeam.material.opacity > 0.015;
    }
    exhaustCore.scale.setScalar(0.92 + power * 0.18 + pulse * 0.25);
    if (rotor) rotor.rotation.z = (rotor.rotation.z + step * (11 + 20 * power)) % (2 * Math.PI);
  });

  // The body counters momentum; the head stabilizes sight independently.
  const torso = rig.torso;
  if (torso) {
    torso.rotation.z = ease(
      torso.rotation.z,
      -sensedStrafe * 0.11 - turnImpulse * 0.085 - dashSide * 0.18 + breathing * 0.014,
      step,
      7,
    );
    torso.rotation.x = ease(
      torso.rotation.x,
      sensedVertical * 0.065 + (boosting ? 0.06 : 0) + fireKick * 0.065,
      step,
      7,
    );
    torso.rotation.y = ease(torso.rotation.y, sensedStrafe * 0.058, step, 7);
  }
  if (rig.head) {
    rig.head.rotation.y = ease(
      rig.head.rotation.y,
      -s * 0.1 + Math.sin(time * 1.2) * 0.015,
      step,
      6,
    );
    rig.head.rotation.x = ease(rig.head.rotation.x, -v * 0.045 - fireKick * 0.035, step, 7);
  }

  // Real hip and knee pivots make the silhouette visibly mobile, particularly
  // when the player strafes. All motion is within the existing collider.
  for (let i = 0; i < (rig.legs?.length ?? 0); i++) {
    const side = i === 0 ? -1 : 1;
    const leg = rig.legs[i];
    const knee = rig.knees?.[i];
    // Idle mechs hover with stabilized legs, rather than marching in place.
    const pedal = stride * move * (0.025 + move * 0.055) * side;
    leg.rotation.x = ease(
      leg.rotation.x,
      (boosting ? -0.19 : -0.07) + v * 0.11 + pedal + fireKick * 0.08,
      step,
      8,
    );
    leg.rotation.z = ease(leg.rotation.z, -s * 0.1 + side * (boosting ? 0.1 : 0.045), step, 8);
    if (knee)
      knee.rotation.x = ease(
        knee.rotation.x,
        (boosting ? -0.34 : -0.13) + Math.max(0, side * stride) * move * 0.13,
        step,
        10,
      );
  }
  for (let i = 0; i < (rig.wingPivots?.length ?? 0); i++) {
    const side = i === 0 ? -1 : 1;
    const wing = rig.wingPivots[i];
    wing.rotation.z = ease(
      wing.rotation.z,
      side * (0.015 + (boosting ? 0.1 : 0.025)) + s * 0.03,
      step,
      6,
    );
    wing.rotation.x = ease(wing.rotation.x, (boosting ? -0.09 : 0) + v * 0.03, step, 6);
  }

  // RCS hip jets only light up during a real maneuver or boost. No particles,
  // lights or new meshes are instantiated during gameplay.
  for (let i = 0; i < (rig.hipJets?.length ?? 0); i++) {
    const jet = rig.hipJets[i];
    const side = i === 0 ? -1 : 1;
    const thrust = Math.max(
      boosting ? 0.2 : 0,
      side * s < 0 ? Math.abs(s) : 0,
      dashSide !== 0 && side === -dashSide ? 1 : 0,
    );
    jet.visible = thrust > 0.04;
    jet.material.opacity = ease(jet.material.opacity, thrust * 0.7, step, 12);
    jet.scale.y = ease(jet.scale.y, 0.6 + thrust * 1.4, step, 10);
  }

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
