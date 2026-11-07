import * as T from 'three';
import { advertisingTexture } from './city-32-living.js';

// Concept-driven urban depth: tall overlapping districts, illuminated
// skybridges, glass facades and prominent adverts. Every repeated detail uses
// instancing; the center flight corridor stays free of physical structures.
const unit = new T.BoxGeometry(1, 1, 1);
const dummy = new T.Object3D();
function instance(mesh, index, x, y, z, w, h, d) {
  dummy.position.set(x, y, z);
  dummy.rotation.set(0, 0, 0);
  dummy.scale.set(w, h, d);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}
const architecture = () =>
  new T.MeshStandardMaterial({
    color: '#667f97',
    metalness: 0.78,
    roughness: 0.29,
  });
const glass = () =>
  new T.MeshStandardMaterial({
    color: '#274b70',
    metalness: 0.62,
    roughness: 0.18,
  });
const accent = (color) =>
  new T.MeshBasicMaterial({
    color,
    toneMapped: false,
  });
function finish(mesh, used, host) {
  mesh.count = used;
  mesh.instanceMatrix.needsUpdate = true;
  host.add(mesh);
}
export function createCity34Concept() {
  const root = new T.Group();
  root.name = 'city34-concept-skyline';
  root.userData.visualOnly = true;
  const high = new T.Group();
  high.name = 'city34-concept-high-detail';
  const towers = new T.InstancedMesh(unit, architecture(), 48);
  towers.name = 'city34-deep-architectural-towers';
  const glazing = new T.InstancedMesh(unit, glass(), 45);
  glazing.name = 'city34-tower-glazing';
  const crowns = new T.InstancedMesh(unit, accent('#58dfff'), 60);
  crowns.name = 'city34-elevated-crown-lights';
  const warmLights = new T.InstancedMesh(unit, accent('#ffbd77'), 310);
  warmLights.name = 'city34-facade-amber-rooms';
  const coolLights = new T.InstancedMesh(unit, accent('#7cdeff'), 470);
  coolLights.name = 'city34-facade-cyan-rooms';
  const bridges = new T.InstancedMesh(unit, architecture(), 30);
  bridges.name = 'city34-multilevel-skybridges';
  const bridgeLights = new T.InstancedMesh(unit, accent('#4ef5df'), 36);
  bridgeLights.name = 'city34-bridge-wayfinding-lights';
  let n = 0,
    g = 0,
    c = 0,
    w = 0,
    b = 0,
    bl = 0,
    cl = 0;
  const towersPlan = [];
  for (const side of [-1, 1])
    for (let tier = 0; tier < 3; tier++)
      for (let i = 0; i < 7; i++) {
        const x = side * (84 + tier * 52 + i * 14);
        const z = -370 - tier * 208 - i * 58 - (i % 3) * 11;
        const h = 93 + tier * 25 + ((i * 17 + tier * 19) % 6) * 20;
        const width = 13 + ((i + tier) % 3) * 5;
        towersPlan.push({ x, z, h, width });
        instance(towers, n++, x, h / 2 - 7, z, width, h, 23 + tier * 4);
        instance(glazing, g++, x, h / 2 - 6, z + 12.3 + tier * 2, width * 0.81, h * 0.78, 0.7);
        instance(crowns, c++, x, h - 5, z, width * 0.83, 1.7, 25);
        for (let level = 1; level <= 6; level++) {
          const y = -4 + (level * h) / 7;
          const lit = (i + level) % 3;
          if (lit === 0) {
            if (w < warmLights.count)
              instance(warmLights, w++, x, y, z + 13.4 + tier * 2, width * 0.65, 0.65, 0.14);
          } else if (cl < coolLights.count) {
            instance(coolLights, cl++, x, y, z + 13.4 + tier * 2, width * 0.7, 0.47, 0.14);
          }
        }
      }
  // Three distinct elevated connections, above any ship flight path.
  for (const [i, z] of [-520, -700, -920].entries()) {
    const y = 93 + i * 23;
    instance(bridges, b++, 0, y, z, 198 + i * 43, 5.5, 17);
    instance(bridges, b++, 0, y + 9, z, 186 + i * 43, 2.5, 15);
    instance(bridgeLights, bl++, 0, y - 2.3, z + 8.9, 194 + i * 43, 0.67, 0.75);
    for (const side of [-1, 1]) {
      instance(bridges, b++, side * (95 + i * 20), y - 31, z, 6, 63, 12);
      instance(bridgeLights, bl++, side * (95 + i * 20), y - 4, z + 6.1, 1.1, 57, 0.55);
    }
  }
  finish(towers, n, root);
  finish(glazing, g, root);
  finish(crowns, c, root);
  finish(bridges, b, root);
  finish(bridgeLights, bl, root);
  finish(warmLights, w, high);
  finish(coolLights, cl, high);
  // Advertising towers reinforce the specific concept composition; no
  // dynamic textures or lights are created while the player flies past.
  for (const [brand, tagline, color, x, z] of [
    ['NOVA WING', 'MAIS LONGE SEMPRE', '#58e9ff', -92, -520],
    ['AERORAIL', 'CONECTA CIDADES', '#ffca77', 92, -690],
    ['ORBITAL', 'UM AMANHA MAIS ALTO', '#8dc7ff', -166, -835],
  ]) {
    const billboard = new T.Group();
    billboard.name = 'city34-concept-ad-' + brand.toLowerCase().replaceAll(' ', '-');
    const frame = new T.Mesh(
      new T.BoxGeometry(24, 36, 1.6),
      new T.MeshStandardMaterial({ color: '#304d66', metalness: 0.8, roughness: 0.24 }),
    );
    const face = new T.Mesh(
      new T.PlaneGeometry(22.6, 34.6),
      new T.MeshBasicMaterial({
        map: advertisingTexture(brand, tagline, color),
        side: T.DoubleSide,
        toneMapped: false,
      }),
    );
    face.position.z = 0.86;
    billboard.add(frame, face);
    billboard.position.set(x, 86, z);
    root.add(billboard);
  }
  root.add(high);
  root.userData.architecture = towersPlan;
  setCity34ConceptQuality(root, 'medium');
  return root;
}
export function setCity34ConceptQuality(root, quality) {
  if (!root) return;
  root.getObjectByName('city34-concept-high-detail').visible = quality === 'high';
}
