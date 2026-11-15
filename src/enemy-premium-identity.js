import * as T from 'three';

// One additional instanced draw per enemy instead of dozens of meshes.
// These are cosmetic only: existing collision, hardpoints and hitboxes own gameplay.
const SHARED_BOX = new T.BoxGeometry(1, 1, 1);
const SHARED_ARMOR = new T.MeshStandardMaterial({
  color: '#ffffff',
  metalness: 0.84,
  roughness: 0.28,
});
const pivot = new T.Object3D();
const paint = (x, y, z, w, h, d, color, yaw = 0, bank = 0) => ({
  x,
  y,
  z,
  w,
  h,
  d,
  color,
  yaw,
  bank,
});

function fighterPlates(variant) {
  const config = ((variant % 3) + 3) % 3;
  const color = ['#fa6862', '#5dd5ff', '#cda4ff'][config];
  const frame = ['#88494e', '#3b899e', '#756493'][config];
  const parts = [];
  for (const side of [-1, 1]) {
    if (config === 0) {
      // Pursuer: sharp interceptor nose, swept vanes and paired raised intakes.
      parts.push(
        paint(side * 0.58, 0.42, -2.75, 0.26, 0.28, 2.5, frame, side * 0.17),
        paint(side * 2.55, 0.38, 0.1, 2.5, 0.1, 0.34, color, side * 0.28),
        paint(side * 1.65, 0.93, 1.4, 0.28, 1.15, 1.6, frame, 0, side * 0.15),
        paint(side * 3.25, 0.15, -0.65, 0.42, 0.13, 1.5, color),
        paint(side * 1.18, 0.23, -1.95, 0.31, 0.12, 0.9, color),
      );
    } else if (config === 1) {
      // Interceptor: slimmer external pods, heat-sink lines and dorsal fins.
      parts.push(
        paint(side * 1.65, -0.22, -1.05, 0.57, 0.46, 3.9, frame, side * 0.08),
        paint(side * 1.65, -0.46, -1.2, 0.22, 0.13, 3.4, color),
        paint(side * 2.9, 0.24, 0.7, 1.1, 0.14, 0.4, color, side * 0.3),
        paint(side * 0.9, 0.65, 1.4, 0.2, 0.76, 1.45, frame),
        paint(side * 2.35, 0.51, -0.6, 0.35, 0.14, 1.9, color),
      );
    } else {
      // Bomber: wide armor cheeks and visible twin weapon pods under the wings.
      parts.push(
        paint(side * 1.1, 0.24, -0.2, 1.2, 0.65, 2.7, frame, side * 0.13),
        paint(side * 3.1, -0.67, -1.5, 0.74, 0.73, 3.1, frame),
        paint(side * 3.1, -1.05, -2.65, 0.3, 0.24, 1.0, color),
        paint(side * 2.6, 0.27, 0.7, 1.6, 0.17, 0.4, color, side * 0.08),
        paint(side * 0.82, 0.73, 1.15, 0.5, 0.52, 2.0, frame),
        paint(side * 4.35, 0.22, 1.4, 0.45, 0.35, 1.5, color),
      );
    }
  }
  return parts;
}

function tankPlates(variant) {
  const config = ((variant % 3) + 3) % 3;
  const color = ['#ff875c', '#58c9d7', '#f0ad54'][config];
  const parts = [];
  for (const side of [-1, 1]) {
    parts.push(
      paint(side * 5.7, 4.2, 3.1, 1.35, 0.36, 7.5, '#344f61'),
      paint(side * 4.0, 5.2, -1.0, 2.1, 0.29, 4.0, color, side * 0.18),
    );
    if (config === 0) {
      parts.push(
        paint(side * 5.3, 4.5, 5.4, 2.7, 2.1, 1.8, '#aa7d65', side * 0.22),
        paint(side * 3.1, 8.5, 1.8, 0.55, 1.2, 2.7, color),
      );
    } else if (config === 1) {
      parts.push(
        paint(side * 3.0, 8.6, -0.5, 0.6, 0.7, 5.8, '#688c96'),
        paint(side * 3.0, 8.9, 3.5, 0.42, 0.36, 1.7, color),
      );
    } else {
      parts.push(
        paint(side * 4.2, 7.7, -2.0, 2.6, 1.2, 4.7, '#766b55'),
        paint(side * 4.2, 8.45, -1.5, 0.5, 0.33, 4.8, color),
      );
    }
  }
  return parts;
}

function walkerPlates(variant) {
  const config = ((variant % 3) + 3) % 3;
  const color = ['#ff7265', '#74dfff', '#d29aff'][config];
  const parts = [];
  for (const side of [-1, 1]) {
    parts.push(
      paint(side * 8.4, 21.2, 3.4, 2.7, 1.6, 0.45, '#52677c', 0, side * 0.2),
      paint(side * 8.4, 21.65, 3.85, 2.1, 0.2, 0.36, color),
      paint(side * 6.2, 10.4, 4.4, 1.2, 2.3, 0.52, '#8b929a'),
    );
    if (config === 0) {
      parts.push(
        paint(side * 10.4, 18.5, 4.8, 1.3, 3.7, 0.55, color),
        paint(side * 3.1, 26.7, 1.6, 0.7, 1.8, 2.4, '#777e88'),
      );
    } else if (config === 1) {
      parts.push(
        paint(side * 12, 16.2, 4.8, 3.1, 4.1, 0.45, '#689dae', 0, side * 0.14),
        paint(side * 12, 16.2, 5.15, 2.4, 0.25, 0.25, color),
      );
    } else {
      parts.push(
        paint(side * 9.8, 19.6, -1.7, 1.3, 2.3, 4.8, '#7b6b91'),
        paint(side * 9.8, 20.5, 1.5, 0.6, 0.55, 4.0, color),
      );
    }
  }
  return parts;
}

export function enemyIdentityPlates(kind, variant = 0) {
  if (!Number.isInteger(variant)) throw new TypeError('Enemy variant must be integer');
  if (kind === 'fighter') return fighterPlates(variant);
  if (kind === 'tank') return tankPlates(variant);
  if (kind === 'walker') return walkerPlates(variant);
  throw new RangeError('Unsupported enemy identity kind');
}

export function createEnemyIdentityDetail(kind, variant = 0) {
  const parts = enemyIdentityPlates(kind, variant);
  const mesh = new T.InstancedMesh(SHARED_BOX, SHARED_ARMOR, parts.length);
  mesh.name = `premium-${kind}-identity-variant-${((variant % 3) + 3) % 3}`;
  mesh.userData.visualOnly = true;
  mesh.userData.enemyIdentity = { kind, variant: ((variant % 3) + 3) % 3 };
  for (const [i, part] of parts.entries()) {
    pivot.position.set(part.x, part.y, part.z);
    pivot.rotation.set(0, part.yaw, part.bank);
    pivot.scale.set(part.w, part.h, part.d);
    pivot.updateMatrix();
    mesh.setMatrixAt(i, pivot.matrix);
    mesh.setColorAt(i, new T.Color(part.color));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}
