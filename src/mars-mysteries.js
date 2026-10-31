import * as T from 'three';

// Original science-fiction art inspired by real Martian pareidolia (Cydonia)
// and Olympus Mons. Alien architecture is explicitly a fictional game element.
const strata = new T.MeshStandardMaterial({
  color: '#ab6b4a', metalness: 0.01, roughness: 0.97, flatShading: true, fog: false,
});
const rusty = new T.MeshStandardMaterial({
  color: '#8d5643', metalness: 0.04, roughness: 0.93, flatShading: true,
});
const shadow = new T.MeshStandardMaterial({
  color: '#483b38', metalness: 0.01, roughness: 1, flatShading: true,
});
const alienMetal = new T.MeshStandardMaterial({
  color: '#655e59', roughness: 0.54, metalness: 0.7,
});
const alienGlow = new T.MeshBasicMaterial({ color: '#6bcfc5', toneMapped: false });
const cube = new T.BoxGeometry(1, 1, 1);
function slab(root, material, name, at, size) {
  const m = new T.Mesh(cube, material);
  m.name = name;
  m.position.set(...at);
  m.scale.set(...size);
  m.userData.visualOnly = true;
  root.add(m);
  return m;
}
function olympusMons() {
  const landmark = new T.Group();
  landmark.name = 'mars-olympus-mons-horizon';
  landmark.position.set(-240, -52, -1130);
  landmark.userData.fixedSky = true;
  landmark.userData.visualOnly = true;
  // Shield volcano: broad, very shallow slopes and a defined summit caldera.
  // Deliberately scaled for readability rather than a literal 22-km model.
  const rings = [
    [0, 126], [95, 133], [138, 144], [190, 128],
    [290, 107], [395, 72], [520, 38], [660, 3],
  ];
  const slices = 56;
  const verts = [], cols = [], indices = [];
  const shades = [new T.Color('#925842'), new T.Color('#bd7552'), new T.Color('#975946')];
  for (let ring = 0; ring < rings.length; ring++) {
    const [radius, height] = rings[ring];
    for (let i = 0; i < slices; i++) {
      const a = (i / slices) * Math.PI * 2;
      const noise = radius === 0 ? 0 : Math.sin(a * 11 + ring * 2) * radius * 0.012;
      verts.push(Math.cos(a) * (radius + noise), height +
        Math.sin(a * 7 + ring) * (ring < 2 ? 1 : 4), Math.sin(a) * (radius + noise) * 0.79);
      const color = shades[(ring + Math.floor(i / 8)) % 3];
      cols.push(color.r, color.g, color.b);
    }
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < slices; i++) {
      const a = r * slices + i, b = r * slices + (i + 1) % slices;
      indices.push(a, a + slices, b, b, a + slices, b + slices);
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mountain = new T.Mesh(geo, new T.MeshStandardMaterial({
    color: '#c18a67', vertexColors: true, roughness: 1,
    flatShading: true, metalness: 0, fog: false, side: T.DoubleSide,
  }));
  mountain.name = 'mars-olympus-shield-volcano';
  mountain.userData.visualOnly = true;
  landmark.add(mountain);
  const caldera = new T.Mesh(
    new T.CylinderGeometry(89, 89, 3, 50),
    new T.MeshStandardMaterial({ color: '#693d37', roughness: 1, fog: false }),
  );
  caldera.name = 'mars-olympus-summit-caldera';
  caldera.position.y = 132;
  caldera.userData.visualOnly = true;
  landmark.add(caldera);
  const rim = new T.Mesh(
    new T.TorusGeometry(96, 6, 8, 52), strata,
  );
  rim.name = 'mars-olympus-caldera-rim';
  rim.rotation.x = -Math.PI / 2;
  rim.scale.y = 0.79;
  rim.position.y = 145;
  landmark.add(rim);
  return landmark;
}
function faceRock(index, side, z) {
  const root = new T.Group();
  root.name = 'mars-cydonia-pareidolia-' + index;
  root.position.set(side * (77 + index * 16), -5, z);
  root.rotation.y = -side * 0.15;
  root.userData.marsChunk = true;
  root.userData.visualOnly = true;
  const head = new T.Mesh(new T.IcosahedronGeometry(12 + index * 2, 1), rusty);
  head.name = 'mars-face-eroded-head';
  head.position.set(0, 11, 0);
  head.scale.set(1.14, 1.28, 0.61);
  root.add(head);
  for (const x of [-5.1, 5.1]) {
    const eye = new T.Mesh(new T.IcosahedronGeometry(2.7, 1), shadow);
    eye.name = 'mars-face-shadowed-eye-cavity';
    eye.position.set(x, 15.5, 7.6);
    eye.scale.set(1.25, 0.57, 0.43);
    root.add(eye);
  }
  const nose = new T.Mesh(new T.ConeGeometry(2.2, 7, 5), strata);
  nose.name = 'mars-face-wind-carved-ridge';
  nose.position.set(0, 8.8, 8.5);
  nose.rotation.x = Math.PI;
  root.add(nose);
  slab(root, shadow, 'mars-face-mouth-erosion', [0, 4.3, 7.2], [9.5, 1.5, 1.4]);
  const ridge = new T.Mesh(new T.IcosahedronGeometry(13, 0), rusty);
  ridge.name = 'mars-face-natural-sedimentary-foundation';
  ridge.position.y = -6;
  ridge.scale.set(1.6, 0.5, 1.1);
  root.add(ridge);
  return root;
}
function alienRuins(index, side, z) {
  const group = new T.Group();
  group.name = 'mars-fictional-alien-ruins-' + index;
  group.position.set(side * (110 + index * 22), -8, z);
  group.userData.marsChunk = true;
  group.userData.visualOnly = true;
  const base = new T.Mesh(new T.CylinderGeometry(30, 36, 3.6, 8), rusty);
  base.name = 'mars-ancient-ruins-dusty-platform';
  base.position.y = 1;
  group.add(base);
  for (let k = -1; k <= 1; k++) {
    const block = slab(group, alienMetal, 'mars-ancient-extraterrestrial-monolith',
      [k * 15, 16 + (k === 0 ? 7 : 0), -4], [8, 30 + (k === 0 ? 14 : 0), 8]);
    block.rotation.y = (k + 2) * 0.17;
    slab(group, alienGlow, 'mars-ancient-glyph-light',
      [k * 15, 15 + (k === 0 ? 7 : 0), 0.6], [1, 12, 0.35]);
  }
  const arch = new T.Mesh(new T.TorusGeometry(18, 2.6, 7, 20, Math.PI), alienMetal);
  arch.name = 'mars-ancient-alien-half-arch';
  arch.position.set(0, 18, -2);
  group.add(arch);
  const marker = new T.Mesh(new T.OctahedronGeometry(3, 0), alienGlow);
  marker.name = 'mars-ancient-symbolic-orb';
  marker.position.set(0, 35, -2);
  group.add(marker);
  return group;
}
export function createMarsMysteries() {
  const root = new T.Group();
  root.name = 'mars-mysteries-and-olympus';
  root.userData.visualOnly = true;
  root.add(olympusMons());
  root.add(faceRock(0, -1, -470));
  root.add(faceRock(1, 1, -1030));
  root.add(faceRock(2, -1, -1510));
  root.add(alienRuins(0, 1, -720));
  root.add(alienRuins(1, -1, -1290));
  return root;
}
