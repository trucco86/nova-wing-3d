import * as T from 'three';

// Stage-one ascent only. An authored station stays in the planetary backdrop;
// scattered debris uses a seeded variation of independent trajectories, not a
// synchronized sheet of triangles moving in one direction.
const ISS_SECONDS = 6.5;
const ISS_START = 0.9;
const metal = (color) => new T.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.72 });
function makeISS() {
  const root = new T.Group();
  root.name = 'launch-iss-orbiting-earth';
  root.userData.visualOnly = true;
  const silver = metal('#d9e3eb');
  const white = metal('#f4f5eb');
  const dark = metal('#28374d');
  const solar = new T.MeshStandardMaterial({
    color: '#143b75',
    metalness: 0.22,
    roughness: 0.28,
    emissive: '#102d57',
    emissiveIntensity: 0.45,
    side: T.DoubleSide,
  });
  const gold = metal('#bb9e5c');
  const box = (x, y, z, w, h, d, material, parent = root) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  // Central integrated truss with recognizable long, transverse photovoltaic wings.
  box(0, 1.6, 0, 102, 1.8, 3.4, silver);
  box(0, 0, -2, 42, 1.5, 1.4, dark);
  for (const side of [-1, 1]) {
    for (let p = 0; p < 4; p++) {
      const x = side * (17.5 + p * 12);
      box(x, 6.1, 0, 10.3, 7.4, 0.5, solar);
      box(x, -4.1, 0, 10.3, 7.4, 0.5, solar);
      for (const y of [-4.1, 6.1]) {
        box(x, y, 0.37, 10.3, 0.18, 0.28, gold);
        box(x, y, -0.37, 10.3, 0.18, 0.28, silver);
        box(x, y, 0.4, 0.22, 7.1, 0.2, silver);
      }
    }
    box(side * 16, 1.6, 0, 2, 4.6, 1.5, silver);
    // Radiator wings are white, narrow and perpendicular to the solar arrays.
    for (let r = 0; r < 2; r++) box(side * (12 + r * 9), -0.4, 8, 7.5, 8, 0.28, white);
  }
  const cylinders = [
    [0, 0, 0, 7, 29],
    [0, -1.3, 17, 5, 12],
    [0, 0.8, -16, 6, 18],
    [8.5, -3, 1, 4, 13],
    [-8.5, -3, -3, 4, 13],
  ];
  for (const [x, y, z, radius, length] of cylinders) {
    const module = new T.Mesh(new T.CylinderGeometry(radius, radius, length, 12), silver);
    module.rotation.x = Math.PI / 2;
    module.position.set(x, y, z);
    root.add(module);
    for (const end of [-1, 1]) {
      const ring = new T.Mesh(new T.TorusGeometry(radius + 0.2, 0.55, 5, 12), dark);
      ring.position.set(x, y, z + end * length * 0.5);
      root.add(ring);
    }
  }
  box(0, -6, 4, 6, 4, 8, gold);
  const cupola = new T.Mesh(new T.SphereGeometry(3.8, 10, 8), dark);
  cupola.position.set(0, -8, 7);
  root.add(cupola);
  const dish = new T.Mesh(new T.ConeGeometry(3.7, 2, 12), white);
  dish.rotation.x = Math.PI / 2;
  dish.position.set(13, 6.2, 10);
  root.add(dish);
  root.visible = false;
  return root;
}

export function createOrbitalAscentEncounter(scene, random = Math.random) {
  const root = new T.Group();
  root.name = 'stage1-ascent-scattered-debris';
  root.userData.visualOnly = true;
  scene.add(root);
  const station = makeISS();
  scene.add(station);
  const geometries = [
    new T.IcosahedronGeometry(1, 0),
    new T.TetrahedronGeometry(1, 0),
    new T.BoxGeometry(1, 0.2, 1.5),
  ];
  const materials = [metal('#678297'), metal('#2f4858'), metal('#baac9c'), metal('#b48a62')];
  const pieces = Array.from({ length: 24 }, (_, index) => {
    const mesh = new T.Mesh(geometries[index % geometries.length], materials[index % 4]);
    mesh.name = 'stage1-ascent-fragment-' + index;
    mesh.userData.visualOnly = true;
    mesh.visible = false;
    root.add(mesh);
    return {
      mesh,
      start: 0,
      life: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      scale: 1,
      phase: 0,
    };
  });
  const range = (low, high) => low + (high - low) * random();
  let quality = 'high';
  let firstISS = null;
  let latest = { active: 0, near: 0, iss: false, issSeconds: 0 };
  function reset() {
    firstISS = null;
    station.visible = false;
    for (const d of pieces) {
      d.start = range(0.27, 0.88);
      d.life = range(0.075, 0.18);
      d.x = range(-150, 150);
      if (Math.abs(d.x) < 18) d.x += d.x < 0 ? -25 : 25;
      d.y = range(-17, 102);
      d.z = range(-520, -100);
      d.vx = range(-150, 150);
      d.vy = range(-85, 130);
      d.vz = range(70, 310);
      d.spinX = range(-8, 8);
      d.spinY = range(-8, 8);
      d.spinZ = range(-8, 8);
      d.scale = range(2.5, 11);
      d.phase = range(-Math.PI, Math.PI);
      d.mesh.visible = false;
    }
    latest = { active: 0, near: 0, iss: false, issSeconds: 0 };
    return latest;
  }
  function setQuality(next) {
    quality = next === 'medium' ? 'medium' : 'high';
  }
  function update(progress, time) {
    let active = 0;
    let near = 0;
    for (let i = 0; i < pieces.length; i++) {
      const d = pieces[i];
      const t = (progress - d.start) / d.life;
      const visible = i < (quality === 'high' ? 24 : 14) && t > 0 && t < 1;
      d.mesh.visible = visible;
      if (!visible) continue;
      active++;
      const bloom = Math.min(1, t * 8, (1 - t) * 8);
      const drift = t - 0.5;
      const wave = Math.sin(d.phase + t * 4);
      d.mesh.position.set(
        d.x + d.vx * drift + wave * 6,
        d.y + d.vy * drift + Math.cos(d.phase + t * 7) * 4,
        d.z + d.vz * t,
      );
      d.mesh.rotation.set(d.phase + t * d.spinX, t * d.spinY, t * d.spinZ);
      d.mesh.scale.setScalar(d.scale * Math.max(0.01, bloom));
      if (d.mesh.position.z > -200) near++;
    }
    if (progress >= ISS_START && firstISS === null) firstISS = time;
    const age = firstISS === null ? -1 : Math.max(0, time - firstISS);
    station.visible = progress >= ISS_START && age < ISS_SECONDS;
    if (station.visible) {
      // Visually orbit the Earth's limb rather than following the player.
      const orbitalAngle = -0.56 + (age / ISS_SECONDS) * 1.12;
      station.position.set(
        780 * Math.sin(orbitalAngle),
        -920 + 790 * Math.cos(orbitalAngle),
        -925 + 18 * Math.sin(orbitalAngle * 2),
      );
      station.rotation.set(-0.18, -0.17 + age * 0.12, 0.07 + age * 0.018);
      station.scale.setScalar(1.05 + 0.13 * Math.sin((Math.PI * age) / ISS_SECONDS));
    }
    latest = { active, near, iss: station.visible, issSeconds: age };
    return latest;
  }
  function snapshot() {
    return {
      ...latest,
      fragments: pieces
        .filter(({ mesh }) => mesh.visible)
        .map(({ mesh }) => ({
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
          scale: mesh.scale.x,
          kind: mesh.geometry.type,
        })),
      stationPosition: station.position.toArray(),
    };
  }
  reset();
  return { root, station, update, setQuality, reset, snapshot };
}
