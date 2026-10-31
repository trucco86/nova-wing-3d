import * as T from 'three';

// The inverse of Earth's first-stage ascent: space -> Mars orbit -> atmospheric
// entry -> controlled descent -> surface combat. Authored, deterministic and
// pause-safe: only elapsed mission seconds change the state.
export const MARS_TOUCHDOWN_SECONDS = 27;
const clamp = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => { const t = clamp(v); return t * t * (3 - 2 * t); };
export function marsDescentAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid Mars mission time');
  const phase = seconds < 6 ? 'space' : seconds < 13 ? 'orbit'
    : seconds < 20 ? 'entry' : seconds < MARS_TOUCHDOWN_SECONDS ? 'descent' : 'surface';
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
    terrainLift: -340 * (1 - surface),
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
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'varying vec3 n;varying vec3 viewDir;void main(){n=normalize(normalMatrix*normal);vec4 pos=modelViewMatrix*vec4(position,1.);viewDir=normalize(-pos.xyz);gl_Position=projectionMatrix*pos;}',
      fragmentShader: 'varying vec3 n;varying vec3 viewDir;uniform float alpha;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(viewDir))),3.);gl_FragColor=vec4(.9,.39,.12,alpha*rim*.95);}',
    }),
  );
  edge.name = 'mars-orbit-atmospheric-rim';
  planet.add(edge);
  const streaks = new T.Group();
  streaks.name = 'mars-atmosphere-heat-streaks';
  streaks.userData.visualOnly = true;
  const streakGeometry = new T.CylinderGeometry(0.28, 0.95, 1, 5);
  const streakMaterial = new T.MeshBasicMaterial({
    color: '#ffc27f', transparent: true, opacity: 0.65,
    depthWrite: false, blending: T.AdditiveBlending, toneMapped: false,
  });
  const bolts = new T.InstancedMesh(streakGeometry, streakMaterial, 34);
  bolts.name = 'mars-atmosphere-ionized-trails';
  bolts.frustumCulled = false;
  const dummy = new T.Object3D();
  for (let i = 0; i < bolts.count; i++) {
    const a = i * Math.PI * (3 - Math.sqrt(5));
    const radius = 18 + (i % 6) * 15;
    dummy.position.set(Math.cos(a) * radius, Math.sin(a) * radius, -120 - i * 3);
    dummy.rotation.set(-0.35, i * 0.3, 0.35 + Math.sin(a) * 0.22);
    dummy.scale.set(0.6 + i % 3 * 0.3, 23 + i % 4 * 9, 0.8);
    dummy.updateMatrix();
    bolts.setMatrixAt(i, dummy.matrix);
  }
  bolts.instanceMatrix.needsUpdate = true;
  streaks.add(bolts);
  root.add(streaks);
  updateMarsApproach(root, marsDescentAt(0));
  return root;
}
export function updateMarsApproach(root, state) {
  const globe = root.getObjectByName('mars-orbit-visible-planet');
  const streaks = root.getObjectByName('mars-atmosphere-heat-streaks');
  globe.visible = state.planetOpacity > 0.005;
  globe.scale.setScalar(state.planetScale);
  globe.material.uniforms.alpha.value = state.planetOpacity;
  globe.children[0].material.uniforms.alpha.value = state.planetOpacity;
  streaks.visible = state.atmosphere > 0.06;
  streaks.getObjectByName('mars-atmosphere-ionized-trails').material.opacity =
    0.65 * state.atmosphere;
}
