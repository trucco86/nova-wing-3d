import * as T from 'three';

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
  size: 4.1,
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
  const storm = new T.Points(geometry, fogMat.clone());
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
        uniforms: { alpha: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        vertexShader:
          'varying vec2 uvCoords;void main(){uvCoords=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: `varying vec2 uvCoords;uniform float alpha;
        void main(){vec2 p=uvCoords*2.-1.;
        float haze=exp(-dot(p,p)*3.2)*(0.75+0.25*sin(p.x*12.+p.y*3.));
        gl_FragColor=vec4(.68,.35,.19,alpha*haze);}`,
      }),
    );
    bank.name = 'mars-rolling-sand-haze-bank-' + i;
    bank.position.set((i - 1) * 62, 8 + i * 5, -140 - i * 34);
    bank.rotation.z = i * 0.09;
    root.add(bank);
  }
  root.visible = false;
  return root;
}
export function updateMarsSandstorm(root, seconds) {
  const wind = marsSandstormAt(seconds);
  if (!root) return wind;
  root.visible = wind.active;
  const particles = root.getObjectByName('mars-sandstorm-particle-field');
  particles.material.opacity = wind.intensity * 0.88;
  // Visual drift and rolling banks follow the same deterministic wind clock.
  particles.position.x = Math.sin(seconds * 0.35) * 12 + wind.windX * 1.5;
  particles.position.z = ((seconds * 21) % 150) - 75;
  root.children.forEach((child, i) => {
    if (!child.name.startsWith('mars-rolling-sand-haze-bank')) return;
    child.material.uniforms.alpha.value = wind.intensity * (0.43 - (i - 1) * 0.04);
    child.position.x = (i - 2) * 62 + Math.sin(seconds * 0.32 + i) * 16;
  });
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
