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
  const rockGeometry = new T.IcosahedronGeometry(1, 0);
  const rockMaterial = new T.MeshStandardMaterial({
    color: '#4b3c54',
    metalness: 0.22,
    roughness: 0.88,
    flatShading: true,
  });
  const veinMaterial = new T.MeshBasicMaterial({ color: '#eb79fc' });
  const gateMaterial = new T.MeshStandardMaterial({
    color: '#4a354a',
    metalness: 0.4,
    roughness: 0.76,
    flatShading: true,
    side: T.DoubleSide,
  });
  const mouth = new T.Group();
  mouth.name = 'asteroid-entrance';
  const outerShell = new T.Mesh(new T.TorusGeometry(106, 65, 7, 19), gateMaterial);
  outerShell.scale.y = 0.82;
  mouth.add(outerShell);
  const portal = new T.Mesh(new T.TorusGeometry(42, 2, 5, 24), veinMaterial);
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
    }
    rocks.instanceMatrix.needsUpdate = true;
    section.add(rocks);
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
  function setPhase(next) {
    phase = next;
    mouth.visible = next === 'approach' || next === 'transition';
    tunnel.visible = next === 'transition' || next === 'interior' || next === 'escape';
    arena.visible = next === 'boss';
    if (mouth.visible) {
      mouth.position.z = next === 'transition' ? -220 : -630;
      mouth.scale.setScalar(next === 'transition' ? 1.2 : 1);
    }
  }
  setPhase('inactive');
  return {
    setPhase,
    reset(active) {
      runTime = 0;
      for (let i = 0; i < rings.length; i++) rings[i].position.z = -115 - i * RING_GAP;
      setPhase(active ? 'approach' : 'inactive');
    },
    update(dt, speed) {
      if (!tunnel.visible && !mouth.visible && !arena.visible) return;
      runTime += dt;
      if (mouth.visible && phase === 'approach') {
        mouth.position.z = -630 + Math.min(1, runTime / 16) * 370;
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
    },
  };
}
