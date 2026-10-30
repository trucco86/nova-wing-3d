import * as T from 'three';

// Deterministic 32-by-32 tangent-space micro-normal texture generated once.
// No remote download, external assets or canvas API required.
let brushedMetalNormal = null;
export function createBrushedMetalNormalMap() {
  if (brushedMetalNormal) return brushedMetalNormal;
  const size = 32;
  const texels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = Math.sin(x * 1.9 + Math.sin(y * 0.25) * 0.3) * 0.14;
      const ny = Math.cos(y * 0.7 + Math.cos(x * 0.47) * 0.5) * 0.07;
      const len = Math.hypot(nx, ny, 1);
      const pos = (y * size + x) * 4;
      texels[pos] = Math.round((nx / len * 0.5 + 0.5) * 255);
      texels[pos + 1] = Math.round((ny / len * 0.5 + 0.5) * 255);
      texels[pos + 2] = Math.round((1 / len * 0.5 + 0.5) * 255);
      texels[pos + 3] = 255;
    }
  }
  const texture = new T.DataTexture(texels, size, size, T.RGBAFormat);
  texture.name = 'premium-brushed-metal-normal';
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(3, 5);
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  brushedMetalNormal = texture;
  return texture;
}
