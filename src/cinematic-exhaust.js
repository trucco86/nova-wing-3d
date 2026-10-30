import * as T from 'three';

// Hero exhaust uses six low-cost GPU billboards/cones; no physics and no
// per-frame allocations. Legacy boost remains the authoritative mechanic.
const TEX_SIZE = 64;
const pixels = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);
for (let y = 0; y < TEX_SIZE; y++)
  for (let x = 0; x < TEX_SIZE; x++) {
    const r = Math.hypot((x - 31.5) / 32, (y - 31.5) / 32);
    const intensity = Math.max(0, Math.exp(-r * r * 7) - 0.012);
    const offset = (y * TEX_SIZE + x) * 4;
    pixels[offset] = 235;
    pixels[offset + 1] = 245;
    pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.round(intensity * 255);
  }
const plumeTexture = new T.DataTexture(pixels, TEX_SIZE, TEX_SIZE);
plumeTexture.name = 'nova-boost-glow-map';
plumeTexture.needsUpdate = true;
plumeTexture.magFilter = T.LinearFilter;
plumeTexture.minFilter = T.LinearMipmapLinearFilter;
plumeTexture.generateMipmaps = true;

export function createCinematicExhaust(mode = 'fighter') {
  if (mode !== 'fighter' && mode !== 'mecha')
    throw new TypeError('Cinematic exhaust requires fighter or mecha');
  const group = new T.Group();
  group.name = 'cinematic-' + mode + '-exhaust';
  group.visible = false;
  group.userData.visualOnly = true;
  const units = [];
  const height = mode === 'mecha' ? 2.4 : -0.14;
  const nozzleZ = mode === 'mecha' ? 2.55 : 2.58;
  const spread = mode === 'mecha' ? 1.42 : 1.2;
  for (const side of [-1, 1]) {
    const core = new T.Mesh(
      new T.ConeGeometry(0.26, mode === 'mecha' ? 2.1 : 2.8, 12, 1, true),
      new T.MeshBasicMaterial({
        color: '#d9ffff',
        transparent: true,
        opacity: 0.75,
        side: T.DoubleSide,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    core.name = 'cinematic-exhaust-hot-core';
    core.rotation.x = Math.PI / 2;
    core.position.set(side * spread, height, nozzleZ + 1.3);
    group.add(core);
    const flame = new T.Mesh(
      new T.ConeGeometry(0.68, mode === 'mecha' ? 3.4 : 4.1, 14, 1, true),
      new T.MeshBasicMaterial({
        color: mode === 'mecha' ? '#55cfff' : '#45f4e1',
        transparent: true,
        opacity: 0.34,
        side: T.DoubleSide,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    flame.name = 'cinematic-exhaust-envelope';
    flame.rotation.x = Math.PI / 2;
    flame.position.set(side * spread, height, nozzleZ + 2.1);
    group.add(flame);
    const aura = new T.Sprite(
      new T.SpriteMaterial({
        map: plumeTexture,
        color: mode === 'mecha' ? '#7dbaff' : '#49f7eb',
        opacity: 0.6,
        transparent: true,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    aura.name = 'cinematic-exhaust-bloom';
    aura.position.set(side * spread, height, nozzleZ + 0.75);
    aura.scale.set(2.1, 2.1, 1);
    group.add(aura);
    units.push({ core, flame, aura });
  }
  group.userData.units = units;
  group.userData.mode = mode;
  return group;
}

export function animateCinematicExhaust(root, time, boosting, quality) {
  const rig =
    root?.getObjectByName('cinematic-fighter-exhaust') ??
    root?.getObjectByName('cinematic-mecha-exhaust');
  if (!rig) return false;
  if (quality !== 'high') {
    rig.visible = false;
    return false;
  }
  rig.visible = true;
  const pulse = 1 + Math.sin((Number.isFinite(time) ? time : 0) * 28) * 0.07;
  const power = boosting ? 1 : 0.26;
  for (const { core, flame, aura } of rig.userData.units) {
    core.scale.y = (0.58 + power * 1.4) * pulse;
    flame.scale.y = (0.42 + power * 1.9) * pulse;
    core.material.opacity = 0.5 + power * 0.42;
    flame.material.opacity = 0.15 + power * 0.42;
    aura.material.opacity = 0.24 + power * 0.65;
    const glow = 1.1 + power * 2.2;
    aura.scale.set(glow, glow, 1);
  }
  return true;
}
