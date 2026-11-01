import * as T from 'three';

// Web sector 3: a light-weight, GPU-instanced corridor rather than hundreds of draw calls.
// The central tunnel stays free for aiming, enemies and cockpit/chase cameras.
const CENTER_Y = 10;
const PILOT_RADIUS = 27;
const SHOT_RADIUS = 37;
const RING_COUNT = 8;
const RING_GAP = 110;

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

export function createAsteroidInterior(scene) {
  const rockGeometry = new T.IcosahedronGeometry(1, 1);
  const rockMaterial = new T.MeshStandardMaterial({
    color: '#4b3c54',
    metalness: 0.22,
    roughness: 0.88,
    flatShading: true,
  });
  const veinMaterial = new T.MeshBasicMaterial({ color: '#b98cfa', toneMapped: false });
  const oreMaterial = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
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
    entranceDummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 17 + i % 4);
    entranceDummy.rotation.set(0, 0, a + 0.24);
    entranceDummy.scale.set(1.1, 7 + (i % 4) * 3, 1.4);
    entranceDummy.updateMatrix();
    portal.setMatrixAt(i, entranceDummy.matrix);
  }
  portal.instanceMatrix.needsUpdate = true;
  mouth.add(portal);
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
      ores.setColorAt(k, new T.Color(['#b48fff', '#6cc9ee', '#cfadff', '#8d7ac9'][k % 4]));
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
    const seam = new T.Mesh(new T.TorusGeometry(36.7, 0.44, 5, 28), veinMaterial);
    seam.position.z = -14;
    section.add(seam);
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
  let entryFromZ = -630;
  let entryAge = 0;
  function setPhase(next) {
    if (next === phase) return;
    if (next === 'transition') {
      // Preserve the last visible approach frame: no geometry teleport.
      entryFromZ = mouth.position.z;
      entryAge = 0;
    }
    phase = next;
    mouth.visible = next === 'approach' || next === 'transition';
    tunnel.visible = next === 'transition' || next === 'interior' || next === 'escape';
    arena.visible = next === 'boss';
    if (next === 'approach') {
      mouth.position.z = -630;
      mouth.scale.setScalar(1);
    }
  }
  setPhase('inactive');
  return {
    setPhase,
    reset(active) {
      runTime = 0;
      entryAge = 0;
      entryFromZ = -630;
      for (let i = 0; i < rings.length; i++) rings[i].position.z = -115 - i * RING_GAP;
      setPhase(active ? 'approach' : 'inactive');
    },
    update(dt, speed) {
      if (!tunnel.visible && !mouth.visible && !arena.visible) return;
      runTime += dt;
      if (mouth.visible && phase === 'approach') {
        mouth.position.z = -630 + Math.min(1, runTime / 16) * 370;
      } else if (mouth.visible && phase === 'transition') {
        // Fly through the asteroid over the existing transition window.
        // Uses the simulation clock: pause/reset/replay never drift.
        entryAge += dt;
        const linear = Math.max(0, Math.min(1, entryAge / 11));
        const eased = linear * linear * (3 - 2 * linear);
        mouth.position.z = entryFromZ + (55 - entryFromZ) * eased;
        mouth.scale.setScalar(1 + 0.22 * eased);
      }
      if (tunnel.visible) {
        for (const section of rings) {
          section.position.z += dt * speed * (phase === 'escape' ? 1.8 : 1);
          if (section.position.z > 70) section.position.z -= RING_COUNT * RING_GAP;
          section.rotation.z += dt * (phase === 'escape' ? 0.075 : 0.012);
        }
      }
      if (arena.visible) arena.rotation.z = Math.sin(runTime * 0.3) * 0.04;
    },
    constrain(position) {
      return phase === 'transition' || phase === 'interior' || phase === 'escape'
        ? constrainCavernPosition(position)
        : { collided: false, x: position.x, y: position.y };
    },
    projectileBlocked(from, to) {
      return (
        (phase === 'transition' || phase === 'interior' || phase === 'escape') &&
        crossesCavernWall(from, to)
      );
    },
    snapshot() {
      return {
        phase,
        cavernVisible: tunnel.visible,
        entranceVisible: mouth.visible,
        arenaVisible: arena.visible,
        rings: rings.length,
      };
    },
    destroy() {
      scene.remove(mouth, tunnel, arena);
      for (const mesh of [
        outerShell,
        portal,
        ...rings.flatMap((r) => r.children),
        ...arena.children,
      ]) {
        mesh.geometry?.dispose();
      }
      rockGeometry.dispose();
      rockMaterial.dispose();
      veinMaterial.dispose();
      gateMaterial.dispose();
      oreMaterial.dispose();
      braceMaterial.dispose();
      crystalGeo.dispose();
      braceGeo.dispose();
    },
  };
}
