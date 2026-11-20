import * as T from 'three';

// Only the exploration avatar is rigged. Hangar/launch character assets stay untouched.
// Drive gait from measured travel, not intended input, so collisions stop the feet.
export function createOrbit9WalkRig(pilot) {
  const legs = [];
  const arms = [];
  const take = (name, side) =>
    pilot.children.find((node) => node.name === name && Math.sign(node.position.x) === side);
  const mount = (node, parent, pivot) => {
    if (!node) return;
    node.position.sub(pivot);
    parent.add(node);
  };
  for (const side of [-1, 1]) {
    const hipPoint = new T.Vector3(side * 0.32, -0.45, 0);
    const kneePoint = new T.Vector3(side * 0.32, -1.1, 0);
    const hip = new T.Group();
    hip.name = side === -1 ? 'orbit9-left-hip' : 'orbit9-right-hip';
    hip.position.copy(hipPoint);
    const knee = new T.Group();
    knee.name = side === -1 ? 'orbit9-left-knee' : 'orbit9-right-knee';
    knee.position.copy(kneePoint).sub(hipPoint);
    mount(take('leg', side), hip, hipPoint);
    mount(take('knee', side), knee, kneePoint);
    mount(take('boot', side), knee, kneePoint);
    hip.add(knee);
    pilot.add(hip);
    legs.push({ hip, knee, side });
    const shoulderPoint = new T.Vector3(side * 0.76, 0.75, 0);
    const arm = new T.Group();
    arm.name = side === -1 ? 'orbit9-left-shoulder' : 'orbit9-right-shoulder';
    arm.position.copy(shoulderPoint);
    mount(take('arm', side), arm, shoulderPoint);
    mount(take('glove', side), arm, shoulderPoint);
    pilot.add(arm);
    arms.push({ arm, side });
  }
  let phase = 0;
  let blend = 0;
  let distance = 0;
  const smooth = (v, target, dt, frequency = 10) =>
    v + (target - v) * (1 - Math.exp(-dt * frequency));

  return {
    update({ distanceTravelled = 0, dt = 0, boost = false } = {}) {
      const elapsed = Math.max(0, Math.min(dt, 0.05));
      const travel = Math.max(0, distanceTravelled);
      distance += travel;
      if (travel > 0.0001) phase += travel * (boost ? 1.08 : 0.82);
      blend = smooth(blend, travel > 0.0001 ? 1 : 0, elapsed, 12);
      for (const { hip, knee, side } of legs) {
        const swing = Math.sin(phase + (side === -1 ? 0 : Math.PI));
        hip.rotation.x = smooth(hip.rotation.x, swing * 0.56 * blend, elapsed);
        knee.rotation.x = smooth(knee.rotation.x, Math.max(0, -swing) * 0.49 * blend, elapsed);
      }
      for (const { arm, side } of arms) {
        const swing = Math.sin(phase + (side === -1 ? Math.PI : 0));
        arm.rotation.x = smooth(arm.rotation.x, swing * 0.27 * blend, elapsed);
      }
      // Boot soles are close to floor y=0, with only a small gait-dependent rise.
      pilot.position.y = 1.92 + Math.abs(Math.sin(phase)) * 0.065 * blend;
    },
    snapshot() {
      return {
        phase,
        blend,
        distance,
        leftHip: legs[0].hip.rotation.x,
        rightHip: legs[1].hip.rotation.x,
        leftKnee: legs[0].knee.rotation.x,
        rightKnee: legs[1].knee.rotation.x,
      };
    },
  };
}

export function orbit9StickAxes(dx, dy, radius) {
  if (![dx, dy, radius].every(Number.isFinite) || radius <= 0) return { x: 0, z: 0 };
  const limited = Math.min(1, Math.hypot(dx, dy) / radius);
  if (limited < 0.2) return { x: 0, z: 0 };
  const normalized = (limited - 0.2) / 0.8;
  const angle = Math.atan2(dy, dx);
  return { x: Math.cos(angle) * normalized, z: Math.sin(angle) * normalized };
}
