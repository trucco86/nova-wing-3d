import * as T from 'three';

// Low-draw-call, non-interactive ambient traffic in the middle and far
// planes. Every sector has its own palette, silhouette and traffic rhythm.
// Simulated game time is the ONLY animation clock: pause/replay are stable.
const PROFILES = Object.freeze([
  { name: 'earth-evacuation', color: '#66e5ff', hazard: '#ffd46b', motif: 'aircraft' },
  { name: 'mars-survey', color: '#f7b078', hazard: '#92cfff', motif: 'survey' },
  { name: 'asteroid-conveyors', color: '#a6c6d7', hazard: '#fbb76b', motif: 'industrial' },
  { name: 'devastador-service-traffic', color: '#65d9ff', hazard: '#ff9954', motif: 'industrial' },
  { name: 'solar-corona-craft', color: '#ffe69a', hazard: '#ff895d', motif: 'aircraft' },
  { name: 'ice-research-craft', color: '#9edfff', hazard: '#c8bbff', motif: 'survey' },
  { name: 'hydra-spore-swarm', color: '#c3ffa2', hazard: '#ff97c6', motif: 'organic' },
  { name: 'dreadnought-escorts', color: '#ffae83', hazard: '#8ddfff', motif: 'aircraft' },
  { name: 'orion-gravity-probes', color: '#b49dff', hazard: '#ffbd88', motif: 'survey' },
  { name: 'marvin-fortress-patrol', color: '#ff7c89', hazard: '#a6b8ff', motif: 'industrial' },
]);

export function livingDepthProfile(sectorIndex) {
  return PROFILES[Math.max(0, Math.min(PROFILES.length - 1, Math.floor(sectorIndex) || 0))];
}

export function createLivingDepth(sectorIndex = 0) {
  const profile = livingDepthProfile(sectorIndex);
  const root = new T.Group();
  root.name = 'living-depth-' + profile.name;
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  root.userData.sectorIndex = sectorIndex;
  root.userData.profile = profile.name;
  const chassis = new T.BoxGeometry(1, 1, 1);
  const fins = new T.ConeGeometry(1, 2.6, 3);
  const body = new T.MeshStandardMaterial({
    color: profile.color, roughness: 0.35, metalness: 0.78,
  });
  const lights = new T.MeshBasicMaterial({ color: profile.hazard, toneMapped: false });
  const lanes = [];
  for (const [layer, count, depth, spread] of [
    ['middle', 12, 230, 98],
    ['distant', 28, 550, 170],
  ]) {
    const group = new T.Group();
    group.name = 'depth-' + layer + '-' + profile.motif;
    group.userData.visualOnly = true;
    const frames = new T.InstancedMesh(chassis, body, count);
    frames.name = 'ambient-' + layer + '-vehicle-bodies';
    frames.frustumCulled = false;
    frames.userData.visualOnly = true;
    const detail = new T.InstancedMesh(fins, lights, count);
    detail.name = 'ambient-' + layer + '-beacons';
    detail.frustumCulled = false;
    detail.userData.visualOnly = true;
    group.add(frames, detail);
    root.add(group);
    lanes.push({ layer, count, depth, spread, frames, detail });
  }
  root.userData.lanes = lanes;
  root.userData.materials = [body, lights];
  root.userData.geometries = [chassis, fins];
  root.userData.quality = 'high';
  root.userData.animated = true;
  updateLivingDepth(root, 0);
  return root;
}

export function updateLivingDepth(root, seconds = 0) {
  if (!root) return;
  const t = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const profile = livingDepthProfile(root.userData.sectorIndex);
  const dummy = new T.Object3D();
  for (const lane of root.userData.lanes) {
    const high = root.userData.quality === 'high';
    const active = high ? lane.count : Math.ceil(lane.count * 0.5);
    lane.frames.count = lane.detail.count = active;
    for (let i = 0; i < active; i++) {
      const direction = i % 2 ? 1 : -1;
      const speed = lane.layer === 'middle' ? 10.5 + i % 4 : 3.6 + i % 3;
      const phase = i * 2.399 + root.userData.sectorIndex * 0.8;
      const loop = ((t * speed + i * 53) % 730) / 730;
      const x = direction * (25 + (i % 4) * (lane.spread / 9)) +
        Math.sin(t * 0.31 + phase) * (lane.layer === 'middle' ? 22 : 13);
      const y = lane.layer === 'middle'
        ? 22 + (i % 3) * 11 + Math.sin(t * 0.65 + phase) * 6
        : 58 + (i % 5) * 22 + Math.sin(t * 0.19 + phase) * 12;
      const z = -lane.depth - loop * (lane.layer === 'middle' ? 240 : 430);
      dummy.position.set(x, y, z);
      dummy.rotation.set(
        Math.sin(t * 0.13 + phase) * 0.09,
        direction * (profile.motif === 'industrial' ? 0.3 : 0.17),
        Math.sin(t * 0.42 + phase) * 0.25,
      );
      const size = lane.layer === 'middle' ? 1.8 : 1.25;
      // Different mechanical sizes, same maximum draw-call budget in each scene.
      dummy.scale.set(
        size * (profile.motif === 'industrial' ? 8 : 6),
        size * (profile.motif === 'organic' ? 2.3 : 1.5),
        size * (profile.motif === 'survey' ? 3 : 5),
      );
      dummy.updateMatrix();
      lane.frames.setMatrixAt(i, dummy.matrix);
      dummy.position.y -= size * 2;
      dummy.scale.set(size * 0.9, size * 1.2, size * 0.9);
      dummy.rotation.x = Math.PI / 2;
      dummy.updateMatrix();
      lane.detail.setMatrixAt(i, dummy.matrix);
    }
    lane.frames.instanceMatrix.needsUpdate = true;
    lane.detail.instanceMatrix.needsUpdate = true;
  }
  root.userData.lastTime = t;
}

export function setLivingDepthQuality(root, quality) {
  if (!root) return;
  root.userData.quality = quality === 'medium' ? 'medium' : 'high';
  updateLivingDepth(root, root.userData.lastTime ?? 0);
}
