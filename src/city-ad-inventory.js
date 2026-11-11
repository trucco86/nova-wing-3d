import * as T from 'three';
import { CITY_AD_CREATIVES, planCityAdSlots } from './city-ad-slots.js';

const unit = new T.BoxGeometry(1, 1, 1);
const plane = new T.PlaneGeometry(1, 1);
const metal = new T.MeshPhysicalMaterial({
  color: '#d5e9ec',
  metalness: 0.83,
  roughness: 0.18,
  clearcoat: 0.7,
  clearcoatRoughness: 0.16,
});
const CREATIVE_COUNT = CITY_AD_CREATIVES.length;

function genericAdAtlas() {
  if (typeof document === 'undefined' || !document.createElement) {
    const colors = CITY_AD_CREATIVES.map(({ color }) => new T.Color(color));
    const data = new Uint8Array(
      colors.flatMap((c) => [
        Math.round(c.r * 255),
        Math.round(c.g * 255),
        Math.round(c.b * 255),
        255,
      ]),
    );
    const texture = new T.DataTexture(data, CREATIVE_COUNT, 1);
    texture.needsUpdate = true;
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  }
  const canvas = document.createElement('canvas');
  const width = 512;
  canvas.width = width * CREATIVE_COUNT;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const texture = new T.DataTexture(new Uint8Array([25, 66, 81, 255]), 1, 1);
    texture.needsUpdate = true;
    return texture;
  }
  for (let i = 0; i < CREATIVE_COUNT; i++) {
    const ad = CITY_AD_CREATIVES[i];
    const x = i * width;
    const gradient = ctx.createLinearGradient(x, 0, x + width, 512);
    gradient.addColorStop(0, '#0d2743');
    gradient.addColorStop(0.52, '#1b3157');
    gradient.addColorStop(1, '#2c203f');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, width, 512);
    ctx.fillStyle = ad.color;
    ctx.globalAlpha = 0.14;
    for (let j = 0; j < 7; j++) ctx.fillRect(x + 35 + j * 55, 75 + j * 43, 24, 310 - j * 24);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ad.color;
    ctx.lineWidth = 10;
    ctx.strokeRect(x + 19, 19, width - 38, 474);
    ctx.strokeStyle = '#b3ecfa';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 35, 35, width - 70, 442);
    ctx.textAlign = 'center';
    ctx.shadowColor = ad.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#f6fbff';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText(ad.name, x + width / 2, 255, width - 90);
    ctx.shadowBlur = 0;
    ctx.fillStyle = ad.color;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(ad.line, x + width / 2, 322, width - 90);
    ctx.fillStyle = '#b6cbda';
    ctx.font = '16px sans-serif';
    ctx.fillText('NOVA CITY  //  FUTURE MEDIA', x + width / 2, 439, width - 100);
  }
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 2;
  texture.wrapS = T.ClampToEdgeWrapping;
  texture.wrapT = T.ClampToEdgeWrapping;
  return texture;
}

// One WebGL draw call renders all fictional brands by selecting a tile in
// one atlas per instance. A normal material retains Three.js tone mapping,
// transparency controls and instanced transforms without custom GPU shaders
// allocated for every advertisement.
function atlasMaterial() {
  const material = new T.MeshBasicMaterial({
    map: genericAdAtlas(),
    side: T.DoubleSide,
    toneMapped: false,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float adCreativeIndex;\nvarying float vAdCreativeIndex;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvAdCreativeIndex = adCreativeIndex;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAdCreativeIndex;')
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
           vec2 atlasUV = vMapUv;
           atlasUV.x = (atlasUV.x * 0.96 + 0.02 + vAdCreativeIndex) / float(${CREATIVE_COUNT});
           vec4 sampleAd = texture2D(map, atlasUV);
           diffuseColor *= sampleAd;
         #endif`,
      );
  };
  material.customProgramCacheKey = () => 'nova-city-ad-atlas-v1-' + CREATIVE_COUNT;
  return material;
}

function batch(root, name, geometry, material, shapes, creativeIndices = null) {
  if (!shapes.length) return null;
  const geom = creativeIndices ? geometry.clone() : geometry;
  if (creativeIndices)
    geom.setAttribute(
      'adCreativeIndex',
      new T.InstancedBufferAttribute(new Float32Array(creativeIndices), 1),
    );
  const mesh = new T.InstancedMesh(geom, material, shapes.length);
  mesh.name = name;
  mesh.userData.visualOnly = true;
  mesh.frustumCulled = false;
  const transform = new T.Object3D();
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    transform.position.set(shape.x, shape.y, shape.z);
    transform.rotation.set(0, 0, 0);
    transform.scale.set(shape.w, shape.h, shape.depth ?? 1);
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
    if (shape.color) mesh.setColorAt(i, new T.Color(shape.color));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  root.add(mesh);
  return mesh;
}

function existingAdHosts(tile, buildings) {
  tile.updateMatrixWorld(true);
  const inverse = tile.matrixWorld.clone().invert();
  const taken = new Set();
  const p = new T.Vector3();
  tile.traverse((node) => {
    if (
      !/^(city32-sign-\d+|city32-hologram-\d+|city33-building-campaign-\d+|city32-district-.*-billboard)$/.test(
        node.name,
      )
    )
      return;
    node.getWorldPosition(p).applyMatrix4(inverse);
    for (let i = 0; i < buildings.length; i++) {
      const building = buildings[i];
      if (Math.abs(building.x - p.x) < 0.4 && Math.abs(building.z + building.depth / 2 - p.z) < 3.5)
        taken.add(i);
    }
  });
  return [...taken];
}

export function createCityAdInventory(tile, variant = 'civic') {
  const root = new T.Group();
  root.name = 'city-premium-ad-inventory';
  root.userData.visualOnly = true;
  root.userData.variant = variant;
  const buildings = tile.userData.buildingFootprints;
  const district = tile.getObjectByName('city-architectural-districts');
  const slots = planCityAdSlots(buildings, {
    variant,
    excludedHosts: existingAdHosts(tile, buildings),
    districtBuildings: [
      ...district.userData.towerFootprints,
      ...district.userData.platformFootprints,
    ],
  });
  const metalParts = [];
  const panels = [];
  const creativeIndices = [];
  for (const slot of slots) {
    panels.push(slot.panel);
    creativeIndices.push(
      CITY_AD_CREATIVES.findIndex((creative) => creative.id === slot.creativeId),
    );
    const b = buildings[slot.hostIndex];
    metalParts.push({
      x: slot.x,
      y: slot.y,
      z: slot.z - 0.36,
      w: slot.w + 1.05,
      h: slot.h + 1.05,
      depth: 0.55,
    });
    for (const support of slot.supports) metalParts.push(support);
    if (slot.kind !== 'roof') {
      for (const side of [-1, 1])
        metalParts.push({
          x: slot.x + side * slot.w * 0.42,
          y: slot.y,
          z: b.z + b.depth / 2 + 1.0,
          w: 0.34,
          h: 0.34,
          depth: 2,
        });
    }
    // Structural metal rails on both sides frame a luminous texture; no
    // additional neon draw call is introduced in Medium or High.
    for (const side of [-1, 1])
      metalParts.push({
        x: slot.x,
        y: slot.y + side * (slot.h / 2 + 0.34),
        z: slot.z + 0.1,
        w: slot.w + 0.48,
        h: 0.25,
        depth: 0.3,
      });
  }
  batch(root, 'city-ad-grounded-metal-frames-and-mounts', unit, metal, metalParts);
  batch(root, 'city-ad-atlas-generic-artwork', plane, atlasMaterial(), panels, creativeIndices);
  root.userData.slots = slots.map((slot) => ({
    id: slot.id,
    type: slot.kind,
    creative: slot.creativeId,
    hostIndex: slot.hostIndex,
    surface: slot.surface,
    x: slot.x,
    y: slot.y,
    z: slot.z,
    width: slot.w,
    height: slot.h,
  }));
  root.userData.total = slots.length;
  root.userData.counts = Object.fromEntries(
    ['facade', 'roof', 'banner'].map((type) => [
      type,
      slots.filter((slot) => slot.kind === type).length,
    ]),
  );
  // All QA creative is fictitious and local; no ad server or user tracking.
  tile.add(root);
  return root;
}
