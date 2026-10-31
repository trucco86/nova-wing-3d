import * as T from 'three';

// City 2.5: premium, repeatable environment assets built without downloaded
// textures, collisions, network access or animation dependencies.
const darkMetal = (color, roughness = 0.37) =>
  new T.MeshStandardMaterial({ color, metalness: 0.79, roughness });
const illuminated = (color) =>
  new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(1.3) });
const unit = new T.BoxGeometry(1, 1, 1);
const railBody = darkMetal('#426474', 0.32);
const railTrim = darkMetal('#7696a1', 0.26);
const cyan = illuminated('#4fe0ed');
const amber = illuminated('#ffbf78');

function addBlock(parent, material, x, y, z, w, h, d) {
  const m = new T.Mesh(unit, material);
  m.position.set(x, y, z);
  m.scale.set(w, h, d);
  parent.add(m);
  return m;
}

function billboardTexture(brand, caption, color) {
  // Canvas text is generated at runtime and remains legible at several angles.
  // Node tests have no DOM, so use a valid 1-pixel GPU texture fallback.
  if (typeof document === 'undefined') {
    const t = new T.DataTexture(new Uint8Array([12, 38, 56, 255]), 1, 1);
    t.needsUpdate = true;
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallback = new T.DataTexture(new Uint8Array([12, 38, 56, 255]), 1, 1);
    fallback.needsUpdate = true;
    return fallback;
  }
  const backdrop = ctx.createLinearGradient(0, 0, 512, 768);
  backdrop.addColorStop(0, '#071323');
  backdrop.addColorStop(0.6, '#15354c');
  backdrop.addColorStop(1, '#030b1a');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, 512, 768);
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.strokeRect(17, 17, 478, 734);
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 9; i++) {
    ctx.strokeStyle = i % 2 ? '#ffffff' : color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 110 + i * 67);
    ctx.lineTo(482, 74 + i * 63);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Stylised orbital emblem and bold headline; copy is intentionally fictional.
  ctx.strokeStyle = color;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(256, 277, 120, -0.8, 4.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(105, 295);
  ctx.lineTo(409, 242);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.fillStyle = '#e5f9ff';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(brand, 256, 505, 466);
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.font = 'bold 27px sans-serif';
  ctx.fillText(caption, 256, 571, 460);
  ctx.fillStyle = '#e3f4fb';
  ctx.font = '20px sans-serif';
  ctx.fillText('CIDADE DAS MÁQUINAS', 256, 670, 448);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

export function createMaglevTrain(side) {
  const train = new T.Group();
  train.name = side < 0 ? 'city-maglev-west' : 'city-maglev-east';
  train.userData.role = 'maglev';
  train.userData.side = side;
  train.userData.highOnly = side < 0; // right-hand train is present in Medium.
  train.userData.visualOnly = true;
  const carriageShell = darkMetal('#b0c9d3', 0.24);
  const glass = darkMetal('#112e4b', 0.16);
  for (let car = 0; car < 3; car++) {
    const center = (car - 1) * 29.5;
    addBlock(train, carriageShell, 0, 0, center, 12.5, 5.8, 28.1);
    addBlock(train, glass, 0, 2.1, center, 11.2, 2.3, 26.3);
    addBlock(train, railTrim, 0, 3.55, center, 9.4, 0.85, 27.5);
    addBlock(train, cyan, 0, -2.05, center, 11.5, 0.34, 26.8);
    for (const flank of [-1, 1]) {
      addBlock(train, glass, flank * 6.28, 0.5, center, 0.25, 2.9, 25.7);
      addBlock(train, cyan, flank * 6.49, 2.15, center, 0.28, 0.3, 25.4);
      for (let pane = 0; pane < 4; pane++) {
        addBlock(train, railTrim, flank * 6.56, 0.65, center - 9.8 + pane * 6.5, 0.4, 3.2, 0.54);
      }
    }
    if (car !== 2) addBlock(train, railTrim, 0, -0.2, center + 14.4, 8, 3.3, 1.6);
  }
  // Prominent lit front and rear. The right-hand train approaches the camera.
  for (const end of [-1, 1]) {
    addBlock(train, glass, 0, 0.7, end * 44, 9.5, 3.2, 0.8);
    addBlock(train, end < 0 ? cyan : amber, 0, 2.65, end * 44.6, 9.3, 0.72, 0.35);
    addBlock(train, cyan, 0, -1.7, end * 44.6, 9, 0.42, 0.4);
  }
  train.position.set(side * 80, 36, side > 0 ? -225 : -700);
  return train;
}

export function createCityPremiumInfrastructure() {
  const g = new T.Group();
  g.name = 'city-premium-infrastructure';
  const high = new T.Group();
  high.name = 'city-premium-high-details';
  high.visible = false;

  const roadPlates = new T.InstancedMesh(unit, darkMetal('#182b3c', 0.33), 760);
  roadPlates.name = 'city-premium-road-plates';
  const roadGlow = new T.InstancedMesh(unit, cyan, 380);
  roadGlow.name = 'city-premium-road-lights';
  const trackSupports = new T.InstancedMesh(unit, railBody, 240);
  trackSupports.name = 'city-maglev-supports';
  const trackEdge = new T.InstancedMesh(unit, railTrim, 220);
  trackEdge.name = 'city-maglev-guideway-shell';
  const trackGlow = new T.InstancedMesh(unit, cyan, 220);
  trackGlow.name = 'city-maglev-guideway-lights';
  const roadFine = new T.InstancedMesh(unit, railTrim, 420);
  roadFine.name = 'city-premium-road-detail';
  const transform = new T.Object3D();
  const counts = { plates: 0, lights: 0, supports: 0, edges: 0, trackLight: 0, fine: 0 };
  function at(mesh, key, x, y, z, width, height, depth) {
    const n = counts[key]++;
    if (n >= mesh.instanceMatrix.count)
      throw new Error('Premium infrastructure exceeds GPU buffer');
    transform.position.set(x, y, z);
    transform.scale.set(width, height, depth);
    transform.updateMatrix();
    mesh.setMatrixAt(n, transform.matrix);
  }
  for (let segment = 0; segment < 95; segment++) {
    const z = -10 - segment * 20;
    for (let column = 0; column < 8; column++) {
      const x = (column - 3.5) * 9;
      at(roadPlates, 'plates', x, -6.88, z, 8.45, 0.13, 19.25);
      if ((column + segment) % 4 === 0) {
        const color = new T.Color(column % 3 === 0 ? '#213b50' : '#162939');
        roadPlates.setColorAt(counts.plates - 1, color);
      } else roadPlates.setColorAt(counts.plates - 1, new T.Color('#152431'));
      if ((column === 1 || column === 6) && segment % 2 === 0) {
        at(roadFine, 'fine', x, -6.76, z + 4, 4.2, 0.1, 0.35);
      }
    }
    for (const x of [-28, -11, 11, 28]) {
      at(roadGlow, 'lights', x, -6.72, z, 0.45, 0.06, 17.4);
    }
  }

  // Real elevated guideways: stable deck, underslung spine, dual side rails,
  // regularly spaced braces, lit markings and ground-supported piers.
  // Align exactly with the train's ±80 path and y=36 vertical placement.
  for (const side of [-1, 1]) {
    for (let segment = 0; segment < 45; segment++) {
      const z = -22 - segment * 42;
      const x = side * 80;
      at(trackEdge, 'edges', x, 32.65, z, 17, 1.4, 41.4);
      at(trackEdge, 'edges', x, 29.1, z, 7, 5.2, 41.4);
      at(trackGlow, 'trackLight', x - 8, 33.5, z, 0.65, 0.45, 40.8);
      at(trackGlow, 'trackLight', x + 8, 33.5, z, 0.65, 0.45, 40.8);
      if (segment % 3 === 0) {
        at(trackSupports, 'supports', x + side * 11, 11.1, z, 5.5, 37.0, 8.2);
        at(trackSupports, 'supports', x + side * 5.5, 29.8, z, 15.5, 3.1, 7.0);
        at(trackSupports, 'supports', x + side * 11, -5.6, z, 12, 2.8, 13.2);
      }
      if (segment % 2 === 0) at(roadFine, 'fine', x, 33.58, z, 12.2, 0.12, 0.55);
    }
  }
  for (const [mesh, key, parent] of [
    [roadPlates, 'plates', g],
    [roadGlow, 'lights', g],
    [trackSupports, 'supports', g],
    [trackEdge, 'edges', g],
    [trackGlow, 'trackLight', g],
    [roadFine, 'fine', high],
  ]) {
    mesh.count = counts[key];
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    parent.add(mesh);
  }

  // Screen faces the player along +Z. Large advertisements are legible without
  // inventing real-world brands, and remain on both visual quality presets.
  const ads = [
    ['AERORAIL', 'CONECTA CIDADES', '#69e8ff'],
    ['NOVA GRID', 'ENERGIA DO FUTURO', '#70d9ff'],
    ['SKYPORT', 'NOVOS HORIZONTES', '#ffc88a'],
    ['ORBITAL', 'ALÉM DA TERRA', '#b6a0ff'],
    ['NOVA WING', 'CINCO PILOTOS', '#78f7e7'],
    ['HYPERLINK', 'A PRÓXIMA ERA', '#ff9dc5'],
  ];
  const signs = new T.Group();
  signs.name = 'city-commercial-billboards';
  const frame = darkMetal('#476476', 0.3);
  for (let i = 0; i < ads.length; i++) {
    const side = i % 2 ? -1 : 1;
    const z = -140 - i * 295;
    const x = side * (108 + (i % 3) * 13);
    const sign = new T.Group();
    sign.name = 'city-billboard-' + ads[i][0].toLowerCase().replaceAll(' ', '-');
    const map = billboardTexture(...ads[i]);
    const screen = new T.Mesh(
      new T.PlaneGeometry(27, 43),
      new T.MeshBasicMaterial({ map, side: T.DoubleSide, toneMapped: false }),
    );
    screen.name = 'advertising-panel';
    sign.add(screen);
    addBlock(sign, frame, 0, 0, -0.8, 30, 46, 1.6);
    addBlock(sign, cyan, 0, 24, -0.2, 31, 0.6, 1.2);
    addBlock(sign, cyan, 0, -24, -0.2, 31, 0.6, 1.2);
    sign.position.set(x, 48 + (i % 3) * 14, z);
    signs.add(sign);
  }
  g.add(signs);
  high.add(new T.Mesh(new T.BoxGeometry(0.5, 0.5, 0.5), illuminated('#39bfd4'))); // tiny premium marker to keep high-only subgraph nonempty
  g.add(high);
  return g;
}
