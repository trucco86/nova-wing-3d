import * as T from 'three';

const stormCache = new WeakMap();
function stormParts(root) {
  let parts = stormCache.get(root);
  if (!parts) {
    parts = {
      particles: root.getObjectByName('mars-sandstorm-particle-field'),
      banks: root.children.filter((c) => c.name.startsWith('mars-rolling-sand-haze-bank')),
    };
    stormCache.set(root, parts);
  }
  return parts;
}

// A fair, forecastable, deterministic Martian crosswind encounter.
// The player can still steer against gusts; wind never teleports the ship.
export const MARS_STORM_START = 61;
export const MARS_STORM_END = 84;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export function marsSandstormAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid storm time');
  const prewarn = seconds >= MARS_STORM_START - 4 && seconds < MARS_STORM_START;
  const intensity =
    smooth((seconds - MARS_STORM_START) / 4) * (1 - smooth((seconds - (MARS_STORM_END - 5)) / 5));
  // Slow crosswind reversals with short gusts. Max < pilot acceleration.
  const prevailing = Math.sin((seconds - MARS_STORM_START) * 0.48 + 0.9);
  const gust = Math.sin(seconds * 1.71) * Math.sin(seconds * 0.31 + 1.7);
  const windX = intensity === 0 ? 0 : intensity * (11.4 * prevailing + 5.2 * gust);
  const sway = intensity * (0.18 * Math.sin(seconds * 1.17) + 0.075 * Math.sin(seconds * 3.3));
  return {
    phase: prewarn ? 'warning' : intensity > 0.02 ? 'active' : 'clear',
    warning: prewarn,
    active: intensity > 0.02,
    intensity,
    windX,
    roll: -windX * 0.022 + sway,
    visibility: 1 - intensity * 0.68,
    hazard: intensity > 0.65 && Math.abs(windX) >= 7,
    label: prewarn
      ? 'TEMPESTADE DE AREIA À FRENTE · PREPARE-SE'
      : intensity > 0.02
        ? 'TURBULÊNCIA MARCIANA · COMPENSE O VENTO'
        : '',
  };
}
const particleCount = 240;
const fogMat = new T.PointsMaterial({
  color: '#f0b178',
  size: 5.0,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  fog: false,
});
function sandParticles() {
  const buffer = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const a = Math.sin((i + 1) * 127.1) * 43758.5453;
    const b = Math.sin((i + 5) * 311.7) * 12753.177;
    const c = Math.sin((i + 13) * 74.7) * 65132.31;
    const fract = (v) => v - Math.floor(v);
    buffer[3 * i] = -105 + fract(a) * 210;
    buffer[3 * i + 1] = -14 + fract(b) * 77;
    buffer[3 * i + 2] = -190 + fract(c) * 160;
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(buffer, 3));
  const material = fogMat.clone();
  // QA150: PointsMaterial draws hard rectangular sprites without a map.
  // Fade each existing gl_PointCoord in the fragment shader; no texture,
  // geometry, materials, particles, or draw calls are added.
  material.onBeforeCompile = (shader) => {
    const chunk = '#include <map_particle_fragment>';
    if (!shader.fragmentShader.includes(chunk)) return;
    shader.fragmentShader = shader.fragmentShader.replace(
      chunk,
      `${chunk}
      float dustRadius = length(gl_PointCoord.xy - vec2(0.5));
      float dustFeather = 1.0 - smoothstep(0.10, 0.50, dustRadius);
      diffuseColor.a *= dustFeather;`,
    );
  };
  material.customProgramCacheKey = () => 'mars-sand-soft-point-v1';
  const storm = new T.Points(geometry, material);
  storm.name = 'mars-sandstorm-particle-field';
  storm.frustumCulled = false;
  storm.userData.visualOnly = true;
  return storm;
}
export function createMarsSandstorm() {
  const root = new T.Group();
  root.name = 'mars-sandstorm';
  root.userData.visualOnly = true;
  const particles = sandParticles();
  root.add(particles);
  // Broad low-contrast haze banks, not screen scratches or sharp lines.
  const bankGeometry = new T.PlaneGeometry(220, 62);
  for (let i = 0; i < 3; i++) {
    const bank = new T.Mesh(
      bankGeometry,
      new T.ShaderMaterial({
        uniforms: {
          alpha: { value: 0 },
          seconds: { value: 0 },
          wind: { value: 0 },
          seed: { value: i * 1.7 },
        },
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        vertexShader:
          'varying vec2 uvCoords;void main(){uvCoords=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: `varying vec2 uvCoords;
        uniform float alpha;uniform float seconds;uniform float wind;uniform float seed;
        void main(){
          vec2 p=uvCoords*2.-1.;
          // Three overlapping depth veils: ground dust, rolling clouds and
          // wind-sheared fine streaks. Fixed geometry and zero texture fetches.
          float drift=seconds*.23+wind*.017+seed;
          vec2 flow=vec2(p.x+drift+wind*.013*(.4-p.y),p.y);
          float broad=sin(flow.x*5.+sin(flow.y*4.4+drift*.4)*1.55);
          float wisps=sin(flow.x*11.2-flow.y*3.6+drift*.85)*.11;
          float eddies=sin(flow.y*7.1+sin(flow.x*3.9+drift*.6)*1.15)*.10;
          float ground=1.-smoothstep(-.66,.56,p.y);
          float density=clamp(.45+broad*.20+wisps+eddies+ground*.14,0.,1.);
          float envelope=exp(-dot(p*vec2(1.02,.78),p*vec2(1.02,.78))*2.2);
          float streak=smoothstep(.78,.98,sin(flow.x*28.-flow.y*8.5+drift*1.3));
          float veil=smoothstep(.23,.83,density);
          float opacity=clamp(envelope*(.25+veil*.55+streak*.10)*(.7+ground*.3),0.,.86);
          vec3 dust=mix(vec3(.39,.19,.11),vec3(.88,.59,.36),
            clamp(density*.75+ground*.14,0.,1.));
          gl_FragColor=vec4(dust,alpha*opacity);
        }`,
      }),
    );
    bank.name = 'mars-rolling-sand-haze-bank-' + i;
    bank.position.set((i - 1) * 62, 8 + i * 5, -140 - i * 34);
    bank.rotation.z = i * 0.09;
    root.add(bank);
  }
  root.visible = false;
  stormCache.set(root, { particles, banks: root.children.slice(1) });
  return root;
}
export function updateMarsSandstorm(root, seconds) {
  const wind = marsSandstormAt(seconds);
  if (!root) return wind;
  const wasVisible = root.visible;
  root.visible = wind.active;
  const { particles, banks } = stormParts(root);
  // Inactive storms stop updating invisible geometry and uniforms.
  if (!wind.active) {
    if (wasVisible) {
      particles.material.opacity = 0;
      for (const bank of banks) bank.material.uniforms.alpha.value = 0;
    }
    root.userData.intensity = wind.intensity;
    root.userData.windX = wind.windX;
    return wind;
  }
  particles.material.opacity = wind.intensity * 0.88;
  particles.position.x = Math.sin(seconds * 0.35) * 12 + wind.windX * 1.5;
  // Oscillation replaces the abrupt 150-unit modulo reset visible mid-storm.
  particles.position.z = -18 + Math.sin(seconds * 0.23) * 34;
  for (let i = 0; i < banks.length; i++) {
    const child = banks[i];
    const slot = i + 1; // Particle field is the first child.
    child.material.uniforms.alpha.value = wind.intensity * (0.53 - i * 0.055);
    child.material.uniforms.seconds.value = seconds;
    child.material.uniforms.wind.value = wind.windX;
    child.position.x = (slot - 2) * 62 + Math.sin(seconds * 0.32 + slot) * 16 + wind.windX * 0.7;
    child.position.y = 8 + i * 5 + Math.sin(seconds * 0.26 + slot * 1.4) * 3.5 * wind.intensity;
    child.rotation.z = i * 0.09 + wind.windX * 0.0035;
  }
  root.userData.intensity = wind.intensity;
  root.userData.windX = wind.windX;
  return wind;
}

/** In-world sand accumulation on the hull and cannon tips, not a HUD overlay. */
export function createMarsDustCoating() {
  const count = 84;
  const coords = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = (i * 37) % 83;
    const side = i % 2 ? 1 : -1;
    coords[i * 3] = side * (0.3 + (t % 21) * 0.25);
    coords[i * 3 + 1] = -0.2 + ((t * 7) % 11) * 0.15;
    coords[i * 3 + 2] = -5.4 + ((t * 3) % 73) * 0.13;
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(coords, 3));
  const material = new T.PointsMaterial({
    color: '#b9794b',
    size: 0.65,
    sizeAttenuation: true,
    opacity: 0,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const dust = new T.Points(geometry, material);
  dust.name = 'mars-hull-dust-coating';
  dust.userData.visualOnly = true;
  dust.frustumCulled = false;
  dust.visible = false;
  return dust;
}

export function setMarsDustCoating(dust, stormIntensity = 0, remainingRolls = 0) {
  if (!dust) return 0;
  const intensity = Math.max(
    Math.max(0, Math.min(1, stormIntensity)) * 0.72,
    Math.max(0, Math.min(3, remainingRolls)) / 3,
  );
  dust.material.opacity = intensity * 0.85;
  dust.visible = intensity > 0.025;
  return intensity;
}
