import * as T from 'three';

// Curves are authored per environment, not applied as a universal sine wave.
// Windows are normalized to the sector duration; smooth edges avoid sudden bends.
const ROUTE_WINDOWS = {
  0: [{ from: 0.18, to: 0.48, direction: 0.7 }],
  1: [{ from: 0.3, to: 0.64, direction: -0.65 }],
  2: [], // Asteroid belt: read as a climb and obstacle field, not a city road.
  3: [{ from: 0.2, to: 0.49, direction: 0.5 }],
  4: [], // Plasma storm: straight corridor emphasizes hazards.
  5: [{ from: 0.27, to: 0.58, direction: -0.6 }],
  6: [{ from: 0.18, to: 0.43, direction: 0.55 }],
  7: [], // Fleet approach stays straight for clear targeting.
  8: [{ from: 0.28, to: 0.62, direction: -0.45 }],
  9: [], // Final approach to Marvin is direct.
};

const smooth = (value) => {
  const x = T.MathUtils.clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
};

function curveWindow(progress, { from, to, direction }) {
  const span = to - from;
  const edge = Math.min(0.11, span / 3);
  return direction * smooth((progress - from) / edge) * (1 - smooth((progress - to + edge) / edge));
}

export function routeAt(sector, seconds, duration, boss = false) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return { turn: 0, ascent: 0, bank: 0, label: 'ROTA DE APROXIMAÇÃO' };
  }
  const progress = T.MathUtils.clamp(seconds / duration, 0, 1);
  const turn = boss
    ? 0
    : (ROUTE_WINDOWS[sector] ?? []).reduce(
        (total, window) => total + curveWindow(progress, window),
        0,
      );
  // The city launch climbs progressively toward orbit, while the asteroid belt
  // keeps the existing orbital transition. Boss arenas remain level.
  const ascent = boss
    ? 0
    : sector === 0
      ? 1.15 * smooth((progress - 0.38) / 0.5)
      : sector === 2
        ? Math.sin(Math.PI * progress)
        : 0;
  return {
    turn,
    ascent,
    bank: turn === 0 ? 0 : -turn * 0.13,
    label:
      ascent > 0.35
        ? 'ASCENSÃO ORBITAL'
        : turn > 0.25
          ? 'CURVA À DIREITA'
          : turn < -0.25
            ? 'CURVA À ESQUERDA'
            : 'ROTA DE APROXIMAÇÃO',
  };
}
export function createRouteRenderer(scene, camera) {
  const bend = { value: new T.Vector2() };
  const originals = new Map();
  const copies = new Set();
  const declaration = 'uniform vec2 routeBend; uniform mat4 routeToWorld;\n';
  const deform = `vec4 routePoint = routeToWorld * mvPosition;
    float routeDepth = clamp(-routePoint.z, 0.0, 950.0);
    routePoint.xy += routeBend * routeDepth * routeDepth / (1.0 + routeDepth * 0.002);
    mvPosition = viewMatrix * routePoint;
    gl_Position = projectionMatrix * mvPosition;`;
  function prepare(material) {
    if (copies.has(material)) return material;
    if (originals.has(material)) return originals.get(material);
    const copy = material.clone();
    // Animation code may retain the original (finale) or write to the mesh (particles).
    // Keep both references on one opacity value.
    Object.defineProperty(copy, 'opacity', {
      enumerable: true,
      configurable: true,
      get: () => material.opacity,
      set: (value) => {
        material.opacity = value;
      },
    });
    if (material.color) copy.color = material.color;
    if (material.emissive) copy.emissive = material.emissive;
    if (material.uniforms) copy.uniforms = material.uniforms;
    copy.onBeforeCompile = (shader) => {
      shader.uniforms.routeBend = bend;
      shader.uniforms.routeToWorld = { value: camera.matrixWorld };
      shader.vertexShader = declaration + shader.vertexShader;
      if (shader.vertexShader.includes('#include <project_vertex>')) {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <project_vertex>',
          '#include <project_vertex>\n' + deform,
        );
      } else if (shader.vertexShader.includes('gl_Position = projectionMatrix * mvPosition;')) {
        shader.vertexShader = shader.vertexShader.replace(
          'gl_Position = projectionMatrix * mvPosition;',
          deform,
        );
      } else if (
        shader.vertexShader.includes('gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);')
      ) {
        shader.vertexShader = shader.vertexShader.replace(
          'gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);',
          'vec4 mvPosition = viewMatrix * vec4(w,1.);' + deform,
        );
      }
    };
    copy.customProgramCacheKey = () => 'nova-route-v1';
    originals.set(material, copy);
    copies.add(copy);
    return copy;
  }
  return {
    update(route) {
      bend.value.set(route.turn * 0.0012, route.ascent * 0.001);
    },
    prepare() {
      const active = new Set();
      scene.traverse((o) => {
        if (!o.material || o.userData.fixedSky) return;
        o.material = Array.isArray(o.material) ? o.material.map(prepare) : prepare(o.material);
        // Bending can bring a mesh from outside its original frustum into view.
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) active.add(m);
        o.frustumCulled = false;
      });
      for (const [original, copy] of originals) {
        if (!active.has(copy)) {
          copy.dispose();
          copies.delete(copy);
          originals.delete(original);
        }
      }
    },
    destroy() {
      copies.forEach((m) => m.dispose());
      originals.clear();
      copies.clear();
    },
  };
}
