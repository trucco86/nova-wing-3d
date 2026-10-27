import * as T from 'three';
import { launchOrbitReady } from './flight.js';
export const metal = (c, m = 0.65, r = 0.36) =>
  new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r });
export const glowMaterial = (c, k = 2.8) =>
  new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k) });
export function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  return o;
}
const steel = metal('#9eb5ca', 0.72),
  white = metal('#c4d5e3', 0.62),
  navy = metal('#15243e', 0.68),
  black = metal('#081725', 0.5),
  red = metal('#822d49', 0.65),
  copper = metal('#be9972', 0.8);
const mint = glowMaterial('#32ffc8'),
  cyan = glowMaterial('#59ddff'),
  pink = glowMaterial('#ff426e');
const glowData = new Uint8Array(64 * 64 * 4);
for (let y = 0; y < 64; y++)
  for (let x = 0; x < 64; x++) {
    let d = Math.hypot(x - 31.5, y - 31.5) / 32,
      i = (y * 64 + x) * 4;
    glowData[i] = glowData[i + 1] = glowData[i + 2] = 255;
    glowData[i + 3] = Math.round(Math.max(0, Math.exp(-d * d * 7) - 0.001) * 255);
  }
const glowMap = new T.DataTexture(glowData, 64, 64);
glowMap.needsUpdate = true;
const glowMats = new Map();
export function halo(color, size = 2, opacity = 0.7) {
  const key = color + ':' + opacity;
  let m = glowMats.get(key);
  if (!m) {
    m = new T.SpriteMaterial({
      map: glowMap,
      color,
      transparent: true,
      opacity,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    glowMats.set(key, m);
  }
  const s = new T.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}
function wing(points, m) {
  let shape = new T.Shape();
  points.forEach(([x, z], i) => (i ? shape.lineTo(x, z) : shape.moveTo(x, z)));
  shape.closePath();
  const g = new T.ExtrudeGeometry(shape, {
    depth: 0.17,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.07,
    bevelSegments: 1,
    steps: 1,
  });
  g.rotateX(Math.PI / 2);
  return new T.Mesh(g, m);
}
// Single canonical wing profile shared by all fighter models and the Mecha 2.0.
const SHARED_FIGHTER_WING = [
  [1.3, -1.15],
  [4.65, 0.8],
  [4.12, 1.65],
  [1.73, 0.82],
];
function sharedFighterWing(side, material) {
  const mesh = wing(
    SHARED_FIGHTER_WING.map(([x, z]) => [side * x, z]),
    material,
  );
  mesh.userData.sharedWingProfile = 'fighter-v1';
  return mesh;
}
function line(points, color = '#4bf6d8') {
  return new T.Line(
    new T.BufferGeometry().setFromPoints(points.map((p) => new T.Vector3(...p))),
    new T.LineBasicMaterial({ color: new T.Color(color).multiplyScalar(2) }),
  );
}
const templates = {};
export function fighter(enemy = false, variant = -1) {
  if (!templates[enemy]) {
    const g = new T.Group(),
      armor = enemy ? red : white,
      accent = enemy ? black : navy,
      light = enemy ? pink : cyan;
    // A single continuous fuselage avoids the intersecting, skewed four-sided
    // nose cone. Keep the forward tip on the -Z flight axis in game and showroom.
    const profile = [
      [0.78, -2.8],
      [0.69, -1.9],
      [0.54, -0.6],
      [0.38, 0.9],
      [0.22, 2.3],
      [0.16, 2.8],
      [0.08, 3.25],
      [0.025, 3.62],
      [0, 3.75],
    ].map(([radius, forward]) => new T.Vector2(radius, forward));
    const hull = new T.Mesh(new T.LatheGeometry(profile, 16), armor);
    hull.name = 'ship-fuselage';
    hull.rotation.x = -Math.PI / 2;
    hull.position.z = -0.9;
    g.add(hull);
    g.add(box(0.72, 0.45, 2.2, accent, 0, 0.38, 0.7));
    const cockpit = new T.Mesh(
      new T.SphereGeometry(0.68, 24, 16),
      new T.MeshPhysicalMaterial({
        color: enemy ? '#ff637c' : '#37b2cc',
        metalness: 0.48,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        emissive: enemy ? '#430919' : '#062c3e',
        emissiveIntensity: 0.7,
      }),
    );
    cockpit.scale.set(0.68, 0.7, 1.5);
    cockpit.position.set(0, 0.57, -1.2);
    g.add(cockpit);
    g.add(
      line(
        [
          [0, 0.92, -1.8],
          [0, 1.03, -0.75],
          [0, 0.8, -0.2],
        ],
        enemy ? '#fa7992' : '#69d4ec',
      ),
    );
    for (let s of [-1, 1]) {
      const outer = enemy ? 3.5 : 4.3;
      const w = wing(
        [
          [s * 0.5, -1.5],
          [s * outer, 1.25],
          [s * (outer - 0.3), 2.1],
          [s * 1.15, 1.7],
        ],
        armor,
      );
      g.add(w);
      const panel = wing(
        [
          [s * 1.2, -0.4],
          [s * 3.65, 1.3],
          [s * 2.8, 1.5],
          [s * 1.25, 0.7],
        ],
        accent,
      );
      panel.position.y = 0.11;
      g.add(panel);
      g.add(
        line(
          [
            [s * 1.18, 0.2, -0.45],
            [s * 3.65, 0.2, 1.3],
            [s * 3.15, 0.2, 1.55],
          ],
          enemy ? '#ff6485' : '#4affd5',
        ),
      );
      for (let j = 0; j < 3; j++)
        g.add(box(0.3, 0.035, 0.55, black, s * (1.9 + j * 0.34), 0.2, 0.7 + j * 0.16));
      const fin = wing(
        [
          [0, -1.1],
          [0, 1.4],
          [1.65, 1.1],
          [0.7, -0.55],
        ],
        accent,
      );
      fin.rotation.z = s * 1.02;
      fin.position.set(s * 1.5, 0.15, 0.15);
      g.add(fin);
      const engine = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 2.5, 12), accent);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(s * 1.04, -0.13, 1.2);
      g.add(engine);
      for (let z of [0.4, 1.7, 2.3]) {
        const band = new T.Mesh(new T.TorusGeometry(0.45, 0.06, 6, 16), steel);
        band.position.set(s * 1.04, -0.13, z);
        g.add(band);
      }
      const nozzle = new T.Mesh(new T.CircleGeometry(0.34, 20), light);
      nozzle.position.set(s * 1.04, -0.13, 2.48);
      g.add(nozzle);
      const f = new T.Mesh(
        new T.ConeGeometry(0.31, 3.4, 16, 1, true),
        new T.MeshBasicMaterial({
          color: enemy ? '#ff3868' : '#78eaff',
          transparent: true,
          opacity: 0.72,
          blending: T.AdditiveBlending,
          depthWrite: false,
          side: T.DoubleSide,
        }),
      );
      f.rotation.x = Math.PI / 2;
      f.position.set(s * 1.04, -0.13, 4);
      f.name = 'flame';
      g.add(f);
      const inner = new T.Mesh(new T.ConeGeometry(0.15, 1.9, 12), glowMaterial('#e8ffff', 3));
      inner.rotation.x = Math.PI / 2;
      inner.position.set(s * 1.04, -0.13, 3.25);
      g.add(inner);
      const aura = halo(enemy ? '#ff3468' : '#39bfff', 3.6, 0.75);
      aura.position.set(s * 1.04, -0.13, 2.9);
      g.add(aura);
      g.add(box(0.2, 0.21, 2.5, black, s * 3.1, -0.06, 0.1));
      g.add(box(0.14, 0.13, 0.5, light, s * 3.1, -0.06, -1.3));
      g.add(box(0.15, 0.18, 0.7, copper, s * outer, 0, 1.5));
      const beacon = halo(enemy ? '#ff3765' : '#3cffba', 0.75);
      beacon.position.set(s * outer, 0.08, 1.55);
      g.add(beacon);
    }
    g.add(box(0.2, 0.02, 1.5, enemy ? pink : mint, 0, 0.63, 0.6));
    templates[enemy] = g;
  }
  const o = templates[enemy].clone(true);
  o.userData.flames = [];
  o.userData.paint = [];
  const paints = new Map();
  o.traverse((c) => {
    if (!enemy && (c.material === white || c.material === navy)) {
      const original = c.material;
      if (!paints.has(original)) {
        const paint = original.clone();
        paint.userData.paintAccent = original === navy;
        paints.set(original, paint);
        o.userData.paint.push(paint);
      }
      c.material = paints.get(original);
    }
    if (c.name === 'flame') {
      if (!enemy) c.material = c.material.clone();
      o.userData.flames.push(c);
    }
  });
  if (enemy && variant >= 0) o.add(enemyDetails(variant));
  return o;
}

/** Lightweight flying mech built from reusable primitives; forward fire axis remains -Z. */
export function mechArmPitch(motion, armIndex, boostMotion, fireKick) {
  return T.MathUtils.clamp(
    0.63 + Math.sin(motion + armIndex * Math.PI) * 0.09 * boostMotion + fireKick * 0.75,
    0.35,
    1.45,
  );
}

/** Flight-mech shares the ship's forward axis, paint palette and upgrade identity. */
export function createFlyingRobot() {
  const robot = new T.Group();
  robot.name = 'five-cats-flight-mech';
  const armor = metal('#a9c8d7', 0.78, 0.25);
  armor.userData.mechPaint = 'primary';
  const graphite = metal('#172944', 0.8, 0.3);
  const accent = metal('#ffb36b', 0.75, 0.25);
  accent.userData.mechPaint = 'accent';
  const luminous = glowMaterial('#62eaff', 2.4);
  const plating = (radius, x, y, z, sx, sy, sz, material = armor) => {
    const width = radius * 1.6;
    const height = radius * 1.7;
    const depth = radius * 1.55;
    const bevel = Math.min(width, height) * 0.18;
    // Chamfered, extruded armor panels preserve the lightweight rig while
    // replacing the rectangular toy-like torso and limbs with facets.
    const outline = new T.Shape();
    outline.moveTo(-width / 2 + bevel, -height / 2);
    outline.lineTo(width / 2 - bevel, -height / 2);
    outline.lineTo(width / 2, -height / 2 + bevel);
    outline.lineTo(width / 2, height / 2 - bevel);
    outline.lineTo(width / 2 - bevel, height / 2);
    outline.lineTo(-width / 2 + bevel, height / 2);
    outline.lineTo(-width / 2, height / 2 - bevel);
    outline.lineTo(-width / 2, -height / 2 + bevel);
    outline.closePath();
    const geometry = new T.ExtrudeGeometry(outline, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.055,
      bevelThickness: 0.055,
      bevelSegments: 1,
      steps: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    const part = new T.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    robot.add(part);
    return part;
  };
  // Sharper, layered hard-surface panels: no soft spherical hero silhouette.
  const spine = box(0.3, 2.9, 0.2, graphite, 0, 1.72, 0.92);
  spine.name = 'mech-mechanical-spine';
  robot.add(spine);
  for (const side of [-1, 1]) {
    const chestCut = box(0.15, 1.2, 0.16, luminous, side * 0.83, 1.36, -0.92);
    chestCut.rotation.z = side * 0.35;
    robot.add(chestCut);
    const collar = box(0.54, 0.22, 0.72, armor, side * 0.93, 2.63, -0.24);
    collar.rotation.z = side * 0.28;
    robot.add(collar);
  }
  // Angular fighter-style chest, layered breastplate and recessed reactor.
  const backArmor = plating(1.4, 0, 1.48, 1.08, 1.02, 1.08, 0.38, graphite);
  backArmor.name = 'mech-rear-armor-facets';
  const cranialCrest = new T.Mesh(new T.ConeGeometry(0.34, 1.25, 4), accent);
  cranialCrest.name = 'mech-cranial-crest';
  cranialCrest.position.set(0, 4.16, -0.13);
  cranialCrest.rotation.y = Math.PI / 4;
  robot.add(cranialCrest);
  robot.add(box(0.94, 0.17, 0.12, luminous, 0, 3.56, -1.02));
  for (const side of [-1, 1]) {
    const rearRidge = box(0.16, 1.73, 0.19, luminous, side * 0.92, 1.65, 1.65);
    rearRidge.rotation.z = side * 0.18;
    robot.add(rearRidge);
    const sidePlating = plating(0.76, side * 1.19, 1.57, 1.02, 0.42, 1.0, 0.51);
    sidePlating.rotation.z = side * 0.2;
  }
  plating(1.5, 0, 1.4, 0, 1.08, 1.18, 0.62);
  plating(1.05, 0, 1.45, -0.7, 1.14, 0.72, 0.3, graphite);
  plating(0.64, 0, 1.75, -1.02, 0.95, 0.48, 0.28, luminous);
  plating(0.95, 0, 3.45, -0.1, 0.9, 0.85, 0.8, graphite);
  plating(0.6, 0, 3.5, -0.66, 0.98, 0.3, 0.34, luminous);
  plating(0.85, 0, 0, 0.18, 0.78, 0.72, 0.58, graphite);
  const arms = [];
  const legs = [];
  const armMuzzles = [];
  const sidePlumes = [];
  for (const side of [-1, 1]) {
    const arm = new T.Group();
    arm.position.set(side * 1.65, 2.55, 0);
    robot.add(arm);
    arms.push(arm);
    const leg = new T.Group();
    leg.position.set(side * 0.73, -0.9, 0);
    robot.add(leg);
    legs.push(leg);
    // Swept shoulder wings and layered gauntlet armor, not rectangular limbs.
    const shoulder = plating(0.95, side * 1.65, 2.55, 0.05, 1.12, 0.72, 1.05);
    shoulder.rotation.z = side * 0.28;
    const fin = plating(0.9, side * 2.45, 3.08, 0.62, 1.1, 0.22, 1.35, accent);
    fin.rotation.z = side * 0.36;
    const shoulderBlade = new T.Mesh(new T.ConeGeometry(0.48, 1.6, 4), armor);
    shoulderBlade.rotation.z = -side * 0.34;
    shoulderBlade.rotation.y = Math.PI / 4;
    shoulderBlade.position.set(side * 2.55, 3.85, 0.84);
    robot.add(shoulderBlade);
    const upperArm = plating(0.85, side * 1.88, 0.95, -0.05, 0.57, 1.8, 0.62);
    arm.attach(upperArm);
    const gauntlet = plating(0.8, side * 1.9, -0.48, -0.7, 0.72, 0.65, 1.05, graphite);
    arm.attach(gauntlet);
    const cannonFin = box(0.32, 0.95, 0.65, armor, side * 2.14, -0.37, -0.84);
    cannonFin.rotation.z = side * 0.24;
    arm.attach(cannonFin);
    const forearmRail = box(0.16, 1.08, 0.14, accent, side * 1.9, -0.23, -1.23);
    arm.attach(forearmRail);
    const muzzle = plating(0.55, side * 1.9, -0.55, -1.45, 0.48, 0.45, 0.65, luminous);
    arm.attach(muzzle);
    armMuzzles.push(muzzle);
    const thigh = plating(0.9, side * 0.73, -1.75, 0.15, 0.6, 1.8, 0.72);
    leg.attach(thigh);
    const shin = plating(0.7, side * 0.75, -3.5, -0.65, 0.72, 0.58, 1.25, graphite);
    leg.attach(shin);
    const shinLight = box(0.16, 1.35, 0.17, luminous, side * 0.75, -3.25, 0.54);
    leg.attach(shinLight);
    const calfFin = plating(0.69, side * 1.13, -3.34, 0.4, 0.36, 1.1, 0.46, armor);
    calfFin.rotation.z = side * 0.25;
    leg.attach(calfFin);
    const knee = plating(0.48, side * 0.75, -2.1, -0.82, 0.48, 0.55, 0.35, accent);
    leg.attach(knee);
    const nozzle = new T.Mesh(new T.CylinderGeometry(0.32, 0.43, 1.15, 12), graphite);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 1.4, 2.23, 1.85);
    robot.add(nozzle);
    const plume = new T.Mesh(
      new T.ConeGeometry(0.28, 1.4, 12),
      new T.MeshBasicMaterial({ color: '#53dfff', transparent: true, opacity: 0.75 }),
    );
    plume.rotation.x = Math.PI / 2;
    plume.position.set(side * 1.4, 2.23, 2.9);
    robot.add(plume);
    sidePlumes.push(plume);
  }
  // The exact same mesh profile as the ship, rotated into the mecha back plane.
  // No independent enlarged mecha wing geometry: transformation preserves identity.
  for (const side of [-1, 1]) {
    const panel = sharedFighterWing(side, armor);
    panel.name = side < 0 ? 'mech-wing-left' : 'mech-wing-right';
    panel.rotation.x = -Math.PI / 2;
    panel.position.set(0, 2.2, 1.36);
    robot.add(panel);
    const trim = line(
      [
        [side * 1.65, 1.5, 1.65],
        [side * 3.2, 2.45, 1.65],
        [side * 4.1, 2.87, 1.65],
      ],
      '#66ebff',
    );
    robot.add(trim);
  }
  // Main turbine sits between the shoulder blades rather than low at the hips.
  const turbineHousing = new T.Mesh(new T.CylinderGeometry(0.58, 0.72, 1.15, 20), graphite);
  turbineHousing.rotation.x = Math.PI / 2;
  turbineHousing.name = 'mech-back-turbine';
  turbineHousing.position.set(0, 3.05, 1.9);
  robot.add(turbineHousing);
  // The shoulder-mounted housing remains fixed; the nozzle assembly gimbals
  // independently to react to flight direction and propulsion load.
  const turbineGimbal = new T.Group();
  turbineGimbal.name = 'mech-turbine-gimbal';
  turbineGimbal.position.set(0, 3.05, 2.05);
  robot.add(turbineGimbal);
  for (const side of [-1, 1]) {
    robot.add(box(0.17, 0.22, 1.15, accent, side * 0.52, 3.05, 1.83));
  }
  const turbineRing = new T.Mesh(new T.TorusGeometry(0.58, 0.12, 10, 24), accent);
  turbineRing.position.set(0, 0, 0.5);
  turbineGimbal.add(turbineRing);
  const turbineHalo = halo('#56eaff', 2.1, 0.73);
  turbineHalo.name = 'mech-turbine-halo';
  turbineHalo.position.set(0, 0, 0.99);
  turbineGimbal.add(turbineHalo);
  const turbineCore = new T.Mesh(new T.CylinderGeometry(0.35, 0.4, 0.18, 20), luminous);
  turbineCore.rotation.x = Math.PI / 2;
  turbineCore.position.set(0, 0, 0.57);
  turbineGimbal.add(turbineCore);
  const turbineFlame = new T.Mesh(
    new T.ConeGeometry(0.43, 1.75, 20),
    new T.MeshBasicMaterial({ color: '#53dfff', transparent: true, opacity: 0.8 }),
  );
  turbineFlame.rotation.x = Math.PI / 2;
  turbineFlame.position.set(0, 0, 1.6);
  turbineGimbal.add(turbineFlame);
  // Exposed mechanical fan blades make the turbine visibly rotate during flight.
  const turbineRotor = new T.Group();
  turbineRotor.name = 'mech-turbine-rotor';
  turbineRotor.position.set(0, 0, 0.71);
  for (let bladeIndex = 0; bladeIndex < 5; bladeIndex++) {
    const bladePivot = new T.Group();
    bladePivot.rotation.z = (bladeIndex * Math.PI * 2) / 5;
    const blade = box(0.14, 0.44, 0.12, bladeIndex % 2 ? accent : luminous, 0, 0.23, 0);
    blade.rotation.z = -0.42;
    bladePivot.add(blade);
    turbineRotor.add(bladePivot);
  }
  turbineGimbal.add(turbineRotor);
  const progressionNeons = [];
  for (let tier = 0; tier < 3; tier++) {
    for (const side of [-1, 1]) {
      const strip = box(
        0.14 + tier * 0.07,
        0.18 + tier * 0.06,
        0.72 + tier * 0.38,
        luminous,
        side * (1.62 + tier * 0.42),
        2.45 - tier * 1.7,
        -1.03 - tier * 0.08,
      );
      strip.name = `mech-evolution-neon-${tier}-${side}`;
      strip.visible = tier === 0;
      robot.add(strip);
      progressionNeons.push({ mesh: strip, threshold: tier * 3 });
    }
  }
  robot.userData.mechRig = {
    arms,
    legs,
    armMuzzles,
    turbineRotor,
    turbineGimbal,
    turbineFlame,
    sidePlumes,
    propulsionPower: 0,
    progressionNeons,
  };
  robot.userData.mechPaint = { primary: armor, accent };
  robot.scale.setScalar(0.94);
  return robot;
}

export function createShipModule(model = 'nova7') {
  const g = new T.Group();
  g.name = 'ship-model-' + model;
  const shell = metal('#a9c8d7', 0.78, 0.25);
  shell.userData.paintModule = true;
  if (model === 'specter') {
    for (const side of [-1, 1]) {
      const blade = wing(
        [
          [side * 1.1, -1.1],
          [side * 5.9, 0.5],
          [side * 4.4, 1.25],
          [side * 1.8, 0.8],
        ],
        shell,
      );
      blade.position.y = -0.12;
      g.add(blade, box(0.18, 0.18, 3.8, cyan, side * 4.2, -0.05, 0.2));
    }
    g.add(box(0.5, 0.18, 5.4, shell, 0, -0.2, 0.25));
  } else if (model === 'aegis') {
    for (const side of [-1, 1]) {
      g.add(box(1.15, 0.72, 4.8, shell, side * 2.55, 0.05, 0.7));
      const guard = new T.Mesh(new T.IcosahedronGeometry(0.82, 0), shell);
      guard.scale.set(1.5, 0.65, 2.1);
      guard.position.set(side * 3.25, 0.05, -0.1);
      g.add(guard);
    }
    g.add(box(2.2, 0.48, 3.7, shell, 0, -0.18, 1.15));
  } else {
    for (const side of [-1, 1]) g.add(box(0.22, 0.25, 2.8, mint, side * 3.45, 0.04, -0.15));
  }
  // Shared angular starfighter design language: recognizable aero-mecha geometry
  // while preserving each pilot's independent chassis and selected paint.
  for (const side of [-1, 1]) {
    const strake = sharedFighterWing(side, shell);
    strake.position.y = 0.21;
    g.add(strake);
    const vent = box(0.32, 0.15, 1.28, navy, side * 1.85, 0.35, 0.26);
    vent.rotation.y = side * 0.21;
    g.add(vent);
    const trim = line(
      [
        [side * 1.65, 0.35, -0.7],
        [side * 3.2, 0.35, 0.25],
        [side * 4.1, 0.35, 0.67],
      ],
      '#66ebff',
    );
    g.add(trim);
  }
  const keel = box(0.34, 0.18, 3.6, navy, 0, 0.27, 0.18);
  keel.name = 'ship-mechanical-keel';
  g.add(keel);
  const progressionNeons = [];
  for (let tier = 0; tier < 3; tier++) {
    for (const side of [-1, 1]) {
      const strip = box(
        0.15 + tier * 0.05,
        0.12,
        0.8 + tier * 0.42,
        cyan,
        side * (1.95 + tier * 0.65),
        0.42,
        0.32 + tier * 0.13,
      );
      strip.name = `ship-evolution-neon-${tier}-${side}`;
      strip.visible = tier === 0;
      g.add(strip);
      progressionNeons.push({ mesh: strip, threshold: tier * 3 });
    }
  }
  g.userData.progressionNeons = progressionNeons;
  return g;
}

/** Activate larger luminous upgrade details as the player's ship gains levels. */
export function setFighterEvolution(ship, level = 0) {
  for (const { mesh, threshold } of ship.userData.progressionNeons ?? []) {
    mesh.visible = level >= threshold;
  }
}

/** Flight animation is frame-driven, so it works at variable FPS without timers. */
export function resetMechPower(robot) {
  const rig = robot.userData.mechRig;
  if (!rig) return;
  rig.propulsionPower = 0;
  rig.turbineRotor.rotation.z = 0;
  rig.turbineGimbal.rotation.set(0, 0, 0);
  rig.turbineFlame.scale.y = 1;
  rig.turbineFlame.position.z = 1.6;
  rig.turbineFlame.material.opacity = 0.78;
  for (const plume of rig.sidePlumes) {
    plume.scale.y = 1;
    plume.position.z = 2.9;
  }
}

export function animateMechPower(
  robot,
  elapsed,
  boosting = false,
  level = 0,
  steering = {},
  dt = 1 / 60,
) {
  const rig = robot.userData.mechRig;
  if (!rig?.turbineRotor) return;
  for (const { mesh, threshold } of rig.progressionNeons) {
    mesh.visible = level >= threshold;
  }
  if (!Number.isFinite(dt) || dt <= 0) return;
  const delta = Math.min(dt, 0.05);
  const target = boosting ? 1 : 0;
  const previous = rig.propulsionPower;
  const response = 1 - Math.exp(-10 * delta);
  rig.propulsionPower += (target - previous) * response;
  // Integrate angular velocity, including the exact exponential acceleration.
  // Multiplying mission time by the current speed makes BOOST jump rotor phase.
  const poweredTime = target * delta + ((previous - target) * response) / 10;
  rig.turbineRotor.rotation.z =
    (rig.turbineRotor.rotation.z + 10 * delta + 14 * poweredTime) % (Math.PI * 2);
  const turn = T.MathUtils.clamp(steering.x ?? 0, -1, 1);
  const climb = T.MathUtils.clamp(steering.y ?? 0, -1, 1);
  const steeringResponse = 1 - Math.exp(-12 * delta);
  rig.turbineGimbal.rotation.y += (turn * 0.19 - rig.turbineGimbal.rotation.y) * steeringResponse;
  rig.turbineGimbal.rotation.x +=
    (-climb * 0.11 - (boosting ? 0.1 : 0.015) - rig.turbineGimbal.rotation.x) * steeringResponse;

  const pulse = 0.94 + Math.sin(elapsed * 16) * 0.06;
  rig.turbineFlame.scale.y = (1 + rig.propulsionPower * 0.75) * pulse;
  rig.turbineFlame.position.z = 0.725 + (1.75 * rig.turbineFlame.scale.y) / 2;
  rig.turbineFlame.material.opacity = 0.78 + rig.propulsionPower * 0.18;
  for (const plume of rig.sidePlumes) {
    plume.scale.y = (1 + rig.propulsionPower * 0.6) * pulse;
    plume.position.z = 2.2 + (1.4 * plume.scale.y) / 2;
  }
}
const variants = new Map();
function enemyDetails(variant) {
  if (!variants.has(variant)) {
    const g = new T.Group();
    for (const side of [-1, 1]) {
      if (variant === 0) {
        const blade = wing(
          [
            [side * 2, 0],
            [side * 5, -3],
            [side * 4, 2],
            [side * 2.5, 2.5],
          ],
          red,
        );
        g.add(blade, box(0.25, 0.4, 3, pink, side * 3.8, 0, -1.8));
        g.add(box(0.28, 0.22, 3.8, glowMaterial('#ff547b', 2), side * 4.2, 0.3, -1.2));
        g.add(box(0.65, 0.55, 2.6, black, side * 2.3, 0.55, -1.6));
      } else if (variant === 1) {
        g.add(box(1.2, 0.8, 4, navy, side * 2, 0, 0));
        for (let j = 0; j < 3; j++)
          g.add(box(0.4, 0.4, 2, copper, side * (1.5 + j * 0.5), -0.6, -0.5));
        const dome = new T.Mesh(new T.SphereGeometry(0.7, 12, 8), pink);
        dome.position.set(side * 2, 0.4, 0.5);
        g.add(dome);
        g.add(box(0.4, 0.3, 4.8, glowMaterial('#ffb36b', 2.1), side * 2.7, 0.52, 0));
        g.add(box(1.4, 0.35, 1.6, black, side * 2.4, 0.85, -0.9));
      } else {
        const ring = new T.Mesh(new T.TorusGeometry(1.2, 0.25, 8, 16), steel);
        ring.position.set(side * 3.2, 0, 1);
        g.add(ring);
        g.add(box(0.3, 0.3, 5, pink, side * 3.2, 0, -1.5));
        g.add(box(0.45, 0.45, 3.5, glowMaterial('#a76bff', 2.3), side * 2.3, 0.5, -1.6));
        g.add(box(0.9, 0.4, 1.5, steel, side * 4, 0.5, 1));
      }
    }
    if (variant === 2) g.add(box(1.2, 0.24, 5.8, glowMaterial('#a76bff', 2.2), 0, 0.9, -0.8));
    variants.set(variant, g);
  }
  return variants.get(variant).clone(true);
}
const noise = `float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+5.;a*=.5;}return s;}`;
export function createWorld(scene, random = Math.random, dynamicFlight = false) {
  const existing = new Set(scene.children);
  const rnd = (a, b) => a + random() * (b - a);
  scene.background = new T.Color('#142a46');
  scene.fog = new T.FogExp2('#071c23', 0.0014);
  scene.add(new T.HemisphereLight('#9fcdec', '#09293a', 1.6));
  const key = new T.DirectionalLight('#b8dcff', 3.2);
  key.position.set(-80, 140, 80);
  scene.add(key);
  const rim = new T.DirectionalLight('#38ffd0', 3);
  rim.position.set(60, 30, -110);
  scene.add(rim);
  const purple = new T.DirectionalLight('#7f78ff', 1.1);
  purple.position.set(-80, 10, 60);
  scene.add(purple);
  const skyMat = new T.ShaderMaterial({
    uniforms: {
      tint: { value: new T.Color('#ffffff') },
      launchHaze: { value: 0 },
      ambient: { value: new T.Color('#223b65') },
    },
    depthWrite: false,
    side: T.BackSide,
    vertexShader:
      'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform vec3 tint;uniform vec3 ambient;uniform float launchHaze;varying vec3 p;${noise}void main(){vec3 n=normalize(p);float cloud=fbm(n*6.);float band=exp(-pow((n.y-.2+n.x*.15)*3.,2.));vec3 c=vec3(.002,.004,.013);c+=vec3(.008,.07,.07)*pow(cloud,2.)*band;c+=vec3(.035,.015,.085)*pow(fbm(n*8.+10.),3.);c+=vec3(.008,.018,.022)*exp(-abs(n.y)*8.);float bandHaze=exp(-pow((n.y+.08)*5.,2.));vec3 haze=vec3(.04,.15,.25)*bandHaze+vec3(.012,.045,.07)*pow(fbm(n*16.+7.),2.);gl_FragColor=vec4(c*tint*1.25+ambient*(.12+.18*band+.12*cloud)+launchHaze*haze,1.);}`,
  });
  const skyDome = new T.Mesh(new T.SphereGeometry(1900, 32, 20), skyMat);
  skyDome.name = 'launch-sky-dome';
  scene.add(skyDome);
  // An Earth-like horizon appears as the first sector leaves the city.
  // This is a background-only visual; collision coordinates do not change.
  const earthMat = new T.ShaderMaterial({
    uniforms: { fade: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader:
      'varying vec3 planetNormal;void main(){planetNormal=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform float fade;varying vec3 planetNormal;${noise}void main(){vec3 n=normalize(planetNormal);float land=fbm(n*9.);vec3 ocean=vec3(.018,.17,.29);vec3 continent=mix(vec3(.06,.20,.14),vec3(.30,.39,.19),fbm(n*25.));vec3 c=mix(ocean,continent,smoothstep(.46,.61,land));float lit=.4+.6*max(0.,dot(n,normalize(vec3(-.5,.8,1.))));float rim=pow(1.-abs(n.z),3.);gl_FragColor=vec4(c*lit+vec3(.03,.16,.27)*rim,fade);}`,
  });
  const earthHorizon = new T.Mesh(new T.SphereGeometry(680, 48, 28), earthMat);
  earthHorizon.name = 'launch-earth-horizon';
  earthHorizon.position.set(0, -760, -1450);
  earthHorizon.visible = false;
  earthHorizon.userData.fixedSky = true;
  scene.add(earthHorizon);
  const launchSkyTint = new T.Color();
  const launchSpaceTint = new T.Color('#192a55');
  const starPos = [],
    starCol = [];
  for (let i = 0; i < 2000; i++) {
    let v = new T.Vector3(rnd(-1, 1), rnd(0.04, 1), rnd(-1, 0.15))
      .normalize()
      .multiplyScalar(rnd(1000, 1600));
    starPos.push(v.x, v.y, v.z);
    let c = new T.Color().setHSL(rnd(0.5, 0.7), 0.25, rnd(0.35, 0.85));
    starCol.push(c.r, c.g, c.b);
  }
  const starsG = new T.BufferGeometry();
  starsG.setAttribute('position', new T.Float32BufferAttribute(starPos, 3));
  starsG.setAttribute('color', new T.Float32BufferAttribute(starCol, 3));
  const starfield = new T.Points(
    starsG,
    new T.PointsMaterial({
      size: 1.6,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      fog: false,
    }),
  );
  scene.add(starfield);
  const moonMat = new T.ShaderMaterial({
    vertexShader:
      'varying vec3 p;varying vec3 n;void main(){p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 p;varying vec3 n;${noise}void main(){vec3 N=normalize(n);float continent=fbm(N*9.);float details=fbm(N*42.);vec3 c=mix(vec3(.10,.16,.20),vec3(.43,.52,.56),smoothstep(.32,.72,continent));c*=.7+details*.5;float lit=max(0.,dot(N,normalize(vec3(-.7,.45,.8))));float crack=1.-smoothstep(.007,.016,abs(N.x+.14*sin(N.y*13.)+.035*sin(N.y*55.)));c=c*(.05+lit*.95)+vec3(.95,.27,.035)*crack*.7;gl_FragColor=vec4(c,1.);}`,
  });
  let moon = new T.Mesh(new T.SphereGeometry(190, 64, 40), moonMat);
  moon.name = 'world-orbital-globe';
  moon.position.set(480, 280, -1000);
  scene.add(moon);
  const atmosphere = new T.Mesh(
    new T.SphereGeometry(194, 48, 32),
    new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader:
        'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:
        'varying vec3 n;varying vec3 v;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(v))),4.);gl_FragColor=vec4(.12,.55,.8,a*.6);}',
    }),
  );
  atmosphere.position.copy(moon.position);
  scene.add(atmosphere);
  const terrainMat = new T.ShaderMaterial({
    uniforms: { time: { value: 0 }, travel: { value: 0 }, water: { value: 0 } },
    vertexShader:
      'varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
    fragmentShader: `varying vec3 w;uniform float time;uniform float travel;uniform float water;${noise}void main(){vec2 p=w.xz;p.y-=travel;float dist=length(w-cameraPosition);float wet=water*(1.-smoothstep(34.,39.,abs(p.x)));float rip=sin(p.y*.6+sin(p.x*.15+time))*sin(p.x*.27-time*.8);vec3 c=vec3(.009,.019,.027);float gx=1.-smoothstep(.04,.12,abs(mod(p.x+8.,16.)-8.));float gz=1.-smoothstep(.04,.16,abs(mod(p.y+8.,16.)-8.));c+=vec3(.005,.14,.09)*max(gx,gz)*(1.-wet);float refl=pow(max(0.,sin(p.x*.06+sin(p.y*.08)*.6)),14.)*(.25+noise(vec3(p*.5,time))*.75);c=mix(c,vec3(.004,.023,.031)+vec3(.01,.13,.12)*refl+vec3(.008,.045,.06)*rip,wet);float road=(1.-wet)*(1.-smoothstep(.12,.3,abs(abs(p.x)-18.)))*step(4.,mod(p.y,16.));c+=vec3(.05,.18,.17)*road;float edge=exp(-abs(abs(p.x)-36.)*.8);c+=vec3(.08,1.,.63)*edge;float fog=1.-exp(-dist*.002);gl_FragColor=vec4(mix(c,vec3(.013,.046,.054),fog),1.);}`,
  });
  const ground = new T.Mesh(
    new T.PlaneGeometry(4000, 4000, dynamicFlight ? 32 : 1, dynamicFlight ? 96 : 1),
    terrainMat,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -7, -1000);
  ground.name = 'launch-ground';
  scene.add(ground);
  const city = new T.Group();
  city.name = 'launch-city';
  scene.add(city);
  const unit = new T.BoxGeometry(1, 1, 1),
    bodyMat = metal('#122e39', 0.55, 0.5),
    roofMat = metal('#2b4651', 0.65, 0.4);
  const bodies = new T.InstancedMesh(unit, bodyMat, 200),
    caps = new T.InstancedMesh(unit, roofMat, 200),
    edges = new T.InstancedMesh(unit, glowMaterial('#13b998', 1.4), 400),
    windows = new T.InstancedMesh(unit, glowMaterial('#3ec9c2', 1.25), 2800);
  let d = new T.Object3D(),
    wi = 0;
  function inst(mesh, i, x, y, z, sx, sy, sz) {
    d.position.set(x, y, z);
    d.scale.set(sx, sy, sz);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  }
  for (let i = 0; i < 200; i++) {
    let s = i % 2 ? 1 : -1,
      z = -30 - Math.floor(i / 2) * 19,
      x = s * rnd(dynamicFlight ? 105 : 47, 300),
      h = rnd(16, 105),
      w = rnd(7, 19),
      depth = rnd(8, 18);
    inst(bodies, i, x, h / 2 - 7, z, w, h, depth);
    inst(caps, i, x, h - 5, z, w * 0.72, 4, depth * 0.75);
    inst(edges, i * 2, x - w / 2, h / 2 - 7, z + depth / 2, 0.1, h, 0.12);
    inst(edges, i * 2 + 1, x + w / 2, h / 2 - 7, z + depth / 2, 0.1, h, 0.12);
    for (let j = 0; j < 14; j++) {
      let row = Math.floor(j / 2),
        col = j % 2;
      inst(
        windows,
        wi++,
        x + (col - 0.5) * w * 0.48,
        3 + (row * (h - 10)) / 7,
        z + depth / 2 + 0.05,
        w * 0.22,
        0.35,
        0.12,
      );
    }
  }
  for (let o of [bodies, caps, edges, windows]) {
    o.instanceMatrix.needsUpdate = true;
    city.add(o);
  }
  city.userData.loop = 1900;
  const cityFar = city.clone();
  cityFar.name = 'launch-city-far';
  cityFar.position.z = -1900;
  scene.add(cityFar);
  const near = [];
  for (let i = 0; i < 18; i++) {
    let g = new T.Group(),
      s = i % 2 ? 1 : -1;
    g.add(box(18, 2, 14, navy, 0, -5, 0));
    g.add(box(3, 16, 3, steel, 0, 2, 0));
    g.add(box(3.1, 0.3, 3.1, mint, 0, 8, 0));
    const cap = new T.Mesh(new T.OctahedronGeometry(2), black);
    cap.position.y = 12;
    g.add(cap);
    let h = halo('#37ffcb', 5, 0.45);
    h.position.set(0, 9, 0);
    g.add(h);
    g.position.set(s * (dynamicFlight ? 92 : 41), 0, -i * 65);
    scene.add(g);
    near.push(g);
  }
  // The Devastador is a distant narrative landmark; the actual boss retains its combat behavior.
  const carrier = new T.Group();
  carrier.name = 'distant-orbital-flagship';
  carrier.add(box(95, 10, 30, navy));
  carrier.add(box(35, 20, 25, black, 0, 9, -4));
  const dorsalArmor = box(72, 2, 26, steel, 0, 6, 0);
  dorsalArmor.name = 'flagship-dorsal-armor';
  carrier.add(dorsalArmor);
  const bridge = box(19, 5, 11, steel, 0, 21, -8);
  bridge.name = 'flagship-command-bridge';
  carrier.add(bridge);
  carrier.add(box(17, 0.8, 1.4, cyan, 0, 22.5, -2));
  carrier.add(box(24, 6, 1, black, 0, -0.5, 16));
  for (let i = -3; i <= 3; i++) {
    carrier.add(box(3, 0.5, 16, navy, i * 9, 7.3, 0));
    carrier.add(box(3, 0.3, 1.2, cyan, i * 9, 7.7, -8));
  }
  for (let s of [-1, 1]) {
    carrier.add(box(35, 6, 50, steel, s * 54, 0, 0));
    carrier.add(box(1, 1, 70, pink, s * 55, -3, 0));
    for (let i = 0; i < 5; i++) {
      carrier.add(box(3, 1, 2, pink, s * (5 + i * 8), -2, 16));
    }
    // Silhouette: paired engine pods, illuminated deck plating and defense towers.
    carrier.add(box(8, 7, 14, navy, s * 44, -1, 13));
    const engine = new T.Mesh(new T.TorusGeometry(3.2, 0.55, 6, 16), mint);
    engine.name = 'flagship-engine-ring';
    engine.position.set(s * 44, -1, 20.5);
    carrier.add(engine);
    carrier.add(box(24, 1.2, 32, navy, s * 54, 4.2, 0));
    for (let i = 0; i < 4; i++) carrier.add(box(2.2, 0.5, 2, cyan, s * 54, 5.1, -12 + i * 8));
    carrier.add(box(4, 7, 5, steel, s * 30, 9, -12));
    carrier.add(box(1.2, 1.2, 13, black, s * 30, 13, -17));
  }
  carrier.position.set(0, 62, -700);
  scene.add(carrier);
  const dustGeo = new T.BufferGeometry(),
    dustPos = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) {
    dustPos[i * 3] = rnd(-120, 120);
    dustPos[i * 3 + 1] = rnd(-5, 90);
    dustPos[i * 3 + 2] = rnd(-700, 25);
  }
  dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
  const dust = new T.Points(
    dustGeo,
    new T.PointsMaterial({
      size: 0.1,
      color: '#6affd4',
      transparent: true,
      opacity: 0.45,
      blending: T.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(dust);
  const rainG = new T.BufferGeometry(),
    rainP = new Float32Array(110 * 6);
  for (let i = 0; i < 110; i++) {
    const x = rnd(-180, 180),
      y = rnd(10, 130),
      z = rnd(-600, 10);
    rainP.set([x, y, z, x, y - rnd(1, 5), z], i * 6);
  }
  rainG.setAttribute('position', new T.BufferAttribute(rainP, 3));
  const rain = new T.LineSegments(
    rainG,
    new T.LineBasicMaterial({
      color: '#36e7ab',
      transparent: true,
      opacity: 0.12,
      blending: T.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(rain);
  const sectorScenery = new T.Group();
  scene.add(sectorScenery);
  let sceneryTheme = 'city';
  function clearScenery() {
    const geometries = new Set(),
      materials = new Set();
    sectorScenery.traverse((o) => {
      if (o.geometry) geometries.add(o.geometry);
      if (o.material) materials.add(o.material);
    });
    geometries.forEach((x) => x.dispose());
    materials.forEach((x) => x.dispose());
    sectorScenery.clear();
  }
  let travel = 0;
  const orbitalFrame = dynamicFlight ? new T.Group() : null;
  if (orbitalFrame) {
    const nodes = scene.children.filter((o) => !existing.has(o));
    scene.add(orbitalFrame);
    nodes.forEach((o) => orbitalFrame.add(o));
  }
  return {
    setAscent(amount, enabled) {
      if (!dynamicFlight) return;
      if (enabled && sceneryTheme !== 'city' && sceneryTheme !== 'ocean') {
        moon.visible = atmosphere.visible = true;
        moon.position.set(0, -260 - amount * 180, -1000);
        moon.scale.setScalar(2.6 - amount * 0.8);
        atmosphere.position.copy(moon.position);
        atmosphere.scale.copy(moon.scale);
        skyMat.uniforms.tint.value.setRGB(1 - amount * 0.65, 1.4 - amount, 2 - amount * 0.8);
        scene.fog.density = 0.00045 - amount * 0.0003;
      }
    },
    setLaunchAscent(amount, enabled) {
      if (!dynamicFlight || sceneryTheme !== 'city' || !enabled) return;
      const progress = T.MathUtils.clamp(amount, 0, 1);
      const t = progress * progress * (3 - 2 * progress);
      // Continuous altitude parallax: the last visible buildings have already
      // fallen below the camera long before the city meshes are hidden.
      const retreat = 780 * t * t + 180 * t;
      city.position.y = cityFar.position.y = -retreat;
      near.forEach((o) => (o.position.y = -retreat * 0.92));
      ground.position.y = -7 - retreat * 1.18;
      const scale = 1 - t * 0.26;
      city.scale.setScalar(scale);
      cityFar.scale.setScalar(scale);
      // Mutually exclusive urban and planetary stages: never draw the city
      // together with a globe. The planet fades in through the upper atmosphere.
      const orbital = launchOrbitReady(progress);
      ground.visible = !orbital;
      city.visible = cityFar.visible = !orbital;
      near.forEach((o) => (o.visible = !orbital));
      rain.visible = !orbital && t < 0.6;
      moon.visible = atmosphere.visible = false;
      scene.fog.density = 0.0014 - 0.0012 * t;
      skyMat.uniforms.tint.value.copy(launchSkyTint).lerp(launchSpaceTint, t);
      starfield.material.opacity = 0.16 + 0.59 * t;
      // A luminous cloud band bridges the city and the planetary horizon.
      // It peaks midway through the 38-second coast instead of a blank starfield.
      skyMat.uniforms.launchHaze.value = 1.4 * Math.sin(Math.PI * t) ** 2;
      earthHorizon.position.y = -940 + t * 180;
      earthHorizon.visible = orbital;
      const reveal = T.MathUtils.clamp((t - 0.65) / 0.35, 0, 1);
      earthMat.uniforms.fade.value = orbital ? 0.88 * reveal * reveal * (3 - 2 * reveal) : 0;
    },
    setOrbit(angle, center) {
      if (!orbitalFrame) return;
      orbitalFrame.rotation.y = angle;
      orbitalFrame.position
        .copy(center)
        .sub(center.clone().applyAxisAngle(new T.Vector3(0, 1, 0), angle));
    },
    setSector(sector) {
      clearScenery();
      moon.position.set(480, 280, -1000);
      moon.scale.setScalar(1);
      atmosphere.position.copy(moon.position);
      atmosphere.scale.setScalar(1);
      sceneryTheme = sector.theme;
      city.position.y = cityFar.position.y = 0;
      city.scale.setScalar(1);
      cityFar.scale.setScalar(1);
      near.forEach((o) => (o.position.y = 0));
      ground.position.y = -7;
      earthHorizon.visible = false;
      earthMat.uniforms.fade.value = 0;
      skyMat.uniforms.launchHaze.value = 0;
      starfield.material.opacity = 0.75;
      terrainMat.uniforms.water.value = sceneryTheme === 'ocean' ? 1 : 0;
      const land = ['city', 'ocean', 'ice'].includes(sceneryTheme);
      ground.visible = land;
      city.visible = cityFar.visible = sceneryTheme === 'city' || sceneryTheme === 'ocean';
      near.forEach((o) => (o.visible = city.visible));
      rain.visible = land;
      // Show the orbital globe only after the last city/port buildings are gone.
      // The first-sector Earth horizon is handled separately by setLaunchAscent.
      moon.visible = atmosphere.visible = !['void', 'throne', 'sun', 'city', 'ocean'].includes(
        sceneryTheme,
      );
      rim.color.set(sector.accent);
      key.color.set(sector.theme === 'sun' ? '#ffe4b0' : '#e3eeff');
      purple.color.set(sector.theme === 'nebula' ? '#ff8be5' : '#a5a3ff');
      scene.background.set(sector.sky);
      skyMat.uniforms.ambient.value.set(sector.sky);
      scene.fog.color.set(sector.sky);
      scene.fog.density = land ? 0.0014 : 0.00045;
      skyMat.uniforms.tint.value.set(sector.accent).multiplyScalar(1.4);
      launchSkyTint.copy(skyMat.uniforms.tint.value);
      dust.material.color.set(sector.accent);
      const mat = metal(sceneryTheme === 'ice' ? '#82bace' : '#293447', 0.6, 0.45),
        light = glowMaterial(sector.accent, 1.3);
      if (['asteroids', 'ice', 'nebula', 'sun'].includes(sceneryTheme)) {
        const geo =
          sceneryTheme === 'ice' ? new T.ConeGeometry(9, 80, 5) : new T.IcosahedronGeometry(12, 1);
        for (let i = 0; i < 60; i++) {
          const o = new T.Mesh(geo, mat);
          o.position.set(
            (i % 2 ? 1 : -1) * rnd(38, 180),
            sceneryTheme === 'ice' ? -5 : rnd(-100, 160),
            -i * 22,
          );
          o.scale.setScalar(rnd(0.5, 2.5));
          o.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
          sectorScenery.add(o);
        }
      }
      if (['station', 'fleet'].includes(sceneryTheme))
        for (let i = 0; i < 10; i++) {
          const g = new T.Group();
          const ring = new T.Mesh(new T.TorusGeometry(78, 2.2, 6, 8), mat);
          g.add(ring);
          g.add(new T.Mesh(new T.TorusGeometry(74, 0.4, 6, 8), light));
          g.position.set(0, 0, -i * 150 - 100);
          g.rotation.z = i * 0.13;
          sectorScenery.add(g);
        }
      if (
        ['void', 'throne', 'sun', 'nebula'].includes(sceneryTheme) &&
        !(dynamicFlight && sceneryTheme === 'throne')
      ) {
        const orb = new T.Mesh(
          new T.SphereGeometry(135, 32, 20),
          sceneryTheme === 'sun' ? light : metal('#05020a', 0, 1),
        );
        orb.position.set(90, 90, -600);
        sectorScenery.add(orb);
        for (let i = 0; i < 4; i++) {
          const disk = new T.Mesh(new T.TorusGeometry(160 + i * 18, 1 + i * 0.5, 6, 96), light);
          disk.position.copy(orb.position);
          disk.rotation.x = 0.9;
          disk.rotation.y = 0.2;
          sectorScenery.add(disk);
        }
      }
      if (dynamicFlight && sceneryTheme === 'throne') {
        const hole = new T.Group();
        hole.userData.fixedSky = true;
        hole.position.set(0, 125, -850);
        hole.scale.setScalar(1.35);
        const black = new T.Mesh(
          new T.SphereGeometry(122, 48, 32),
          new T.MeshBasicMaterial({ color: '#000003', fog: false }),
        );
        hole.add(black);
        const disk = new T.Mesh(
          new T.RingGeometry(130, 310, 128, 4),
          new T.ShaderMaterial({
            side: T.DoubleSide,
            transparent: true,
            depthWrite: false,
            vertexShader:
              'varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
            fragmentShader:
              'varying vec3 p; void main(){float r=length(p.xy);float band=.6+.4*sin(r*1.5);float a=(1.-smoothstep(200.,310.,r))*smoothstep(130.,142.,r);vec3 c=mix(vec3(1.,.25,.035),vec3(1.,.88,.5),pow(1.-clamp((r-130.)/180.,0.,1.),2.));gl_FragColor=vec4(c*(1.5+band),a);}',
          }),
        );
        disk.rotation.x = 1.34;
        disk.rotation.z = -0.12;
        hole.add(disk);
        for (const radius of [125, 135]) {
          const ring = new T.Mesh(
            new T.TorusGeometry(radius, radius === 125 ? 1.8 : 5, 8, 128),
            new T.MeshBasicMaterial({
              color: radius === 125 ? '#fff0c8' : '#faab52',
              transparent: true,
              opacity: radius === 125 ? 1 : 0.38,
              fog: false,
            }),
          );
          ring.scale.y = radius === 125 ? 1 : 1.14;
          hole.add(ring);
        }
        hole.traverse((o) => {
          o.userData.fixedSky = true;
        });
        sectorScenery.add(hole);
      }
      if (dynamicFlight && ['asteroids', 'nebula'].includes(sceneryTheme)) {
        const gateway = new T.Mesh(new T.TorusGeometry(32, 3, 8, 64), light);
        gateway.position.set(0, 10, -390);
        gateway.userData.conduit = true;
        const inner = new T.Mesh(new T.TorusGeometry(28, 0.4, 6, 64), light);
        gateway.add(inner);
        sectorScenery.add(gateway);
      }
      if (dynamicFlight && !land) {
        for (let i = 0; i < 22; i++) {
          const ring = new T.Mesh(new T.TorusGeometry(43, 1.5, 6, 24), mat);
          ring.add(new T.Mesh(new T.TorusGeometry(40.5, 0.32, 4, 48), light));
          ring.position.set(0, 10, -800 - i * 22);
          ring.userData.conduit = true;
          sectorScenery.add(ring);
        }
      }
      // Materials unused by a theme are disposed immediately.
      if (!sectorScenery.children.length) {
        mat.dispose();
        light.dispose();
      }
    },
    update(dt, time, speed, playing) {
      terrainMat.uniforms.time.value = time;
      if (playing) {
        travel += speed * dt;
        terrainMat.uniforms.travel.value = travel;
        city.position.z = travel % 1900;
        cityFar.position.z = city.position.z - 1900;
        for (let g of near) {
          g.position.z += speed * dt;
          if (g.position.z > 50) g.position.z -= 1170;
        }
        for (let i = 0; i < 240; i++) {
          dustPos[i * 3 + 2] += speed * dt;
          if (dustPos[i * 3 + 2] > 30) dustPos[i * 3 + 2] = -700;
        }
        dustGeo.attributes.position.needsUpdate = true;
      }
      if (playing)
        for (const o of sectorScenery.children) {
          if (o.userData.conduit) {
            o.position.z += speed * dt;
            o.visible = o.position.z < 65;
            continue;
          }
          if (o.userData.fixedSky) continue;
          if (['station', 'fleet', 'asteroids', 'ice'].includes(sceneryTheme)) {
            o.position.z += speed * dt;
            if (o.position.z > 100) o.position.z -= 1500;
          }
          if (sceneryTheme !== 'ice') o.rotation.z += dt * 0.025;
        }
      rain.position.y = -((time * 12) % 90);
      carrier.position.y = 62 + Math.sin(time * 0.25) * 3;
    },
    reset() {
      if (orbitalFrame) {
        orbitalFrame.position.set(0, 0, 0);
        orbitalFrame.rotation.set(0, 0, 0);
      }
      travel = 0;
      city.position.set(0, 0, 0);
      cityFar.position.set(0, 0, -1900);
      city.scale.setScalar(1);
      cityFar.scale.setScalar(1);
      ground.position.y = -7;
      earthHorizon.visible = false;
      earthMat.uniforms.fade.value = 0;
      skyMat.uniforms.launchHaze.value = 0;
      near.forEach((g, i) => g.position.set(g.position.x, 0, -i * 65));
    },
  };
}
export function bossModel() {
  let g = new T.Group();
  g.add(box(24, 5, 13, navy));
  g.add(box(10, 8, 17, red, 0, 1, 0));
  for (let s of [-1, 1]) {
    g.add(box(12, 3, 23, black, s * 17, 1, 0));
    for (let j = 0; j < 3; j++) {
      g.add(box(9, 1, 5, steel, s * 17, 3, j * 7 - 7));
      g.add(box(0.2, 0.2, 5, pink, s * 20, 3.6, j * 7 - 7));
    }
    g.add(box(5, 8, 7, steel, s * 14, 0, 6));
    g.add(box(3, 1, 1, pink, s * 14, 1, 10));
    let h = halo('#ff4962', 8, 0.6);
    h.position.set(s * 14, 1, 10.5);
    g.add(h);
  }
  const core = new T.Mesh(new T.SphereGeometry(2.5, 24, 16), glowMaterial('#ff8a47', 4));
  core.position.z = 10;
  g.add(core);
  let ring = new T.Mesh(new T.TorusGeometry(3.7, 0.28, 8, 40), steel);
  ring.position.z = 10;
  g.add(ring);
  let inner = new T.Mesh(new T.TorusGeometry(3.3, 0.1, 8, 40), pink);
  inner.position.z = 10.1;
  g.add(inner);
  let h = halo('#ff573f', 15, 0.6);
  h.position.z = 11;
  g.add(h);
  return g;
}
export function postProcessor(renderer, scene, camera) {
  const targetType = renderer.extensions.has('EXT_color_buffer_float')
    ? T.HalfFloatType
    : T.UnsignedByteType;
  const full = new T.WebGLRenderTarget(1, 1, { type: targetType, depthBuffer: true, samples: 2 });
  const a = new T.WebGLRenderTarget(1, 1, { type: targetType, depthBuffer: false }),
    b = a.clone();
  const passScene = new T.Scene(),
    passCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const vertex = 'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const blur = new T.ShaderMaterial({
    uniforms: {
      tex: { value: null },
      stepSize: { value: new T.Vector2() },
      threshold: { value: 0 },
    },
    vertexShader: vertex,
    fragmentShader: `varying vec2 uv0;uniform sampler2D tex;uniform vec2 stepSize;uniform float threshold;vec3 sampleAt(vec2 p){vec3 c=texture2D(tex,p).rgb;float l=max(c.r,max(c.g,c.b));return c*max(0.,l-threshold)/max(.001,l);}void main(){vec3 c=sampleAt(uv0)*.227027;c+=sampleAt(uv0+stepSize*1.384615)*.316216;c+=sampleAt(uv0-stepSize*1.384615)*.316216;c+=sampleAt(uv0+stepSize*3.230769)*.070270;c+=sampleAt(uv0-stepSize*3.230769)*.070270;gl_FragColor=vec4(c,1.);}`,
  });
  const final = new T.ShaderMaterial({
    uniforms: { base: { value: full.texture }, bloom: { value: b.texture } },
    vertexShader: vertex,
    fragmentShader:
      `varying vec2 uv0;uniform sampler2D base;uniform sampler2D bloom;void main(){vec3 c=texture2D(base,uv0).rgb+texture2D(bloom,uv0).rgb*.48;float vignette=1.-.20*pow(length((uv0-.5)*1.4),2.);c*=vignette;gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(
        ';#include',
        ';\n#include',
      ),
  });
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2), blur);
  passScene.add(quad);
  let bw = 1,
    bh = 1;
  return {
    resize(w, h) {
      let pr = renderer.getPixelRatio();
      full.setSize(Math.round(w * pr), Math.round(h * pr));
      bw = Math.max(1, Math.round((w * pr) / 3));
      bh = Math.max(1, Math.round((h * pr) / 3));
      a.setSize(bw, bh);
      b.setSize(bw, bh);
    },
    render() {
      renderer.setRenderTarget(full);
      renderer.render(scene, camera);
      quad.material = blur;
      blur.uniforms.tex.value = full.texture;
      blur.uniforms.stepSize.value.set(1 / bw, 0);
      blur.uniforms.threshold.value = 0.8;
      renderer.setRenderTarget(a);
      renderer.render(passScene, passCam);
      blur.uniforms.tex.value = a.texture;
      blur.uniforms.stepSize.value.set(0, 1 / bh);
      blur.uniforms.threshold.value = 0;
      renderer.setRenderTarget(b);
      renderer.render(passScene, passCam);
      quad.material = final;
      renderer.setRenderTarget(null);
      renderer.render(passScene, passCam);
    },
  };
}
