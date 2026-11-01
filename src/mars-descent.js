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
  const sandHaze = smooth((seconds - 12) / 3) * (1 - smooth((seconds - 24) / 7));
  return {
    phase,
    progress: clamp(seconds / MARS_TOUCHDOWN_SECONDS),
    planetScale: 0.83 + orbit * 1.4 + entry * 2.6,
    planetOpacity: planetFade,
    atmosphere,
    sandHaze,
    elapsedSeconds: seconds,
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
  // Soft, irregular drifting sand curtains: no torus, shock ring or scratch
  // pattern in the player's flight path. One low-cost plane per depth layer.
  const haze = new T.Group();
  haze.name = 'mars-atmospheric-sand-haze';
  haze.userData.visualOnly = true;
  const curtainGeometry = new T.PlaneGeometry(420, 160);
  for (let i = 0; i < 4; i++) {
    const curtain = new T.Mesh(
      curtainGeometry,
      new T.ShaderMaterial({
        uniforms: {
          alpha: { value: 0 },
          time: { value: 0 },
          seed: { value: i * 1.73 + 0.5 },
        },
        transparent: true,
        depthWrite: false,
        depthTest: true,
        fog: false,
        side: T.DoubleSide,
        vertexShader:
          'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'varying vec2 vUv;\nuniform float alpha;\nuniform float time;\nuniform float seed;\nfloat hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat noise2(vec2 p){\n  vec2 i=floor(p),f=fract(p);\n  vec2 u=f*f*(3.-2.*f);\n  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),\n             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);\n}\nvoid main(){\n  vec2 drift=vec2(time*.055+seed*.77,time*.022-seed*.41);\n  float fine=noise2(vUv*vec2(8.8,5.8)+drift);\n  float broad=noise2(vUv*vec2(3.2,2.0)+drift*.53);\n  float grain=mix(broad,fine,.32);\n  float ripples=sin(vUv.y*14.+sin(vUv.x*5.+time*.13+seed)*1.5+time*.09);\n  float edgeX=smoothstep(.01,.22,vUv.x)*(1.-smoothstep(.78,.99,vUv.x));\n  float edgeY=smoothstep(.01,.25,vUv.y)*(1.-smoothstep(.73,.99,vUv.y));\n  float centerSafe=mix(.36,1.,smoothstep(.15,.78,abs(vUv.x-.5)*2.));\n  float coverage=clamp(.3+grain*.85+ripples*.12,0.,1.);\n  vec3 ochre=mix(vec3(.60,.35,.20),vec3(.91,.68,.45),grain);\n  gl_FragColor=vec4(ochre,alpha*edgeX*edgeY*centerSafe*coverage);\n}',
      }),
    );
    curtain.name = 'mars-sand-haze-curtain-' + i;
    curtain.position.set((i - 1.5) * 12, -22 + i * 16, -88 - i * 38);
    curtain.rotation.z = (i - 1.5) * 0.025;
    curtain.userData.visualOnly = true;
    haze.add(curtain);
  }
  const particleCount = 180;
  const positions = new Float32Array(particleCount * 3);
  const fract = (n) => n - Math.floor(n);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (fract(Math.sin((i + 1) * 91.7) * 4317.7) - 0.5) * 300;
    positions[i * 3 + 1] = (fract(Math.sin((i + 3) * 37.1) * 1363.3) - 0.5) * 145;
    positions[i * 3 + 2] = -95 - fract(Math.sin((i + 7) * 73.7) * 9213.7) * 220;
  }
  const particlesGeo = new T.BufferGeometry();
  particlesGeo.setAttribute('position', new T.BufferAttribute(positions, 3));
  const particles = new T.Points(
    particlesGeo,
    new T.PointsMaterial({
      color: '#e7ac75',
      size: 1.4,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
      fog: false,
    }),
  );
  particles.name = 'mars-entry-floating-sand';
  particles.userData.visualOnly = true;
  particles.frustumCulled = false;
  haze.add(particles);
  root.add(haze);
  updateMarsApproach(root, marsDescentAt(0));
  return root;
}
export function updateMarsApproach(root, state) {
  const globe = root.getObjectByName('mars-orbit-visible-planet');
  const haze = root.getObjectByName('mars-atmospheric-sand-haze');
  globe.visible = state.planetOpacity > 0.005;
  globe.scale.setScalar(state.planetScale);
  globe.material.uniforms.alpha.value = state.planetOpacity;
  globe.children[0].material.uniforms.alpha.value = state.planetOpacity;
  haze.visible = state.sandHaze > 0.005;
  const seconds = state.elapsedSeconds;
  haze.children.forEach((child, i) => {
    if (child.isPoints) {
      child.material.opacity = state.sandHaze * 0.4;
      child.position.x = Math.sin(seconds * 0.57) * 11;
      child.position.y = Math.sin(seconds * 0.21) * 3;
      return;
    }
    child.material.uniforms.alpha.value = state.sandHaze * (0.24 + i * 0.025);
    child.material.uniforms.time.value = seconds;
    child.position.x = (i - 1.5) * 12 + Math.sin(seconds * 0.48 + i * 1.5) * 14;
    child.position.y = -22 + i * 16 + Math.sin(seconds * 0.23 + i) * 5;
  });
}
