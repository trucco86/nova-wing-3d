import * as T from 'three';

// QA P0: detailed hero-only hard-surface kit. This is deliberately a visual
// sub-rig: it never changes ship collision, hit volumes or flight controls.
const cube = new T.BoxGeometry(1, 1, 1);
const cone = new T.ConeGeometry(1, 1, 6);
const cylinder = new T.CylinderGeometry(1, 1, 1, 10);
function add(parent, shape, material, name, position, size, rotation = [0, 0, 0]) {
  const mesh = new T.Mesh(shape, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...size);
  mesh.rotation.set(...rotation);
  mesh.userData.visualOnly = true;
  parent.add(mesh);
  return mesh;
}
function hinge(parent, name, position) {
  const joint = new T.Group();
  joint.name = name;
  joint.position.set(...position);
  parent.add(joint);
  return joint;
}

export function installPremiumMechaDetails(robot, { armor, graphite, accent, luminous }) {
  if (!robot?.userData?.mecha || !robot.userData.mechRig) return null;
  if (robot.userData.premiumMecha) return robot.userData.premiumMecha;
  const forearms = [];
  const calves = [];
  const kneePistons = [];
  const vents = [];
  const crest = [];
  // Side-shoulders and forearms are designed around the existing independent
  // lock-on wrists; laser muzzle pointers and arm IK remain untouched.
  for (const side of [-1, 1]) {
    const arm = robot.userData.mecha.arms[side < 0 ? 'left' : 'right'].shoulder;
    const leg = robot.userData.mechRig.legs[side < 0 ? 0 : 1];
    const shoulderArmor = hinge(arm, 'premium-shoulder-fold-' + side, [0, 0.05, -0.1]);
    add(
      shoulderArmor,
      cube,
      armor,
      'premium-delta-shoulder',
      [side * 0.19, -0.26, -0.22],
      [1.15, 1.2, 1.17],
      [0, 0, side * 0.13],
    );
    add(
      shoulderArmor,
      cube,
      graphite,
      'premium-shoulder-serration',
      [side * 0.34, -0.34, -0.94],
      [0.75, 0.85, 0.2],
    );
    add(
      shoulderArmor,
      cube,
      luminous,
      'premium-shoulder-charge-line',
      [side * 0.36, -0.3, -1.055],
      [0.16, 0.68, 0.12],
    );
    add(
      shoulderArmor,
      cone,
      accent,
      'premium-upper-arm-dorsal-blade',
      [side * 0.86, -0.44, 0.04],
      [0.22, 1.45, 0.5],
      [0, 0, side * -0.18],
    );

    const forearm = hinge(arm, 'premium-forearm-extend-' + side, [0, -1.65, -0.52]);
    add(
      forearm,
      cube,
      armor,
      'premium-extended-forearm',
      [0, -0.65, -0.2],
      [0.91, 2.15, 0.83],
      [0.08, 0, side * 0.08],
    );
    add(forearm, cube, graphite, 'premium-hydraulic-piston', [0, -0.38, 0.39], [0.22, 1.7, 0.26]);
    add(forearm, cylinder, accent, 'premium-wrist-bearing', [0, -1.58, -0.45], [0.45, 0.26, 0.45]);
    for (let n = 0; n < 3; n++)
      add(
        forearm,
        cube,
        luminous,
        'premium-forearm-rail-' + n,
        [side * 0.39, -0.48 - n * 0.4, -0.68],
        [0.12, 0.21, 0.17],
      );
    forearms.push({ arm: shoulderArmor, forearm, side });

    const kneecap = hinge(leg, 'premium-knee-piston-' + side, [0, -1.65, -0.6]);
    add(
      kneecap,
      cube,
      accent,
      'premium-knee-front-armor',
      [0, 0, -0.28],
      [0.95, 0.73, 0.43],
      [0, 0, side * 0.1],
    );
    add(
      kneecap,
      cylinder,
      graphite,
      'premium-knee-axis',
      [0, 0.07, 0.1],
      [0.27, 0.85, 0.27],
      [0, 0, Math.PI / 2],
    );
    kneePistons.push(kneecap);
    const calf = hinge(leg, 'premium-calf-telescopic-' + side, [0, -2, 0]);
    add(
      calf,
      cube,
      armor,
      'premium-long-greave',
      [0, -1.25, -0.07],
      [1.05, 2.5, 1.05],
      [0, 0, side * -0.06],
    );
    add(calf, cube, graphite, 'premium-calf-rail', [side * 0.4, -1.1, 0.16], [0.25, 1.9, 0.5]);
    add(
      calf,
      cube,
      luminous,
      'premium-calf-laser-channel',
      [side * 0.51, -0.96, 0.19],
      [0.12, 1.4, 0.3],
    );
    const foot = hinge(calf, 'premium-articulated-foot-' + side, [0, -2.54, -0.28]);
    add(foot, cube, graphite, 'premium-foot-keel', [0, -0.05, -0.69], [1.2, 0.6, 2.0]);
    add(foot, cube, accent, 'premium-foot-toe', [0, -0.05, -1.45], [0.88, 0.26, 0.7]);
    calves.push({ calf, foot, leg, side });
  }
  // Taller angular spine, layered ribs and illuminated reactor ports.
  const spine = hinge(robot, 'premium-transform-spine', [0, 1.45, 0.68]);
  add(spine, cube, graphite, 'premium-vertebra', [0, 0.5, 0.3], [1.1, 3.35, 0.75]);
  for (let i = 0; i < 4; i++) {
    const vent = add(
      spine,
      cube,
      i % 2 ? accent : luminous,
      'premium-reactor-rib-' + i,
      [0, -0.72 + i * 0.74, -0.18],
      [1.18, 0.15, 0.38],
    );
    vents.push(vent);
  }
  const helmet = hinge(robot, 'premium-helmet-visor', [0, 3.8, -0.66]);
  add(helmet, cube, graphite, 'premium-crested-helmet', [0, 0.05, 0.18], [1.7, 0.84, 1.18]);
  add(helmet, cube, luminous, 'premium-visor-laser', [0, 0.05, -0.49], [1.36, 0.2, 0.21]);
  for (const side of [-1, 1]) {
    const fin = add(
      helmet,
      cone,
      accent,
      'premium-helmet-swept-fin-' + side,
      [side * 0.77, 0.6, 0.18],
      [0.24, 1.45, 0.56],
      [0, 0, -side * 0.27],
    );
    crest.push(fin);
  }
  // Rear-facing hard-surface details are crucial in the third-person camera.
  // Fins sit behind the wings and do not alter the existing collision proxy.
  const backVents = [];
  const boostJets = [];
  for (const side of [-1, 1]) {
    const pylon = hinge(robot, 'premium-rear-dorsal-pylon-' + side, [side * 1.35, 2.32, 1.62]);
    add(pylon, cube, graphite, 'premium-back-thruster-housing', [0, 0.13, 0.3],
      [0.88, 1.65, 1.42]);
    add(pylon, cube, armor, 'premium-back-thruster-armor', [side * 0.17, 0.36, 0.92],
      [0.78, 1.27, 0.34], [0, 0, side * 0.19]);
    for (let i = 0; i < 4; i++) {
      const vent = add(pylon, cube, i % 2 ? accent : luminous,
        'premium-back-reactor-vent-' + side + '-' + i,
        [side * 0.21, -0.37 + i * 0.34, 1.14], [0.62, 0.12, 0.12]);
      backVents.push(vent);
    }
    add(pylon, cone, graphite, 'premium-angular-rear-fin', [side * 0.57, 1.0, 0.82],
      [0.27, 1.5, 0.61], [0, 0, -side * 0.32]);
    const jetMaterial = new T.MeshBasicMaterial({
      color: '#55e7ff', transparent: true, opacity: 0.58, depthWrite: false,
      blending: T.AdditiveBlending, toneMapped: false, side: T.DoubleSide,
    });
    const jet = add(pylon, cone, jetMaterial,
      'premium-boost-streak-' + side, [0, 0.02, 2.15],
      [0.38, 1.2, 0.38], [Math.PI / 2, 0, 0]);
    const centerJet = add(pylon, cone, jetMaterial.clone(),
      'premium-boost-core-' + side, [0, 0.02, 1.88],
      [0.16, 0.82, 0.16], [Math.PI / 2, 0, 0]);
    boostJets.push({ jet, centerJet });
  }
  for (const side of [-1, 1]) {
    const thigh = robot.userData.mechRig.legs[side < 0 ? 0 : 1];
    add(thigh, cylinder, graphite, 'premium-rear-knee-actuator-' + side,
      [side * 0.25, -2.42, 0.92], [0.18, 1.13, 0.18], [0, 0, side * 0.11]);
    for (let i = 0; i < 3; i++)
      add(thigh, cube, i % 2 ? accent : armor, 'premium-shin-rear-heat-sink',
        [side * 0.28, -3.36 + i * 0.44, 0.98], [0.68, 0.23, 0.23]);
  }
  const rig = { forearms, calves, kneePistons, vents, spine, helmet, crest, backVents, boostJets };
  robot.userData.premiumMecha = rig;
  return rig;
}

/** Fine-grained fold sequence driven only by simulation time.
 * 6 mechanically distinct phases, instead of instantly swapping models.
 */
export function animatePremiumMecha(
  robot,
  { progress = 1, level = 0, time = 0, boosting = false } = {},
) {
  const rig = robot?.userData?.premiumMecha;
  if (!rig) return null;
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 1));
  const smooth = (x) => {
    const v = Math.max(0, Math.min(1, x));
    return v * v * (3 - 2 * v);
  };
  const unfold = smooth((p - 0.08) / 0.4);
  const extension = smooth((p - 0.22) / 0.5);
  const power = smooth((p - 0.55) / 0.45);
  const growth = Math.max(0, Math.min(18, Math.floor(level))) / 18;
  for (const { arm, forearm, side } of rig.forearms) {
    arm.rotation.z = side * (0.9 * (1 - unfold) + 0.1 * unfold);
    forearm.position.y = -1.15 - 0.5 * extension - growth * 0.22;
    forearm.rotation.x = (1 - extension) * -0.8;
  }
  for (const { calf, foot, leg, side } of rig.calves) {
    // Full-sized shins replace the old short toy-like silhouette.
    calf.position.y = -1.4 - 0.6 * extension - growth * 0.18;
    calf.rotation.x = (1 - extension) * 1.08;
    foot.rotation.x = -0.45 * (1 - extension) + Math.sin(time * 1.8 + side) * 0.055 * extension;
    leg.rotation.z = side * (-0.42 * (1 - unfold) + 0.065 * unfold);
  }
  for (const knee of rig.kneePistons) knee.scale.y = 0.62 + extension * 0.38;
  rig.spine.scale.y = 0.82 + extension * (0.18 + growth * 0.08);
  rig.spine.rotation.x = boosting ? -0.09 * power : 0;
  rig.helmet.rotation.x = -0.48 * (1 - power);
  for (const light of [...rig.vents, ...rig.backVents]) light.visible = power > 0.1;
  const energized = boosting ? 1 : 0.38;
  for (const { jet, centerJet } of rig.boostJets) {
    const length = (0.74 + energized * 3.4 + growth * 1.0) *
      (0.94 + Math.sin(time * (boosting ? 31 : 9)) * 0.06);
    jet.scale.y = length * power;
    centerJet.scale.y = length * 0.82 * power;
    jet.position.z = 1.65 + length * 0.55;
    centerJet.position.z = 1.5 + length * 0.47;
    jet.material.opacity = (boosting ? 0.96 : 0.31) * power;
    centerJet.material.opacity = (boosting ? 0.97 : 0.62) * power;
    jet.material.color.set(boosting ? '#a84aff' : '#49dbff');
    centerJet.material.color.set(boosting ? '#f1ffff' : '#a3ffff');
  }
  return {
    phase:
      p < 0.2
        ? 'release'
        : p < 0.4
          ? 'unfold'
          : p < 0.58
            ? 'extend'
            : p < 0.77
              ? 'lock'
              : 'energize',
    progress: p,
    stage: level,
  };
}
