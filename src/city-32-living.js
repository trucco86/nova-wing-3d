import * as T from 'three';

// City 3.2: all content is fictional, visual-only and deterministic.
// Materials and textures are allocated once, never in the animation loop.
export const CITY32_ADS = Object.freeze([
  ['NOVA GRID', 'ENERGIA QUE MOVE MUNDOS', '#58f0ff'],
  ['CATRONICS', 'TECNOLOGIA FELINA', '#ff79d1'],
  ['ASTRO FUEL', 'MAIS LONGE A CADA SALTO', '#ffc47b'],
  ['GALAXY BYTE', 'CONECTADOS AO INFINITO', '#a8a1ff'],
  ['FIVE CATS ENERGY', 'PODER PARA DECOLAR', '#69ffd8'],
  ['SKYPORT', 'SEU DESTINO COMECA AQUI', '#75baff'],
  ['AERORAIL', 'CIDADES EM MOVIMENTO', '#f3a6ff'],
  ['COSMO LINK', 'O UNIVERSO E AGORA', '#66fff0'],
  ['QUANTUM MALL', 'COMPRE NO AMANHA', '#ff9e89'],
  ['NEO CORE', 'O FUTURO EM SUAS MAOS', '#b2ff7c'],
  ['ORBITAL PLAZA', 'UM MUNDO DE EXPERIENCIAS', '#ffe280'],
  ['NOVA MARKET', 'SEMPRE MAIS PERTO', '#ff85af'],
]);

const block = new T.BoxGeometry(1, 1, 1);
const plane = new T.PlaneGeometry(1, 1);
const skyBeam = new T.CylinderGeometry(0.3, 8, 145, 10, 1, true);
const neon = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
const frame = new T.MeshStandardMaterial({ color: '#587d91', metalness: 0.73, roughness: 0.28 });
const glass = new T.MeshPhysicalMaterial({ color: '#559bc7', metalness: 0.55, roughness: 0.24, transparent: true, opacity: 0.8 });
const beamMaterial = new T.MeshBasicMaterial({
  color: '#8ceaff', transparent: true, opacity: 0.12, side: T.DoubleSide,
  blending: T.AdditiveBlending, depthWrite: false, toneMapped: false,
});
const holoMaterial = new T.MeshBasicMaterial({
  color: '#66ffff', transparent: true, opacity: 0.18, depthWrite: false,
  side: T.DoubleSide, blending: T.AdditiveBlending, toneMapped: false,
});
const hull = new T.MeshStandardMaterial({ color: '#c5e5f0', metalness: 0.74, roughness: 0.24 });
const engine = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
const palette = ['#48eaff', '#ff80d4', '#ffa970', '#b694ff', '#70ffd3', '#ffe795'].map((c) => new T.Color(c));
const transform = new T.Object3D();
const textureCache = new Map();

function advertisingTexture(brand, subtitle, color) {
  if (textureCache.has(brand)) return textureCache.get(brand);
  let texture;
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 384, 512);
      grad.addColorStop(0, '#1c4776');
      grad.addColorStop(0.55, '#162746');
      grad.addColorStop(1, '#2b1646');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 384, 512);
      ctx.lineWidth = 10;
      ctx.strokeStyle = color;
      ctx.strokeRect(16, 16, 352, 480);
      for (let j = 0; j < 5; j++) {
        ctx.fillStyle = j % 2 ? '#344c82' : color;
        ctx.globalAlpha = j % 2 ? 0.35 : 0.12;
        ctx.fillRect(35 + j * 20, 45 + j * 25, 300 - j * 40, 9);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.fillRect(40, 180, 304, 10);
      ctx.fillRect(120, 270, 144, 8);
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#f5fdff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 35px sans-serif';
      ctx.fillText(brand, 192, 355, 330);
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(subtitle, 192, 401, 328);
      ctx.shadowBlur = 0;
      texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = 2;
    }
  }
  if (!texture) {
    texture = new T.DataTexture(new Uint8Array([80, 170, 215, 255]), 1, 1);
    texture.needsUpdate = true;
    texture.colorSpace = T.SRGBColorSpace;
  }
  textureCache.set(brand, texture);
  return texture;
}

function instanced(name, material, entries, parent) {
  const mesh = new T.InstancedMesh(block, material, entries.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    transform.position.set(e.x, e.y, e.z);
    transform.scale.set(e.w, e.h, e.d);
    transform.rotation.set(0, e.rot || 0, 0);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
    if (e.tint) mesh.setColorAt(i, new T.Color(e.tint));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

function facadeSigns(parent, buildings) {
  const signs = new T.Group();
  signs.name = 'city32-facade-advertisements';
  signs.userData.visualOnly = true;
  const accents = [];
  const shopfronts = [];
  let count = 0;
  // Anchored to actual building geometry: do not create floating signs.
  // At least one in each near-Z band, on alternating sides of the route.
  for (let i = 0; i < buildings.length && count < 28; i++) {
    if (i % 5 !== 0 && i % 7 !== 1) continue;
    const b = buildings[i];
    if (Math.abs(b.x) < 94 || b.h < 29) continue;
    const [brand, caption, color] = CITY32_ADS[(count * 5 + Math.floor(count / 3)) % CITY32_ADS.length];
    const panel = new T.Group();
    panel.name = 'city32-sign-' + count;
    panel.userData.brand = brand;
    panel.userData.visualOnly = true;
    // Front facade faces the chase camera (+Z). Some panels read vertically.
    const vertical = count % 3 === 0;
    const w = vertical ? Math.min(b.w * 0.84, 13) : Math.min(b.w * 0.95, 20);
    const h = vertical ? Math.min(b.h * 0.55, 33) : Math.min(b.h * 0.29, 19);
    const signY = -7 + b.h * (vertical ? 0.58 : 0.72);
    panel.position.set(b.x, signY, b.z + b.depth * 0.5 + 1.35);
    const panelMesh = new T.Mesh(
      plane,
      new T.MeshBasicMaterial({
        map: advertisingTexture(brand, caption, color), side: T.DoubleSide, toneMapped: false,
      }),
    );
    panelMesh.scale.set(w, h, 1);
    panelMesh.name = 'city32-advertisement-panel';
    panel.add(panelMesh);
    const trim = new T.Mesh(block, frame);
    trim.scale.set(w + 1.5, h + 1.6, 0.65);
    trim.position.z = -0.6;
    panel.add(trim);
    // In front of panel; chromatic border provides legibility in Medium.
    accents.push({x:b.x, y:signY + h / 2 + 0.7,z:panel.position.z+0.3,w:w+1.6,h:0.35,d:0.45,tint:color});
    accents.push({x:b.x, y:signY - h / 2 - 0.7,z:panel.position.z+0.3,w:w+1.6,h:0.35,d:0.45,tint:color});
    shopfronts.push({x:b.x,y:-1.3,z:b.z + b.depth/2+0.9,w:Math.min(b.w*0.83,15),h:2.3,d:0.35,tint:palette[count%palette.length]});
    signs.add(panel);
    count++;
  }
  instanced('city32-neon-billboard-frames', neon, accents, parent);
  instanced('city32-illuminated-shopfronts', neon, shopfronts, parent);
  parent.add(signs);
  parent.userData.ads = count;
}

function searchlightNetwork(parent) {
  const group = new T.Group();
  group.name = 'city32-sky-searchlights';
  group.userData.visualOnly = true;
  const beacons = [];
  for (let i = 0; i < 6; i++) {
    const tower = new T.Group();
    tower.name = 'city32-searchlight-' + i;
    tower.userData.index = i;
    const side = i % 2 ? 1 : -1;
    const z = -125 - i * 302;
    tower.position.set(side * (123 + i % 3 * 29), 85 + i % 3 * 19, z);
    const base = new T.Mesh(block, frame);
    base.scale.set(6, 2.1, 6);
    base.name = 'city32-searchlight-mount';
    tower.add(base);
    const pivot = new T.Group();
    pivot.name = 'city32-searchlight-pivot';
    const beam = new T.Mesh(skyBeam, beamMaterial);
    beam.position.y = 73;
    beam.name = 'city32-searchlight-beam';
    beam.userData.visualOnly = true;
    pivot.add(beam);
    const lamp = new T.Mesh(new T.SphereGeometry(2.2, 9, 7), engine);
    lamp.name = 'city32-searchlight-lamp';
    lamp.material = new T.MeshBasicMaterial({ color: palette[i % palette.length], toneMapped: false });
    pivot.add(lamp);
    tower.add(pivot);
    group.add(tower);
    beacons.push({x:tower.position.x,y:tower.position.y+4,z,w:3.3,h:1,d:3.3,tint:i%2 ? '#ff6482':'#9bdbff'});
  }
  instanced('city32-aviation-warning-beacons', neon, beacons, group);
  parent.add(group);
}

function aerialLanes(parent) {
  const air = new T.Group();
  air.name = 'city32-sky-traffic';
  air.userData.visualOnly = true;
  const count = 18;
  const vehicles = new T.InstancedMesh(new T.ConeGeometry(1.2, 4.4, 5), hull, count);
  vehicles.name = 'city32-civilian-aircraft';
  vehicles.frustumCulled = false;
  vehicles.userData.visualOnly = true;
  const lamps = new T.InstancedMesh(new T.SphereGeometry(0.9, 6, 4), engine, count);
  lamps.name = 'city32-aircraft-navigation-lights';
  lamps.frustumCulled = false;
  lamps.userData.visualOnly = true;
  for (let i=0;i<count;i++) lamps.setColorAt(i, palette[i%palette.length]);
  lamps.instanceColor.needsUpdate = true;
  air.add(vehicles, lamps);
  parent.add(air);
}

function holograms(parent) {
  const group = new T.Group();
  group.name = 'city32-holographic-signs';
  group.userData.visualOnly = true;
  for (let i=0;i<5;i++) {
    const sign = new T.Mesh(plane, holoMaterial);
    sign.name = 'city32-hologram-' + i;
    sign.userData.visualOnly = true;
    sign.userData.index = i;
    sign.position.set((i%2 ? 1:-1)*(145+i%3*18), 54+i%3*17,-245-i*290);
    sign.scale.set(21,25,1);
    group.add(sign);
  }
  parent.add(group);
}

export function createCity32Living(buildings = []) {
  const root = new T.Group();
  root.name = 'city32-living-metropolis';
  root.userData.visualOnly = true;
  root.userData.city32 = true;
  root.userData.phase = 0;
  facadeSigns(root, buildings);
  searchlightNetwork(root);
  aerialLanes(root);
  holograms(root);
  updateCity32Living(root, 0);
  setCity32Quality(root, 'medium');
  return root;
}

export function setCity32Quality(root, quality) {
  if (!root) return;
  const high = quality === 'high';
  const air = root.getObjectByName('city32-sky-traffic');
  if (air) for (const mesh of air.children) mesh.count = high ? 18 : 9;
  const beams = root.getObjectByName('city32-sky-searchlights');
  if (beams) for (const tower of beams.children) {
    if (!tower.isGroup) continue;
    tower.visible = high || tower.userData.index < 3;
  }
  const holo = root.getObjectByName('city32-holographic-signs');
  if (holo) holo.children.forEach((p, i) => { p.visible = high || i < 2; });
}

export function updateCity32Living(root, travel) {
  if (!root || !Number.isFinite(travel)) return;
  const phase = root.userData.phase || 0;
  const beams = root.getObjectByName('city32-sky-searchlights');
  if (beams) for (const tower of beams.children) {
    if (!tower.isGroup) continue;
    const p = tower.getObjectByName('city32-searchlight-pivot');
    if (!p) continue;
    p.rotation.z = Math.sin(travel * 0.005 + tower.userData.index * 1.7 + phase) * 0.24;
    p.rotation.x = Math.cos(travel * 0.004 + tower.userData.index + phase) * 0.18;
  }
  const air = root.getObjectByName('city32-sky-traffic');
  if (air) {
    const bodies = air.getObjectByName('city32-civilian-aircraft');
    const lamps = air.getObjectByName('city32-aircraft-navigation-lights');
    for (let i=0;i<18;i++){
      const side = i%2 ? 1:-1;
      const distance = (i*149 + travel*(0.17+i%4*0.052) + phase*130)%1870;
      const z = -45-distance;
      const x = side*(110+(i%5)*27+Math.sin(travel*0.003+i)*10);
      const y = 88+(i%5)*26+Math.sin(travel*0.007+i*0.8)*6;
      transform.position.set(x,y,z);
      transform.rotation.set(Math.PI/2,0,side*0.12*Math.sin(travel*0.004+i));
      transform.scale.set(2.3,2.1,4.2);
      transform.updateMatrix();
      bodies.setMatrixAt(i,transform.matrix);
      transform.position.set(x,y-2,z+3);
      transform.scale.setScalar(1.5+0.12*Math.sin(travel*0.025+i));
      transform.rotation.set(0,0,0);
      transform.updateMatrix();
      lamps.setMatrixAt(i,transform.matrix);
    }
    bodies.instanceMatrix.needsUpdate = true;
    lamps.instanceMatrix.needsUpdate = true;
  }
  const holo = root.getObjectByName('city32-holographic-signs');
  if(holo)holo.children.forEach((mesh,i)=>{
    mesh.rotation.y = Math.sin(travel*0.004+i)*0.12;
    mesh.scale.x = 19+2*Math.sin(travel*0.007+i);
  });
}
