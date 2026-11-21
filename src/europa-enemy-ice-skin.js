import * as T from 'three';

// Europa-only cosmetic identity. Two instanced draws per enemy, with NO
// changed AI, health, hitboxes, projectile sockets or collision geometry.
const frost = new T.MeshStandardMaterial({
  color: '#f4fbff',
  roughness: 0.37,
  metalness: 0.21,
  flatShading: true,
  emissive: '#82cce2',
  emissiveIntensity: 0.14,
});
const quartz = new T.MeshStandardMaterial({
  color: '#c0f4ff',
  roughness: 0.2,
  metalness: 0.08,
  flatShading: true,
  emissive: '#62c9ff',
  emissiveIntensity: 0.49,
});
const shellGeometry = new T.OctahedronGeometry(1, 0);
const spikeGeometry = new T.ConeGeometry(1, 1, 5);

function batch(name, geometry, material, locations) {
  const mesh = new T.InstancedMesh(geometry, material, locations.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  const p = new T.Object3D();
  locations.forEach((v, i) => {
    p.position.set(v.x, v.y, v.z);
    p.rotation.set(v.pitch ?? 0, v.yaw ?? 0, v.roll ?? 0);
    p.scale.set(v.w, v.h, v.d);
    p.updateMatrix();
    mesh.setMatrixAt(i, p.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

export function addEuropaEnemyIceSkin(enemy, { ground = false } = {}) {
  if (!enemy) return null;
  const scale = ground ? 2.5 : 1;
  const baseY = ground ? 6 : 0;
  const skin = new T.Group();
  skin.name = 'europa-white-ice-enemy-skin';
  skin.userData.visualOnly = true;
  const shell = [
    { x: 0, y: baseY + (ground ? 6 : 0.1), z: 0, w: 1.7 * scale, h: 0.6 * scale, d: 2.2 * scale },
    ...[-1, 1].flatMap((side) => [
      {
        x: side * scale * 1.7,
        y: baseY + 0.3,
        z: -0.5,
        w: 1.1 * scale,
        h: 0.4 * scale,
        d: 1.6 * scale,
      },
      {
        x: side * scale * 2.7,
        y: baseY + 0.2,
        z: 0.5,
        w: 0.85 * scale,
        h: 0.33 * scale,
        d: 1.3 * scale,
      },
    ]),
  ];
  const armor = batch('europa-white-ice-armor', shellGeometry, frost, shell);
  // White remains dominant, but restrained dark joints/outer wings prevent
  // drones from vanishing against pale ice. Instance tint adds NO draw calls.
  const shellTones = ['#ffffff', '#ecfbff', '#3f5c71', '#ecfbff', '#3f5c71'];
  for (let i = 0; i < shellTones.length; i++) armor.setColorAt(i, new T.Color(shellTones[i]));
  armor.instanceColor.needsUpdate = true;
  skin.add(armor);
  const spikes = Array.from({ length: 10 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    const row = Math.floor(i / 2);
    return {
      x: side * (1.1 + row * 0.43) * scale,
      y: baseY + 0.55 * scale + (row % 2) * 0.2 * scale,
      z: (row - 2) * 0.85 * scale,
      w: 0.19 * scale,
      h: (1.02 + (row % 3) * 0.4) * scale,
      d: 0.2 * scale,
      roll: side * 0.3,
    };
  });
  skin.add(batch('europa-crystal-ice-spines', spikeGeometry, quartz, spikes));
  enemy.add(skin);
  return skin;
}
