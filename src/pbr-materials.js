import * as T from 'three';

// Small deterministic maps: a genuine PBR surface response without external
// artwork, network requests or additional draw calls. The material maps are
// reused by all three fighter variants and the mecha.
export const PBR_MAP_SIZE = 128;
const cached = new Map();
const wrap = (value, size) => ((value % size) + size) % size;
const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));
const noise = (x, y) => {
  let n = (Math.imul(x + 18719, 374761393) ^ Math.imul(y + 96731, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
};

function panelHeight(x, y, kind, size) {
  // Toroidal texture: opposite edges match, preserving repeating UVs.
  const seam = Math.min(x % 32, 31 - (x % 32), y % 32, 31 - (y % 32));
  const brushed = kind === 'titanium';
  const periodic = brushed
    ? Math.sin((y * Math.PI * 2) / 8) * 0.15
    : Math.sin((x * Math.PI * 2) / 16) * 0.09;
  const grain = (noise(x, y) - 0.5) * (brushed ? 0.17 : 0.13);
  const rivet = (x % 32 === 7 && y % 32 === 7) ? 0.42 : 0;
  const crease = seam < 2 ? -0.48 : 0;
  return periodic + grain + rivet + crease;
}

function texture(bytes, size, name) {
  const tex = new T.DataTexture(bytes, size, size, T.RGBAFormat);
  tex.name = name;
  tex.wrapS = T.RepeatWrapping;
  tex.wrapT = T.RepeatWrapping;
  tex.magFilter = T.LinearFilter;
  tex.minFilter = T.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export function createPbrSurfaceMaps(kind = 'armor', size = PBR_MAP_SIZE) {
  if (!['armor', 'titanium', 'ceramic'].includes(kind)) throw new TypeError('Unknown PBR finish');
  if (!Number.isInteger(size) || size < 32 || size > 256 || size % 32 !== 0)
    throw new RangeError('PBR map size must be 32–256 and divisible by 32');
  const key = kind + ':' + size;
  if (cached.has(key)) return cached.get(key);
  const normal = new Uint8Array(size * size * 4);
  const rough = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hx1 = panelHeight(wrap(x + 1, size), y, kind, size);
      const hx0 = panelHeight(wrap(x - 1, size), y, kind, size);
      const hy1 = panelHeight(x, wrap(y + 1, size), kind, size);
      const hy0 = panelHeight(x, wrap(y - 1, size), kind, size);
      const v = new T.Vector3((hx0 - hx1) * 0.17, (hy0 - hy1) * 0.17, 1).normalize();
      const i = (y * size + x) * 4;
      normal[i] = Math.round((v.x * 0.5 + 0.5) * 255);
      normal[i + 1] = Math.round((v.y * 0.5 + 0.5) * 255);
      normal[i + 2] = Math.round((v.z * 0.5 + 0.5) * 255);
      normal[i + 3] = 255;
      const seam = x % 32 < 2 || y % 32 < 2;
      const grain = noise(x + 71, y + 43);
      const finish = kind === 'ceramic' ? 0.84 : kind === 'titanium' ? 0.7 : 0.78;
      const r = Math.round(clamp((finish + (grain - 0.5) * 0.19 + (seam ? 0.13 : 0)) * 255, 0, 255));
      rough[i] = rough[i + 1] = rough[i + 2] = r;
      rough[i + 3] = 255;
    }
  }
  const maps = Object.freeze({
    normalMap: texture(normal, size, 'nova-pbr-normal-' + kind),
    roughnessMap: texture(rough, size, 'nova-pbr-rough-' + kind),
  });
  cached.set(key, maps);
  return maps;
}
