import * as T from 'three';
import { DESTINATION_PROFILES, destinationArrivalAt, destinationExitAt } from './destination-arrival.js';

// Separate, low-draw-call celestial vista per world. Real rings are attached
// to Saturn itself; no unexplained hoop appears in the flight corridor.
const PLANET_VERT = 'varying vec3 vLocal;varying vec3 vNormal;void main(){vLocal=position;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const PLANET_FRAG = String.raw\`varying vec3 vLocal;varying vec3 vNormal;uniform vec3 darkTint;uniform vec3 lightTint;uniform float alpha;uniform float kind;
float noise3(vec3 v){return fract(sin(dot(floor(v),vec3(127.1,311.7,74.7)))*43758.5453);}
void main(){
 vec3 n=normalize(vLocal);
 float bands=sin(n.y*54.+sin(n.x*16.)*4.)*.5+.5;
 float cloud=sin(n.y*25.+sin(n.x*22.)*2.5+n.z*8.)*.5+.5;
 float grain=noise3(vLocal*.13)*.14;
 float surface=kind<.5 ? bands*.65+cloud*.35 :
 kind<1.5 ? cloud*.8+bands*.2 :
 kind<2.5 ? abs(sin(n.x*28.+n.z*24.))*.24+noise3(vLocal*.06)*.73 :
 kind<3.5 ? cloud*.42+bands*.58 :
 kind<4.5 ? bands*.72+cloud*.28 : cloud*.75+bands*.25;
 vec3 c=mix(darkTint,lightTint,clamp(surface+grain,0.,1.));
 if(kind>4.5 && kind<5.5) c=mix(vec3(.013,.022,.062),c,.28);
 float sun=max(.22,dot(n,normalize(vec3(-.45,.6,.8))));
 gl_FragColor=vec4(c*(.34+.77*sun),alpha);
}\`;
const RIM_FRAG = 'varying vec3 vNormal;uniform vec3 tint;uniform float alpha;void main(){float edge=pow(1.-abs(dot(normalize(vNormal),vec3(0.,0.,1.))),3.);gl_FragColor=vec4(tint,alpha*edge*.48);}';
const RIM_VERT = 'varying vec3 vNormal;void main(){vNormal=normalMatrix*normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const HAZE_FRAG = String.raw\`varying vec2 uvp;uniform float alpha;uniform float time;uniform vec3 tint;
float n2(vec2 p){return fract(sin(dot(floor(p),vec2(127.1,311.7)))*43758.5453);}
void main(){
 vec2 q=uvp*vec2(4.,3.)+vec2(time*.034,-time*.018);
 float diffuse=n2(q)*.45+n2(q*2.4)*.3+.3;
 float mask=smoothstep(0.,.18,uvp.x)*(1.-smoothstep(.8,1.,uvp.x))
 *smoothstep(0.,.2,uvp.y)*(1.-smoothstep(.8,1.,uvp.y));
 float center= .38+.62*smoothstep(.1,.9,abs(uvp.x-.5)*2.);
 gl_FragColor=vec4(tint,alpha*diffuse*mask*center);
}\`;

const tints = {
  station: 0,
  clouds: 1,
  ice: 2,
  storm: 3,
  rings: 4,
  void: 5,
  haze: 1,
};

export function createDestinationVista(index) {
  const profile = DESTINATION_PROFILES[index];
  if (!profile) return null;
  const root = new T.Group();
  root.name = 'destination-orbital-vista';
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  root.userData.destination = profile.location;
  const globe = new T.Mesh(
    new T.SphereGeometry(180, 48, 32),
    new T.ShaderMaterial({
      uniforms: {
        darkTint: { value: new T.Color(profile.colors[0]) },
        lightTint: { value: new T.Color(profile.colors[1]) },
        kind: { value: tints[profile.type] },
        alpha: { value: 1 },
      },
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      transparent: true,
      depthWrite: false,
      fog: false,
    }),
  );
  globe.name = 'destination-celestial-body';
  globe.position.set(0, 94, -920);
  globe.userData.visualOnly = true;
  root.add(globe);
  const rim = new T.Mesh(
    new T.SphereGeometry(186, 32, 24),
    new T.ShaderMaterial({
      uniforms: { tint: { value: new T.Color(profile.colors[2]) }, alpha: { value: 0.8 } },
      vertexShader: RIM_VERT,
      fragmentShader: RIM_FRAG,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      fog: false,
    }),
  );
  rim.name = 'destination-celestial-limb';
  rim.userData.visualOnly = true;
  globe.add(rim);

  if (profile.type === 'rings') {
    const rings = new T.Mesh(
      new T.RingGeometry(223, 344, 96, 7),
      new T.MeshBasicMaterial({
        color: '#d7be91',
        side: T.DoubleSide,
        transparent: true,
        opacity: 0.54,
        depthWrite: false,
        fog: false,
      }),
    );
    rings.name = 'saturn-planetary-ring-system';
    rings.rotation.set(1.19, 0.2, -0.12);
    rings.userData.visualOnly = true;
    globe.add(rings);
  }
  const mist = new T.Group();
  mist.name = 'destination-entry-mist';
  mist.userData.visualOnly = true;
  const plane = new T.PlaneGeometry(430, 170);
  for (let i = 0; i < 3; i++) {
    const cloud = new T.Mesh(
      plane,
      new T.ShaderMaterial({
        uniforms: {
          tint: { value: new T.Color(profile.haze) },
          alpha: { value: 0 },
          time: { value: 0 },
        },
        vertexShader: 'varying vec2 uvp;void main(){uvp=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: HAZE_FRAG,
        transparent: true,
        depthWrite: false,
        fog: false,
        side: T.DoubleSide,
      }),
    );
    cloud.name = 'destination-atmospheric-cloud-' + i;
    cloud.position.set((i-1)*18, -18+i*20, -95-i*32);
    cloud.userData.visualOnly = true;
    mist.add(cloud);
  }
  root.add(mist);
  updateDestinationVista(root, index, 0);
  return root;
}

export function updateDestinationVista(root, index, seconds) {
  const state = destinationArrivalAt(index, seconds);
  if (!state || !root) return state;
  const globe = root.getObjectByName('destination-celestial-body');
  const visible = state.globeOpacity > 0.01;
  globe.visible = visible;
  globe.scale.setScalar(state.globeScale);
  globe.position.x = state.keepGlobe ? -365 * state.reveal : 0;
  globe.position.y = 94 + state.reveal * 44;
  globe.material.uniforms.alpha.value = state.globeOpacity;
  globe.getObjectByName('destination-celestial-limb').material.uniforms.alpha.value = state.globeOpacity * 0.8;
  for (const child of root.getObjectByName('destination-entry-mist').children) {
    const i = Number(child.name.slice(-1));
    child.material.uniforms.alpha.value = state.haze * (0.3 + i * 0.05);
    child.material.uniforms.time.value = seconds + i * 13;
    child.position.x = (i-1)*18 + Math.sin(seconds*.32+i)*13;
  }
  root.userData.arrivalPhase = state.phase;
  return state;
}

// A single instanced particle cloud represents the post-boss acceleration.
// Coordinates are recomputed from mission time: pause and reset cannot drift.
export function createDestinationEscape(index) {
  const root = new T.Group();
  root.name = 'destination-escape';
  root.userData.fixedSky = true;
  root.userData.visualOnly = true;
  const count = 96, coords = new Float32Array(count * 3);
  const geom = new T.BufferGeometry();
  geom.setAttribute('position', new T.BufferAttribute(coords, 3));
  const color = index === 9 ? '#ffd4a2' : index === 1 ? '#e8c092' : '#7edbff';
  const streaks = new T.Points(geom, new T.PointsMaterial({
    color, size: 2.0, sizeAttenuation: true,
    opacity: 0, transparent: true, depthWrite: false, fog: false,
  }));
  streaks.name = 'escape-hyperspeed-particles';
  streaks.userData.visualOnly = true;
  streaks.frustumCulled = false;
  root.add(streaks);
  root.visible = false;
  return root;
}
export function updateDestinationEscape(root, index, seconds) {
  const state = destinationExitAt(index, seconds);
  if (!root) return state;
  root.visible = state.active;
  const particles = root.getObjectByName('escape-hyperspeed-particles');
  particles.material.opacity = state.progress * 0.79;
  const positions = particles.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const angle = i * 2.399963;
    const rad = 65 + (i % 13) * 7;
    const z = -300 + (((i * 37 + seconds * 230) % 360) + 360) % 360;
    positions.setXYZ(i, Math.cos(angle) * rad, Math.sin(angle) * rad + 8, z);
  }
  positions.needsUpdate = true;
  root.userData.escapeProgress = state.progress;
  return state;
}
