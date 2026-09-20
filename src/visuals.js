import * as T from 'three';
export const metal = (c, m = 0.65, r = 0.36) =>
  new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r });
export const glowMaterial = (c, k = 2.8) =>
  new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k) });
export function box(w, h, d, m, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  return o;
}
const steel = metal('#9eb5ca', 0.72),
  white = metal('#c4d5e3', 0.62),
  navy = metal('#15243e', 0.68),
  black = metal('#081725', 0.5),
  red = metal('#822d49', 0.65),
  copper = metal('#be9972', 0.8);
const mint = glowMaterial('#32ffc8'),
  cyan = glowMaterial('#59ddff'),
  pink = glowMaterial('#ff426e');
const glowData = new Uint8Array(64 * 64 * 4);
for (let y = 0; y < 64; y++)
  for (let x = 0; x < 64; x++) {
    let d = Math.hypot(x - 31.5, y - 31.5) / 32,
      i = (y * 64 + x) * 4;
    glowData[i] = glowData[i + 1] = glowData[i + 2] = 255;
    glowData[i + 3] = Math.round(Math.max(0, Math.exp(-d * d * 7) - 0.001) * 255);
  }
const glowMap = new T.DataTexture(glowData, 64, 64);
glowMap.needsUpdate = true;
const glowMats = new Map();
export function halo(color, size = 2, opacity = 0.7) {
  const key = color + ':' + opacity;
  let m = glowMats.get(key);
  if (!m) {
    m = new T.SpriteMaterial({
      map: glowMap,
      color,
      transparent: true,
      opacity,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    glowMats.set(key, m);
  }
  const s = new T.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}
function wing(points, m) {
  let shape = new T.Shape();
  points.forEach(([x, z], i) => (i ? shape.lineTo(x, z) : shape.moveTo(x, z)));
  shape.closePath();
  const g = new T.ExtrudeGeometry(shape, {
    depth: 0.17,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.07,
    bevelSegments: 1,
    steps: 1,
  });
  g.rotateX(Math.PI / 2);
  return new T.Mesh(g, m);
}
function line(points, color = '#4bf6d8') {
  return new T.Line(
    new T.BufferGeometry().setFromPoints(points.map((p) => new T.Vector3(...p))),
    new T.LineBasicMaterial({ color: new T.Color(color).multiplyScalar(2) }),
  );
}
const templates = {};
export function fighter(enemy = false) {
  if (!templates[enemy]) {
    const g = new T.Group(),
      armor = enemy ? red : white,
      accent = enemy ? black : navy,
      light = enemy ? pink : cyan;
    const hull = new T.Mesh(new T.CylinderGeometry(0.16, 0.78, 5.6, 6), armor);
    hull.rotation.x = -Math.PI / 2;
    hull.position.z = -0.9;
    g.add(hull);
    g.add(box(0.72, 0.45, 2.2, accent, 0, 0.38, 0.7));
    const nose = new T.Mesh(new T.ConeGeometry(0.46, 2.4, 4), armor);
    nose.rotation.x = -Math.PI / 2;
    nose.rotation.z = Math.PI / 4;
    nose.position.set(0, 0.14, -3.4);
    g.add(nose);
    const cockpit = new T.Mesh(
      new T.SphereGeometry(0.68, 24, 16),
      new T.MeshPhysicalMaterial({
        color: enemy ? '#ff637c' : '#37b2cc',
        metalness: 0.48,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        emissive: enemy ? '#430919' : '#062c3e',
        emissiveIntensity: 0.7,
      }),
    );
    cockpit.scale.set(0.68, 0.7, 1.5);
    cockpit.position.set(0, 0.57, -1.2);
    g.add(cockpit);
    g.add(
      line(
        [
          [0, 0.92, -1.8],
          [0, 1.03, -0.75],
          [0, 0.8, -0.2],
        ],
        enemy ? '#fa7992' : '#69d4ec',
      ),
    );
    for (let s of [-1, 1]) {
      const outer = enemy ? 3.5 : 4.3;
      const w = wing(
        [
          [s * 0.5, -1.5],
          [s * outer, 1.25],
          [s * (outer - 0.3), 2.1],
          [s * 1.15, 1.7],
        ],
        armor,
      );
      g.add(w);
      const panel = wing(
        [
          [s * 1.2, -0.4],
          [s * 3.65, 1.3],
          [s * 2.8, 1.5],
          [s * 1.25, 0.7],
        ],
        accent,
      );
      panel.position.y = 0.11;
      g.add(panel);
      g.add(
        line(
          [
            [s * 1.18, 0.2, -0.45],
            [s * 3.65, 0.2, 1.3],
            [s * 3.15, 0.2, 1.55],
          ],
          enemy ? '#ff6485' : '#4affd5',
        ),
      );
      for (let j = 0; j < 3; j++)
        g.add(box(0.3, 0.035, 0.55, black, s * (1.9 + j * 0.34), 0.2, 0.7 + j * 0.16));
      const fin = wing(
        [
          [0, -1.1],
          [0, 1.4],
          [1.65, 1.1],
          [0.7, -0.55],
        ],
        accent,
      );
      fin.rotation.z = s * 1.02;
      fin.position.set(s * 1.5, 0.15, 0.15);
      g.add(fin);
      const engine = new T.Mesh(new T.CylinderGeometry(0.42, 0.5, 2.5, 12), accent);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(s * 1.04, -0.13, 1.2);
      g.add(engine);
      for (let z of [0.4, 1.7, 2.3]) {
        const band = new T.Mesh(new T.TorusGeometry(0.45, 0.06, 6, 16), steel);
        band.position.set(s * 1.04, -0.13, z);
        g.add(band);
      }
      const nozzle = new T.Mesh(new T.CircleGeometry(0.34, 20), light);
      nozzle.position.set(s * 1.04, -0.13, 2.48);
      g.add(nozzle);
      const f = new T.Mesh(
        new T.ConeGeometry(0.31, 3.4, 16, 1, true),
        new T.MeshBasicMaterial({
          color: enemy ? '#ff3868' : '#78eaff',
          transparent: true,
          opacity: 0.72,
          blending: T.AdditiveBlending,
          depthWrite: false,
          side: T.DoubleSide,
        }),
      );
      f.rotation.x = Math.PI / 2;
      f.position.set(s * 1.04, -0.13, 4);
      f.name = 'flame';
      g.add(f);
      const inner = new T.Mesh(new T.ConeGeometry(0.15, 1.9, 12), glowMaterial('#e8ffff', 3));
      inner.rotation.x = Math.PI / 2;
      inner.position.set(s * 1.04, -0.13, 3.25);
      g.add(inner);
      const aura = halo(enemy ? '#ff3468' : '#39bfff', 3.6, 0.75);
      aura.position.set(s * 1.04, -0.13, 2.9);
      g.add(aura);
      g.add(box(0.2, 0.21, 2.5, black, s * 3.1, -0.06, 0.1));
      g.add(box(0.14, 0.13, 0.5, light, s * 3.1, -0.06, -1.3));
      g.add(box(0.15, 0.18, 0.7, copper, s * outer, 0, 1.5));
      const beacon = halo(enemy ? '#ff3765' : '#3cffba', 0.75);
      beacon.position.set(s * outer, 0.08, 1.55);
      g.add(beacon);
    }
    g.add(box(0.2, 0.02, 1.5, enemy ? pink : mint, 0, 0.63, 0.6));
    templates[enemy] = g;
  }
  const o = templates[enemy].clone(true);
  o.userData.flames = [];
  o.traverse((c) => {
    if (c.name === 'flame') o.userData.flames.push(c);
  });
  return o;
}
const noise = `float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+5.;a*=.5;}return s;}`;
export function createWorld(scene, random = Math.random) {
  const rnd = (a, b) => a + random() * (b - a);
  scene.background = new T.Color('#030914');
  scene.fog = new T.FogExp2('#071c23', 0.0014);
  scene.add(new T.HemisphereLight('#9fcdec', '#09293a', 1.6));
  const key = new T.DirectionalLight('#b8dcff', 3.2);
  key.position.set(-80, 140, 80);
  scene.add(key);
  const rim = new T.DirectionalLight('#38ffd0', 3);
  rim.position.set(60, 30, -110);
  scene.add(rim);
  const purple = new T.DirectionalLight('#7f78ff', 0.7);
  purple.position.set(-80, 10, 60);
  scene.add(purple);
  const skyMat = new T.ShaderMaterial({
    depthWrite: false,
    side: T.BackSide,
    vertexShader:
      'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 p;${noise}void main(){vec3 n=normalize(p);float cloud=fbm(n*6.);float band=exp(-pow((n.y-.2+n.x*.15)*3.,2.));vec3 c=vec3(.002,.004,.013);c+=vec3(.008,.07,.07)*pow(cloud,2.)*band;c+=vec3(.035,.015,.085)*pow(fbm(n*8.+10.),3.);c+=vec3(.008,.018,.022)*exp(-abs(n.y)*8.);gl_FragColor=vec4(c,1.);}`,
  });
  scene.add(new T.Mesh(new T.SphereGeometry(1900, 32, 20), skyMat));
  const starPos = [],
    starCol = [];
  for (let i = 0; i < 2000; i++) {
    let v = new T.Vector3(rnd(-1, 1), rnd(0.04, 1), rnd(-1, 0.15))
      .normalize()
      .multiplyScalar(rnd(1000, 1600));
    starPos.push(v.x, v.y, v.z);
    let c = new T.Color().setHSL(rnd(0.5, 0.7), 0.25, rnd(0.35, 0.85));
    starCol.push(c.r, c.g, c.b);
  }
  const starsG = new T.BufferGeometry();
  starsG.setAttribute('position', new T.Float32BufferAttribute(starPos, 3));
  starsG.setAttribute('color', new T.Float32BufferAttribute(starCol, 3));
  scene.add(
    new T.Points(
      starsG,
      new T.PointsMaterial({
        size: 1.6,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        fog: false,
      }),
    ),
  );
  const moonMat = new T.ShaderMaterial({
    vertexShader:
      'varying vec3 p;varying vec3 n;void main(){p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 p;varying vec3 n;${noise}void main(){vec3 N=normalize(n);float continent=fbm(N*9.);float details=fbm(N*42.);vec3 c=mix(vec3(.10,.16,.20),vec3(.43,.52,.56),smoothstep(.32,.72,continent));c*=.7+details*.5;float lit=max(0.,dot(N,normalize(vec3(-.7,.45,.8))));float crack=1.-smoothstep(.007,.016,abs(N.x+.14*sin(N.y*13.)+.035*sin(N.y*55.)));c=c*(.05+lit*.95)+vec3(.95,.27,.035)*crack*.7;gl_FragColor=vec4(c,1.);}`,
  });
  let moon = new T.Mesh(new T.SphereGeometry(190, 64, 40), moonMat);
  moon.position.set(480, 280, -1000);
  scene.add(moon);
  const atmosphere = new T.Mesh(
    new T.SphereGeometry(194, 48, 32),
    new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader:
        'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:
        'varying vec3 n;varying vec3 v;void main(){float a=pow(1.-abs(dot(normalize(n),normalize(v))),4.);gl_FragColor=vec4(.12,.55,.8,a*.6);}',
    }),
  );
  atmosphere.position.copy(moon.position);
  scene.add(atmosphere);
  const terrainMat = new T.ShaderMaterial({
    uniforms: { time: { value: 0 }, travel: { value: 0 } },
    vertexShader:
      'varying vec3 w;void main(){w=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
    fragmentShader: `varying vec3 w;uniform float time;uniform float travel;${noise}void main(){vec2 p=w.xz;p.y-=travel;float dist=length(w-cameraPosition);float water=1.-smoothstep(34.,39.,abs(p.x));float rip=sin(p.y*.6+sin(p.x*.15+time))*sin(p.x*.27-time*.8);vec3 c=vec3(.009,.019,.027);float gx=1.-smoothstep(.04,.12,abs(mod(p.x+8.,16.)-8.));float gz=1.-smoothstep(.04,.16,abs(mod(p.y+8.,16.)-8.));c+=vec3(.005,.14,.09)*max(gx,gz)*(1.-water);float refl=pow(max(0.,sin(p.x*.06+sin(p.y*.08)*.6)),14.)*(.25+noise(vec3(p*.5,time))*.75);c=mix(c,vec3(.004,.023,.031)+vec3(.01,.13,.12)*refl+vec3(.008,.045,.06)*rip,water);float edge=exp(-abs(abs(p.x)-36.)*.8);c+=vec3(.08,1.,.63)*edge;float fog=1.-exp(-dist*.002);gl_FragColor=vec4(mix(c,vec3(.013,.046,.054),fog),1.);}`,
  });
  const ground = new T.Mesh(new T.PlaneGeometry(4000, 4000), terrainMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -7, -1000);
  scene.add(ground);
  const city = new T.Group();
  scene.add(city);
  const unit = new T.BoxGeometry(1, 1, 1),
    bodyMat = metal('#122e39', 0.55, 0.5),
    roofMat = metal('#2b4651', 0.65, 0.4);
  const bodies = new T.InstancedMesh(unit, bodyMat, 200),
    caps = new T.InstancedMesh(unit, roofMat, 200),
    edges = new T.InstancedMesh(unit, glowMaterial('#13b998', 1.4), 400),
    windows = new T.InstancedMesh(unit, glowMaterial('#3ec9c2', 1.25), 2800);
  let d = new T.Object3D(),
    wi = 0;
  function inst(mesh, i, x, y, z, sx, sy, sz) {
    d.position.set(x, y, z);
    d.scale.set(sx, sy, sz);
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  }
  for (let i = 0; i < 200; i++) {
    let s = i % 2 ? 1 : -1,
      z = -30 - Math.floor(i / 2) * 19,
      x = s * rnd(47, 300),
      h = rnd(16, 105),
      w = rnd(7, 19),
      depth = rnd(8, 18);
    inst(bodies, i, x, h / 2 - 7, z, w, h, depth);
    inst(caps, i, x, h - 5, z, w * 0.72, 4, depth * 0.75);
    inst(edges, i * 2, x - w / 2, h / 2 - 7, z + depth / 2, 0.1, h, 0.12);
    inst(edges, i * 2 + 1, x + w / 2, h / 2 - 7, z + depth / 2, 0.1, h, 0.12);
    for (let j = 0; j < 14; j++) {
      let row = Math.floor(j / 2),
        col = j % 2;
      inst(
        windows,
        wi++,
        x + (col - 0.5) * w * 0.48,
        3 + (row * (h - 10)) / 7,
        z + depth / 2 + 0.05,
        w * 0.22,
        0.35,
        0.12,
      );
    }
  }
  for (let o of [bodies, caps, edges, windows]) {
    o.instanceMatrix.needsUpdate = true;
    city.add(o);
  }
  city.userData.loop = 1900;
  const cityFar = city.clone();
  cityFar.position.z = -1900;
  scene.add(cityFar);
  const near = [];
  for (let i = 0; i < 18; i++) {
    let g = new T.Group(),
      s = i % 2 ? 1 : -1;
    g.add(box(18, 2, 14, navy, 0, -5, 0));
    g.add(box(3, 16, 3, steel, 0, 2, 0));
    g.add(box(3.1, 0.3, 3.1, mint, 0, 8, 0));
    const cap = new T.Mesh(new T.OctahedronGeometry(2), black);
    cap.position.y = 12;
    g.add(cap);
    let h = halo('#37ffcb', 5, 0.45);
    h.position.set(0, 9, 0);
    g.add(h);
    g.position.set(s * 41, 0, -i * 65);
    scene.add(g);
    near.push(g);
  }
  // The Devastador is a distant narrative landmark; the actual boss retains its combat behavior.
  const carrier = new T.Group();
  carrier.add(box(95, 10, 30, navy));
  carrier.add(box(35, 20, 25, black, 0, 9, -4));
  for (let s of [-1, 1]) {
    carrier.add(box(35, 6, 50, steel, s * 54, 0, 0));
    carrier.add(box(1, 1, 70, pink, s * 55, -3, 0));
    for (let i = 0; i < 5; i++) {
      carrier.add(box(3, 1, 2, pink, s * (5 + i * 8), -2, 16));
    }
  }
  carrier.position.set(0, 62, -700);
  scene.add(carrier);
  const dustGeo = new T.BufferGeometry(),
    dustPos = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) {
    dustPos[i * 3] = rnd(-120, 120);
    dustPos[i * 3 + 1] = rnd(-5, 90);
    dustPos[i * 3 + 2] = rnd(-700, 25);
  }
  dustGeo.setAttribute('position', new T.BufferAttribute(dustPos, 3));
  const dust = new T.Points(
    dustGeo,
    new T.PointsMaterial({
      size: 0.1,
      color: '#6affd4',
      transparent: true,
      opacity: 0.45,
      blending: T.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(dust);
  const rainG = new T.BufferGeometry(),
    rainP = new Float32Array(110 * 6);
  for (let i = 0; i < 110; i++) {
    const x = rnd(-180, 180),
      y = rnd(10, 130),
      z = rnd(-600, 10);
    rainP.set([x, y, z, x, y - rnd(1, 5), z], i * 6);
  }
  rainG.setAttribute('position', new T.BufferAttribute(rainP, 3));
  const rain = new T.LineSegments(
    rainG,
    new T.LineBasicMaterial({
      color: '#36e7ab',
      transparent: true,
      opacity: 0.12,
      blending: T.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(rain);
  let travel = 0;
  return {
    update(dt, time, speed, playing) {
      terrainMat.uniforms.time.value = time;
      if (playing) {
        travel += speed * dt;
        terrainMat.uniforms.travel.value = travel;
        city.position.z = travel % 1900;
        cityFar.position.z = city.position.z - 1900;
        for (let g of near) {
          g.position.z += speed * dt;
          if (g.position.z > 50) g.position.z -= 1170;
        }
        for (let i = 0; i < 240; i++) {
          dustPos[i * 3 + 2] += speed * dt;
          if (dustPos[i * 3 + 2] > 30) dustPos[i * 3 + 2] = -700;
        }
        dustGeo.attributes.position.needsUpdate = true;
      }
      rain.position.y = -((time * 12) % 90);
      carrier.position.y = 62 + Math.sin(time * 0.25) * 3;
    },
    reset() {
      travel = 0;
      city.position.z = 0;
      cityFar.position.z = -1900;
      near.forEach((g, i) => (g.position.z = -i * 65));
    },
  };
}
export function bossModel() {
  let g = new T.Group();
  g.add(box(24, 5, 13, navy));
  g.add(box(10, 8, 17, red, 0, 1, 0));
  for (let s of [-1, 1]) {
    g.add(box(12, 3, 23, black, s * 17, 1, 0));
    for (let j = 0; j < 3; j++) {
      g.add(box(9, 1, 5, steel, s * 17, 3, j * 7 - 7));
      g.add(box(0.2, 0.2, 5, pink, s * 20, 3.6, j * 7 - 7));
    }
    g.add(box(5, 8, 7, steel, s * 14, 0, 6));
    g.add(box(3, 1, 1, pink, s * 14, 1, 10));
    let h = halo('#ff4962', 8, 0.6);
    h.position.set(s * 14, 1, 10.5);
    g.add(h);
  }
  const core = new T.Mesh(new T.SphereGeometry(2.5, 24, 16), glowMaterial('#ff8a47', 4));
  core.position.z = 10;
  g.add(core);
  let ring = new T.Mesh(new T.TorusGeometry(3.7, 0.28, 8, 40), steel);
  ring.position.z = 10;
  g.add(ring);
  let inner = new T.Mesh(new T.TorusGeometry(3.3, 0.1, 8, 40), pink);
  inner.position.z = 10.1;
  g.add(inner);
  let h = halo('#ff573f', 15, 0.6);
  h.position.z = 11;
  g.add(h);
  return g;
}
export function postProcessor(renderer, scene, camera) {
  const targetType = renderer.extensions.has('EXT_color_buffer_float')
    ? T.HalfFloatType
    : T.UnsignedByteType;
  const full = new T.WebGLRenderTarget(1, 1, { type: targetType, depthBuffer: true, samples: 2 });
  const a = new T.WebGLRenderTarget(1, 1, { type: targetType, depthBuffer: false }),
    b = a.clone();
  const passScene = new T.Scene(),
    passCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const vertex = 'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const blur = new T.ShaderMaterial({
    uniforms: {
      tex: { value: null },
      stepSize: { value: new T.Vector2() },
      threshold: { value: 0 },
    },
    vertexShader: vertex,
    fragmentShader: `varying vec2 uv0;uniform sampler2D tex;uniform vec2 stepSize;uniform float threshold;vec3 sampleAt(vec2 p){vec3 c=texture2D(tex,p).rgb;float l=max(c.r,max(c.g,c.b));return c*max(0.,l-threshold)/max(.001,l);}void main(){vec3 c=sampleAt(uv0)*.227027;c+=sampleAt(uv0+stepSize*1.384615)*.316216;c+=sampleAt(uv0-stepSize*1.384615)*.316216;c+=sampleAt(uv0+stepSize*3.230769)*.070270;c+=sampleAt(uv0-stepSize*3.230769)*.070270;gl_FragColor=vec4(c,1.);}`,
  });
  const final = new T.ShaderMaterial({
    uniforms: { base: { value: full.texture }, bloom: { value: b.texture } },
    vertexShader: vertex,
    fragmentShader:
      `varying vec2 uv0;uniform sampler2D base;uniform sampler2D bloom;void main(){vec3 c=texture2D(base,uv0).rgb+texture2D(bloom,uv0).rgb*.48;float vignette=1.-.20*pow(length((uv0-.5)*1.4),2.);c*=vignette;gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`.replace(
        ';#include',
        ';\n#include',
      ),
  });
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2), blur);
  passScene.add(quad);
  let bw = 1,
    bh = 1;
  return {
    resize(w, h) {
      let pr = renderer.getPixelRatio();
      full.setSize(Math.round(w * pr), Math.round(h * pr));
      bw = Math.max(1, Math.round((w * pr) / 3));
      bh = Math.max(1, Math.round((h * pr) / 3));
      a.setSize(bw, bh);
      b.setSize(bw, bh);
    },
    render() {
      renderer.setRenderTarget(full);
      renderer.render(scene, camera);
      quad.material = blur;
      blur.uniforms.tex.value = full.texture;
      blur.uniforms.stepSize.value.set(1 / bw, 0);
      blur.uniforms.threshold.value = 0.8;
      renderer.setRenderTarget(a);
      renderer.render(passScene, passCam);
      blur.uniforms.tex.value = a.texture;
      blur.uniforms.stepSize.value.set(0, 1 / bh);
      blur.uniforms.threshold.value = 0;
      renderer.setRenderTarget(b);
      renderer.render(passScene, passCam);
      quad.material = final;
      renderer.setRenderTarget(null);
      renderer.render(passScene, passCam);
    },
  };
}
