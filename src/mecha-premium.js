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
  const exhausts = [];
  const afterburnerCores = [];
  const dashJets = [];
  const backFins = [];
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
  // Layered rear hull is the player's main view in chase camera. Add
  // believable mechanical density at the upper back and actuator housings
  // without increasing width or drawing opaque parts over the pilot's sights.
  for (const side of [-1, 1]) {
    add(
      robot,
      cube,
      graphite,
      'premium-rear-shoulder-backplate-' + side,
      [side * 1.68, 2.43, 1.72],
      [1.45, 1.85, 0.46],
      [0, 0, -side * 0.14],
    );
    add(
      robot,
      cube,
      armor,
      'premium-rear-wing-spine-' + side,
      [side * 2.58, 2.09, 1.86],
      [1.42, 0.38, 1.3],
      [0, 0, side * 0.16],
    );
    for (let i = 0; i < 4; i++)
      add(
        robot,
        cube,
        i % 2 ? accent : luminous,
        'premium-dorsal-heat-sink-' + side + '-' + i,
        [side * 1.92, 2.83 - i * 0.37, 2.05],
        [0.65, 0.12, 0.25],
      );
    for (let i = 0; i < 3; i++)
      add(
        robot,
        cube,
        graphite,
        'premium-spinal-reactor-cover-' + side + '-' + i,
        [side * 0.46, 2.27 - i * 0.74, 1.78],
        [0.52, 0.49, 0.36],
        [0, 0, side * 0.12],
      );
    const fins = add(
      robot,
      cube,
      armor,
      'premium-back-vector-fin-' + side,
      [side * 2.02, 0.65, 2.1],
      [0.33, 2.45, 1.18],
      [0, 0, side * 0.18],
    );
    backFins.push(fins);
    // Two independently pulsing afterburner cones, anchored to the real
    // dorsal nozzles rather than adding misleading phantom engines.
    const trail = new T.Mesh(
      new T.ConeGeometry(0.32, 1.8, 10, 1, true),
      new T.MeshBasicMaterial({
        color: '#54caff',
        transparent: true,
        opacity: 0.16,
        blending: T.AdditiveBlending,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    trail.name = 'premium-mecha-afterburner-' + side;
    // Cone points back toward the real nozzle (-Z); the broad flame grows
    // into positive Z, away from the ship and visible in chase camera.
    trail.rotation.x = -Math.PI / 2;
    trail.position.set(side * 1.38, 2.51, 3.9);
    trail.visible = false;
    robot.add(trail);
    exhausts.push(trail);

    // Concentrated white-hot core gives the rear boost visible contrast even
    // against bright planets; both layers are purely visual, not colliders.
    const core = new T.Mesh(
      new T.ConeGeometry(0.14, 1.55, 8, 1, true),
      new T.MeshBasicMaterial({
        color: '#f7fcff',
        transparent: true,
        opacity: 0.8,
        blending: T.AdditiveBlending,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    core.name = 'premium-mecha-afterburner-core-' + side;
    core.rotation.x = -Math.PI / 2;
    core.position.copy(trail.position);
    core.visible = false;
    robot.add(core);
    afterburnerCores.push(core);

    // Opposite-side vector thruster shows the direction of the quick dodge.
    // It is disabled during ordinary strafe and firing animations.
    const dashJet = new T.Mesh(
      new T.ConeGeometry(0.23, 1.7, 8, 1, true),
      new T.MeshBasicMaterial({
        color: '#b5ecff',
        transparent: true,
        opacity: 0.84,
        blending: T.AdditiveBlending,
        depthWrite: false,
        side: T.DoubleSide,
      }),
    );
    dashJet.name = 'premium-mecha-lateral-dash-jet-' + side;
    dashJet.rotation.z = (side * Math.PI) / 2;
    dashJet.position.set(side * 1.54, 0.02, 1.6);
    dashJet.visible = false;
    robot.add(dashJet);
    dashJets.push({ side, jet: dashJet });
  }
  for (let i = 0; i < 5; i++)
    add(
      spine,
      cube,
      i % 2 ? armor : luminous,
      'premium-backbone-socket-' + i,
      [0, -0.68 + i * 0.61, 0.75],
      [0.72, 0.37, 0.3],
    );
  const rig = {
    forearms,
    calves,
    kneePistons,
    vents,
    spine,
    helmet,
    crest,
    exhausts,
    afterburnerCores,
    dashJets,
    backFins,
  };
  robot.userData.premiumMecha = rig;
  return rig;
}

/** Fine-grained fold sequence driven only by simulation time.
 * 6 mechanically distinct phases, instead of instantly swapping models.
 */
export function animatePremiumMecha(
  robot,
  { progress = 1, level = 0, time = 0, boosting = false, dash = null } = {},
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
  const dashActive = !!dash?.active && power > 0.75;
  const dashSide = dash?.direction === -1 ? -1 : 1;
  const dashPhase = Math.max(0, Math.min(1, Number.isFinite(dash?.progress) ? dash.progress : 0));
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
    foot.rotation.z = dashActive ? -dashSide * 0.12 : 0;
    calf.rotation.z = dashActive ? -dashSide * 0.16 : 0;
    leg.rotation.z = side * (-0.42 * (1 - unfold) + 0.065 * unfold);
  }
  for (const knee of rig.kneePistons) knee.scale.y = 0.62 + extension * 0.38;
  rig.spine.scale.y = 0.82 + extension * (0.18 + growth * 0.08);
  rig.spine.rotation.x = boosting ? -0.09 * power : 0;
  rig.spine.rotation.z = dashActive ? -dashSide * 0.12 : 0;
  for (const [index, plume] of rig.exhausts.entries()) {
    plume.visible = boosting && power > 0.75;
    // The afterburner is >3x its former short bloom. Keep the flame tip
    // anchored at z=2.75 as the cone stretches into +Z (toward chase camera).
    const length = 3.9 + Math.sin(time * 27 + index * 1.3) * 0.25 + growth * 1.35;
    plume.scale.y = length;
    plume.position.z = 2.75 + length * 0.9;
    plume.material.opacity = boosting ? 0.63 + growth * 0.14 : 0;
    plume.material.color.set(growth > 0.65 ? '#b9a5ff' : '#4fd9ff');
    const core = rig.afterburnerCores[index];
    core.visible = plume.visible;
    core.scale.y = length * 1.28;
    core.position.set(plume.position.x, plume.position.y, 2.75 + core.scale.y * 0.775);
    core.material.opacity = boosting ? 0.86 + 0.11 * Math.sin(time * 24 + index) ** 2 : 0;
  }
  for (const { side, jet } of rig.dashJets) {
    const firing = dashActive && side === -dashSide;
    jet.visible = firing;
    jet.scale.y = firing ? 1.5 + Math.sin(Math.PI * dashPhase) * 0.65 : 1;
    jet.material.opacity = firing ? 0.72 + 0.15 * Math.sin(Math.PI * dashPhase) : 0;
  }
  for (const [index, fin] of rig.backFins.entries()) {
    fin.rotation.z = (index === 0 ? -1 : 1) * (boosting ? 0.28 : 0.1);
  }
  rig.helmet.rotation.x = -0.48 * (1 - power);
  for (const light of rig.vents) light.visible = power > 0.1;
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
