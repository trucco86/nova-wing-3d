import * as T from 'three';

// Logical collisions remain in rail coordinates. Every projected world vertex uses
// the same smooth bend, so ships, walls and projectiles follow the visible route.
export function routeAt(sector, seconds, duration, boss = false) {
  const smooth = (x) => {
    x = T.MathUtils.clamp(x, 0, 1);
    return x * x * (3 - 2 * x);
  };
  const envelope = smooth(seconds / 5) * (1 - smooth((seconds - duration + 12) / 10));
  const turn = boss || envelope === 0 ? 0 : Math.sin(seconds * 0.105 + sector * 0.8) * envelope;
  const ascent = boss
    ? 0
    : (sector === 2
        ? Math.sin(Math.PI * Math.min(seconds / duration, 1))
        : 0.22 * Math.sin(seconds * 0.09)) * envelope;
  return {
    turn,
    ascent,
    bank: -turn * 0.13,
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
