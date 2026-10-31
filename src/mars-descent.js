import * as T from 'three';

// The inverse of Earth's first-stage ascent: space -> Mars orbit -> atmospheric
// entry -> controlled descent -> surface combat. Authored, deterministic and
// pause-safe: only elapsed mission seconds change the state.
export const MARS_TOUCHDOWN_SECONDS = 27;
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export function marsDescentAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid Mars mission time');
  const phase =
    seconds < 6
      ? 'space'
      : seconds < 13
        ? 'orbit'
        : seconds < 20
          ? 'entry'
          : seconds < MARS_TOUCHDOWN_SECONDS
            ? 'descent'
            : 'surface';
  const orbit = smooth((seconds - 6) / 7);
  const entry = smooth((seconds - 13) / 7);
  const surface = smooth((seconds - 16) / 11);
  const atmosphere = clamp((seconds - 12) / 4) * (1 - smooth((seconds - 21) / 6));
  const planetFade = 1 - smooth((seconds - 20) / 7);
  return {
    phase,
    progress: clamp(seconds / MARS_TOUCHDOWN_SECONDS),
    planetScale: 0.83 + orbit * 1.4 + entry * 2.6,
    planetOpacity: planetFade,
    atmosphere,
    terrainVisible: seconds >= 16,
    terrainReveal: surface,
    terrainLift: surface >= 1 ? 0 : -340 * (1 - surface),
    skyMix: surface,
    starOpacity: 0.75 * (1 - smooth((seconds - 13) / 10)),
    cameraAscent: seconds >= 13 && seconds < 27 ? -0.38 * atmosphere : 0,
    combatReady: seconds >= MARS_TOUCHDOWN_SECONDS,
    label: {
      space: 'MARTE À VISTA · APROXIMAÇÃO ESPACIAL',
      orbit: 'ÓRBITA DE MARTE · INICIANDO DESCIDA',
      entry: 'REENTRADA · ATMOSFERA MARCIANA',
      descent: 'DESCIDA CONTROLADA · DESERTO À FRENTE',
      surface: 'SUPERFÍCIE DE MARTE · DESERTO VERMELHO',
    }[phase],
  };
}

export function createMarsApproach() {
  const root = new T.Group();
  root.name = 'mars-orbital-approach';
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  const planet = new T.Mesh(
    new T.SphereGeometry(210, 64, 48),
    new T.ShaderMaterial({
      uniforms: { alpha: { value: 1 } },
      transparent: true,
      depthWrite: false,
      vertexShader:
        'varying vec3 surface;varying vec3 normalDir;void main(){surface=position;normalDir=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec3 surface;varying vec3 normalDir;uniform float alpha;
      float hash(vec3 p){return fract(sin(dot(p,vec3(17.13,61.37,39.19)))*43758.5453);}
      float terrain(vec3 p){return sin(p.x*0.036)*sin(p.y*0.04+p.z*0.018)*0.23+
        sin(p.x*0.12+p.z*0.055)*sin(p.y*0.14)*0.1+hash(floor(p*0.08))*0.12;}
      void main(){
        vec3 n=normalize(normalDir);
        vec3 p=surface;
        float grain=terrain(p);
        float basin=smoothstep(-.30,.13,grain);
        vec3 dark=vec3(.34,.105,.061);
        vec3 bright=vec3(.76,.35,.18);
        vec3 albedo=mix(dark,bright,basin);
        float pole=smoothstep(.80,.96,abs(n.y));
        albedo=mix(albedo,vec3(.77,.68,.58),pole*.7);
        float crater=abs(sin(length(p.xz)*.022+grain*18.));
        albedo*=1.-.13*smoothstep(.91,1.,crater);
        float day=max(.14,dot(n,normalize(vec3(-.52,.38,.72))));
        gl_FragColor=vec4(albedo*(.20+day*.95),alpha);
      }`,
    }),
  );
  planet.name = 'mars-orbit-visible-planet';
  planet.position.set(0, 75, -900);
  root.add(planet);
  const edge = new T.Mesh(
    new T.SphereGeometry(215, 48, 32),
    new T.ShaderMaterial({
      uniforms: { alpha: { value: 0.8 } },
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader:
        'varying vec3 n;varying vec3 viewDir;void main(){n=normalize(normalMatrix*normal);vec4 pos=modelViewMatrix*vec4(position,1.);viewDir=normalize(-pos.xyz);gl_Position=projectionMatrix*pos;}',
      fragmentShader:
        'varying vec3 n;varying vec3 viewDir;uniform float alpha;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(viewDir))),3.);gl_FragColor=vec4(.9,.39,.12,alpha*rim*.95);}',
    }),
  );
  edge.name = 'mars-orbit-atmospheric-rim';
  planet.add(edge);
  // Replace the old thin cylinders ("screen scratches") with an even,
  // diffuse bow-shock halo. Wide circular glow reads as atmospheric heating
  // without opaque streaks across the ship, aiming area or horizon.
  const shock = new T.Group();
  shock.name = 'mars-atmosphere-bow-shock';
  shock.userData.visualOnly = true;
  const material = new T.MeshBasicMaterial({
    color: '#ffc18a',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    blending: T.AdditiveBlending,
    toneMapped: false,
  });
  for (let i = 0; i < 2; i++) {
    const halo = new T.Mesh(new T.TorusGeometry(50 + i * 20, 8 + i * 4, 12, 64), material.clone());
    halo.name = 'mars-reentry-soft-plasma-halo-' + i;
    halo.position.set(0, 7, -135 - i * 20);
    halo.scale.set(1.3, 0.77, 1);
    shock.add(halo);
  }
  root.add(shock);
  updateMarsApproach(root, marsDescentAt(0));
  return root;
}
export function updateMarsApproach(root, state) {
  const globe = root.getObjectByName('mars-orbit-visible-planet');
  const shock = root.getObjectByName('mars-atmosphere-bow-shock');
  globe.visible = state.planetOpacity > 0.005;
  globe.scale.setScalar(state.planetScale);
  globe.material.uniforms.alpha.value = state.planetOpacity;
  globe.children[0].material.uniforms.alpha.value = state.planetOpacity;
  shock.visible = state.atmosphere > 0.1;
  shock.children.forEach((halo, i) => {
    halo.material.opacity = (i === 0 ? 0.15 : 0.075) * state.atmosphere;
    halo.scale.set(1.3 + state.atmosphere * 0.1, 0.77 + state.atmosphere * 0.06, 1);
  });
}
