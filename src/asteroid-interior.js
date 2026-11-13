import * as T from 'three';
import { createAsteroidCourse } from './asteroid-course.js';

// Web sector 3: a light-weight, GPU-instanced corridor rather than hundreds of draw calls.
// The central tunnel stays free for aiming, enemies and cockpit/chase cameras.
const CENTER_Y = 10;
const PILOT_RADIUS = 27;
const SHOT_RADIUS = 37;
const RING_COUNT = 8;
const RING_GAP = 110;
const THROAT_DEPTH = 140;
const ENTRANCE_CLEAR_Z = 230;

export function constrainCavernPosition(position, radius = PILOT_RADIUS) {
  const dy = position.y - CENTER_Y;
  const distance = Math.hypot(position.x, dy);
  if (distance <= radius) return { collided: false, x: position.x, y: position.y };
  const scale = radius / distance;
  return { collided: true, x: position.x * scale, y: CENTER_Y + dy * scale };
}

export function crossesCavernWall(from, to, radius = SHOT_RADIUS) {
  if (from.z > 60 && to.z > 60) return false;
  const outside = (p) => Math.hypot(p.x, p.y - CENTER_Y) >= radius;
  if (outside(from) || outside(to)) return true;
  // Swept segment is linear; radial distance has its maximum at an endpoint.
  return false;
}

export function createAsteroidInterior(scene, { obstacles = false } = {}) {
  const course = createAsteroidCourse(scene, obstacles);
  const rockGeometry = new T.IcosahedronGeometry(1, 1);
  const rockMaterial = new T.MeshStandardMaterial({
    color: '#4b3c54',
    metalness: 0.22,
    roughness: 0.88,
    flatShading: true,
  });
  const veinMaterial = new T.MeshStandardMaterial({
    color: '#c49d76',
    roughness: 0.39,
    metalness: 0.53,
    emissive: '#8c5d3e',
    emissiveIntensity: 0.17,
  });
  const oreMaterial = new T.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.32,
    metalness: 0.21,
    emissive: '#535663',
    emissiveIntensity: 0.09,
    flatShading: true,
  });
  const braceMaterial = new T.MeshStandardMaterial({
    color: '#77808c',
    metalness: 0.7,
    roughness: 0.43,
  });
  const crystalGeo = new T.OctahedronGeometry(1, 0);
  const braceGeo = new T.BoxGeometry(1, 1, 1);
  const gateMaterial = new T.MeshStandardMaterial({
    color: '#4a354a',
    metalness: 0.4,
    roughness: 0.76,
    flatShading: true,
    side: T.DoubleSide,
  });
  const mouth = new T.Group();
  mouth.name = 'asteroid-entrance';
  // A real irregular rock aperture, not a bright circular portal/ring.
  // Instancing retains two draw calls and a clear central flight corridor.
  const entranceDummy = new T.Object3D();
  const outerShell = new T.InstancedMesh(rockGeometry, gateMaterial, 56);
  outerShell.name = 'asteroid-entrance-jagged-rock-face';
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    const radius = 76 + Math.sin(i * 2.37) * 7;
    entranceDummy.position.set(
      Math.cos(a) * radius,
      Math.sin(a) * radius * 0.88,
      Math.sin(i * 1.7) * 22,
    );
    entranceDummy.rotation.set(i * 0.37, i * 0.18, a);
    entranceDummy.scale.set(31 + (i % 4) * 4, 30 + (i % 3) * 5, 36 + (i % 5) * 6);
    entranceDummy.updateMatrix();
    outerShell.setMatrixAt(i, entranceDummy.matrix);
    outerShell.setColorAt(i, new T.Color(['#68505b', '#7b6269', '#584956', '#817273'][i % 4]));
  }
  outerShell.instanceMatrix.needsUpdate = true;
  outerShell.instanceColor.needsUpdate = true;
  mouth.add(outerShell);
  // Sparse mineral faults follow separate rock faces, not a concentric hoop.
  const portal = new T.InstancedMesh(braceGeo, veinMaterial, 12);
  portal.name = 'asteroid-entrance-mineral-faults';
  for (let i = 0; i < 12; i++) {
    const a = (i * 2.399963) % (Math.PI * 2);
    const radius = 53 + (i % 3) * 5;
    entranceDummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 17 + (i % 4));
    entranceDummy.rotation.set(0, 0, a + 0.24);
    entranceDummy.scale.set(1.1, 7 + (i % 4) * 3, 1.4);
    entranceDummy.updateMatrix();
    portal.setMatrixAt(i, entranceDummy.matrix);
  }
  portal.instanceMatrix.needsUpdate = true;
  mouth.add(portal);
  // Three overlapping, tapered rock shelves connect the exterior to the
  // first cavern section. Their inner faces keep the flight corridor open.
  const throat = new T.InstancedMesh(rockGeometry, rockMaterial, 54);
  throat.name = 'asteroid-entrance-throat';
  for (let layer = 0; layer < 3; layer++) {
    for (let j = 0; j < 18; j++) {
      const angle = (j / 18) * Math.PI * 2 + layer * 0.08;
      const radius = 57 - layer * 4 + Math.sin(j * 2.7) * 2;
      entranceDummy.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -35 - layer * 40,
      );
      entranceDummy.rotation.set(0, 0, angle);
      entranceDummy.scale.set(9, 17, 30);
      entranceDummy.updateMatrix();
      throat.setMatrixAt(layer * 18 + j, entranceDummy.matrix);
      throat.setColorAt(layer * 18 + j, new T.Color(['#817273', '#685967', '#53636d'][layer]));
    }
  }
  throat.instanceMatrix.needsUpdate = true;
  throat.instanceColor.needsUpdate = true;
  mouth.add(throat);
  mouth.position.set(0, CENTER_Y, -630);
  scene.add(mouth);

  const tunnel = new T.Group();
  tunnel.name = 'asteroid-cavern';
  const dummy = new T.Object3D();
  const rings = [];
  for (let i = 0; i < RING_COUNT; i++) {
    const section = new T.Group();
    section.name = 'asteroid-cavern-section';
    const rocks = new T.InstancedMesh(rockGeometry, rockMaterial, 18);
    for (let j = 0; j < 18; j++) {
      const angle = (j / 18) * Math.PI * 2 + (i % 2) * 0.05;
      const r = 44 + Math.sin(j * 2.71 + i * 3.13) * 3;
      dummy.position.set(Math.cos(angle) * r, Math.sin(angle) * r, Math.sin(i + j * 1.87) * 14);
      dummy.rotation.set(j * 0.39, i * 0.27, angle);
      dummy.scale.set(12 + (j % 3) * 2, 14 + (j % 4) * 2, 26);
      dummy.updateMatrix();
      rocks.setMatrixAt(j, dummy.matrix);
      rocks.setColorAt(j, new T.Color(['#6e5963', '#8a7082', '#53636d', '#8c6971'][(j + i) % 4]));
    }
    rocks.instanceMatrix.needsUpdate = true;
    rocks.instanceColor.needsUpdate = true;
    section.add(rocks);
    // Precious mineral veins and heavy engineering braces make the cavern
    // materially readable instead of a repeated torus tunnel. Both use
    // instancing, keep the radius >37 clear and cost two batches per ring.
    const ores = new T.InstancedMesh(crystalGeo, oreMaterial, 12);
    ores.name = 'asteroid-cavern-mineral-crystals';
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + i * 0.15;
      dummy.position.set(Math.cos(a) * 41.8, Math.sin(a) * 41.8, -14 + (k % 4) * 6);
      dummy.rotation.set(k * 0.2, k * 0.5, a);
      dummy.scale.set(2.2 + (k % 3), 4.5 + (k % 4), 2.4);
      dummy.updateMatrix();
      ores.setMatrixAt(k, dummy.matrix);
      ores.setColorAt(k, new T.Color(['#d8b69e', '#a9c0c4', '#d2c5a7', '#9aabb4'][k % 4]));
    }
    ores.instanceMatrix.needsUpdate = true;
    ores.instanceColor.needsUpdate = true;
    section.add(ores);
    const braces = new T.InstancedMesh(braceGeo, braceMaterial, 8);
    braces.name = 'asteroid-cavern-mining-braces';
    for (let k = 0; k < 8; k++) {
      const angle = (k * Math.PI) / 4;
      dummy.position.set(Math.cos(angle) * 42, Math.sin(angle) * 42, -10);
      dummy.rotation.set(0, 0, angle + Math.PI / 2);
      dummy.scale.set(1.3, 14, 1.8);
      dummy.updateMatrix();
      braces.setMatrixAt(k, dummy.matrix);
    }
    braces.instanceMatrix.needsUpdate = true;
    section.add(braces);
    // Fragmented ore seams must FOLLOW the cavern rock, not form a neon
    // hoop at the edge of the pilot's flight path. One instanced batch per
    // section replaces the old contiguous torus without any new draw call.
    const seams = new T.InstancedMesh(braceGeo, veinMaterial, 8);
    seams.name = 'asteroid-cavern-stratified-ore-seams';
    seams.userData.visualOnly = true;
    for (let k = 0; k < 8; k++) {
      const angle = ((k + 0.31) * Math.PI) / 4 + i * 0.09;
      const radius = 44 + Math.sin(i * 0.63 + k * 2.1) * 2;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -14 + (k % 3) * 4);
      dummy.rotation.set(0, 0, angle + Math.PI / 2);
      dummy.scale.set(0.55, 8 + (k % 3) * 2.6, 0.68);
      dummy.updateMatrix();
      seams.setMatrixAt(k, dummy.matrix);
    }
    seams.instanceMatrix.needsUpdate = true;
    section.add(seams);
    section.position.set(0, CENTER_Y, -115 - i * RING_GAP);
    tunnel.add(section);
    rings.push(section);
  }
  scene.add(tunnel);

  const arena = new T.Group();
  arena.name = 'asteroid-core-arena';
  for (let i = 0; i < 3; i++) {
    const ring = new T.Mesh(
      new T.TorusGeometry(61 + i * 7, 3 - i * 0.35, 6, 30),
      i === 1 ? veinMaterial : gateMaterial,
    );
    ring.position.set(0, CENTER_Y, -170 - i * 72);
    arena.add(ring);
  }
  scene.add(arena);

  let phase = 'inactive';
  let runTime = 0;
  function placeApproach() {
    mouth.position.z = -630 + Math.min(1, runTime / 16) * 370;
    mouth.scale.setScalar(1);
    for (let i = 0; i < rings.length; i++) {
      rings[i].position.z = mouth.position.z - THROAT_DEPTH - i * RING_GAP;
      rings[i].rotation.z = 0;
    }
  }
  function setPhase(next) {
    phase = next;
    course.setPhase(next);
    mouth.visible =
      next === 'approach' ||
      (['transition', 'interior'].includes(next) && mouth.position.z <= ENTRANCE_CLEAR_Z);
    // The cavern is already behind the aperture during approach; changing
    // the journey phase must never spawn a corridor in front of the pilot.
    tunnel.visible = ['approach', 'transition', 'interior', 'escape'].includes(next);
    arena.visible = next === 'boss';
    if (next === 'approach') placeApproach();
  }
  setPhase('inactive');
  return {
    setPhase,
    reset(active) {
      runTime = 0;
      course.reset();
      placeApproach();
      arena.rotation.z = 0;
      setPhase(active ? 'approach' : 'inactive');
    },
    update(dt, speed, pilot = null) {
      let collision = false;
      if (!tunnel.visible && !mouth.visible && !arena.visible) return;
      runTime += dt;
      if (phase === 'approach') {
        placeApproach();
      } else if (tunnel.visible) {
        const advance = course.advance(
          dt * speed * (phase === 'escape' ? 1.8 : 1),
          pilot?.position,
          pilot?.half,
          pilot?.clearanceHalf,
        );
        const distance = advance.distance;
        collision = advance.collided;
        if (phase === 'transition' || phase === 'interior') {
          mouth.position.z += distance;
          // Keep the thick lip and throat until they are behind the chase
          // camera, including when the timed journey enters its next phase.
          mouth.visible = mouth.position.z <= ENTRANCE_CLEAR_Z;
        }
        for (const section of rings) {
          section.position.z += distance;
          if (section.position.z > ENTRANCE_CLEAR_Z)
            section.position.z -=
              Math.ceil((section.position.z - ENTRANCE_CLEAR_Z) / (RING_COUNT * RING_GAP)) *
              RING_COUNT *
              RING_GAP;
          if (phase === 'escape') section.rotation.z += dt * 0.075;
        }
      }
      if (arena.visible) arena.rotation.z = Math.sin(runTime * 0.3) * 0.04;
      return { collided: collision };
    },
    course,
    constrain(position) {
      return phase === 'transition' || phase === 'interior' || phase === 'escape'
        ? constrainCavernPosition(position)
        : { collided: false, x: position.x, y: position.y };
    },
    projectileBlocked(from, to) {
      return (
        (phase === 'transition' || phase === 'interior' || phase === 'escape') &&
        (crossesCavernWall(from, to) || course.projectileBlocked(from, to))
      );
    },
    snapshot() {
      return {
        phase,
        course: course.snapshot(),
        cavernVisible: tunnel.visible,
        entranceVisible: mouth.visible,
        arenaVisible: arena.visible,
        rings: rings.length,
        entranceZ: mouth.position.z,
        nearestSectionZ: Math.max(...rings.map((section) => section.position.z)),
      };
    },
    destroy() {
      course.destroy();
      scene.remove(mouth, tunnel, arena);
      const geometries = new Set([
        rockGeometry,
        crystalGeo,
        braceGeo,
        ...rings.flatMap((ring) => ring.children.map((mesh) => mesh.geometry)),
        ...arena.children.map((mesh) => mesh.geometry),
      ]);
      for (const geometry of geometries) geometry.dispose();
      for (const mesh of [outerShell, portal, throat, ...rings.flatMap((ring) => ring.children)])
        if (mesh.isInstancedMesh) mesh.dispose();
      rockMaterial.dispose();
      veinMaterial.dispose();
      gateMaterial.dispose();
      oreMaterial.dispose();
      braceMaterial.dispose();
    },
  };
}
