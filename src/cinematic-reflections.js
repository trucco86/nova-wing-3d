import * as T from 'three';

/**
 * Small deterministic studio-style equirectangular light field. It is used for
 * PBR reflections, NOT as a skybox or a screenshot. The map provides distinct
 * cool overhead softboxes and warm lateral accents to preserve metal curvature.
 *
 * A single 256x128 RGBA texture is reused across sessions. Three.js converts
 * equirectangular environments into prefiltered reflections on demand.
 */
let texture = null;
export function getCinematicReflectionTexture() {
  if (texture) return texture;
  const width = 256, height = 128;
  const bytes = new Uint8Array(width * height * 4);
  const softbox = (x, y, cx, cy, rx, ry) => {
    const dx = Math.min(Math.abs(x - cx), 1 - Math.abs(x - cx)) / rx;
    const dy = Math.abs(y - cy) / ry;
    // Broad area lights give stable highlights on rough metallic surfaces.
    return Math.exp(-1.8 * (dx ** 4 + dy ** 4));
  };
  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const horizon = Math.exp(-((v - 0.52) / 0.13) ** 2);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const overhead = softbox(u, v, 0.26, 0.25, 0.14, 0.10);
      const rear = softbox(u, v, 0.75, 0.31, 0.11, 0.13);
      const strip = softbox(u, v, 0.48, 0.55, 0.014, 0.19);
      const low = softbox(u, v, 0.02, 0.67, 0.14, 0.10);
      const sky = v < 0.5 ? (0.5 - v) * 0.11 : 0;
      const levels = [
        0.022 + 0.014 * horizon + 0.065 * sky + 0.57 * overhead + 0.50 * rear + 0.33 * strip + 0.19 * low,
        0.044 + 0.025 * horizon + 0.11 * sky + 0.72 * overhead + 0.32 * rear + 0.46 * strip + 0.10 * low,
        0.083 + 0.041 * horizon + 0.16 * sky + 0.9 * overhead + 0.19 * rear + 0.52 * strip + 0.055 * low,
      ];
      const offset = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        bytes[offset + c] = Math.round(Math.min(1, levels[c]) * 255);
      }
      bytes[offset + 3] = 255;
    }
  }
  texture = new T.DataTexture(bytes, width, height, T.RGBAFormat);
  texture.name = 'nova-wing-cinematic-reflection-studio';
  texture.mapping = T.EquirectangularReflectionMapping;
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Environment reflections are strictly visual, never gameplay state. */
export function setCinematicReflectionQuality(scene, quality) {
  if (quality === 'high') {
    scene.environment = getCinematicReflectionTexture();
    scene.environmentIntensity = 0.48;
  } else {
    scene.environment = null;
    scene.environmentIntensity = 1;
  }
}
