import * as T from 'three';

// A single coherent celestial composition for the opening Earth departure.
// Procedural textures are evaluated on the GPU. No network calls, collision
// geometry, or new packages; only graphics quality controls cloud overhead.
const noise = `float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+5.;a*=.5;}return s;}`;
const smooth = (x) => {
  const t = T.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const vertex =
  'varying vec3 n;varying vec3 p;void main(){n=normalize(normalMatrix*normal);p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';

function sunGlowTexture() {
  const side = 96;
  const bytes = new Uint8Array(side * side * 4);
  for (let y = 0; y < side; y++)
    for (let x = 0; x < side; x++) {
      const r = Math.hypot(x - (side - 1) / 2, y - (side - 1) / 2) / ((side - 1) / 2);
      const center = Math.max(0, 1 - r);
      const alpha = Math.pow(center, 2) * 0.86 + Math.exp(-r * 12) * 0.14;
      const i = (y * side + x) * 4;
      bytes[i] = 255;
      bytes[i + 1] = 222;
      bytes[i + 2] = 153;
      bytes[i + 3] = Math.round(Math.min(1, alpha) * 255);
    }
  const texture = new T.DataTexture(bytes, side, side);
  texture.needsUpdate = true;
  return texture;
}

export function createLaunchCelestials(scene) {
  const earthMaterial = new T.ShaderMaterial({
    uniforms: { fade: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: vertex,
    fragmentShader: `uniform float fade;varying vec3 n;varying vec3 p;${noise}
      void main(){
        vec3 N=normalize(p);
        float latitude=abs(N.y);
        float continents=fbm(N*5.2+vec3(2.,0.,7.))*.72+fbm(N*13.)*.28;
        float coast=smoothstep(.435,.535,continents);
        float mountain=fbm(N*38.)*.3+fbm(N*11.)*.7;
        vec3 ocean=mix(vec3(.01,.07,.14),vec3(.022,.22,.34),fbm(N*13.));
        vec3 forest=mix(vec3(.035,.20,.12),vec3(.22,.28,.13),mountain);
        vec3 land=mix(forest,vec3(.48,.44,.31),smoothstep(.55,.80,mountain));
        land=mix(land,vec3(.84,.87,.87),smoothstep(.73,.86,latitude));
        vec3 c=mix(ocean,land,coast);
        vec3 sun=normalize(vec3(-.72,.34,.56));
        float lightTerm=dot(normalize(n),sun);
        float day=.12+.88*smoothstep(-.30,.7,lightTerm);
        float cityLight=step(.53,continents)*pow(fbm(N*110.),4.)*(1.-smoothstep(-.4,.1,lightTerm));
        float fresnel=pow(1.-max(0.,abs(n.z)),3.);
        c=c*day+vec3(1.,.70,.39)*cityLight*.20;
        c+=vec3(.025,.19,.33)*fresnel*.5;
        gl_FragColor=vec4(c,fade);
      }`,
  });
  const earth = new T.Mesh(new T.SphereGeometry(720, 64, 40), earthMaterial);
  earth.name = 'launch-earth-horizon';
  earth.position.set(0, -920, -1530);
  earth.rotation.y = -0.24;
  earth.userData.fixedSky = true;
  earth.userData.visualOnly = true;
  earth.visible = false;
  scene.add(earth);

  const cloudMaterial = new T.ShaderMaterial({
    uniforms: { fade: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: vertex,
    fragmentShader: `uniform float fade;varying vec3 n;varying vec3 p;${noise}
      void main(){
        vec3 N=normalize(p);
        float cloud=fbm(N*15.1+vec3(7.1,2.5,0.));
        float wisps=fbm(N*39.2);
        float opacity=smoothstep(.49,.69,cloud*.77+wisps*.23);
        float lit=.26+.74*max(0.,dot(normalize(n),normalize(vec3(-.72,.34,.56))));
        gl_FragColor=vec4(vec3(.72,.86,1.)*lit,fade*opacity*.62);
      }`,
  });
  const clouds = new T.Mesh(new T.SphereGeometry(731, 48, 32), cloudMaterial);
  clouds.name = 'launch-earth-clouds';
  clouds.rotation.y = 0.16;
  clouds.userData.visualOnly = true;
  clouds.visible = false;
  scene.add(clouds);

  const limbMaterial = new T.ShaderMaterial({
    uniforms: { fade: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    vertexShader: vertex,
    fragmentShader: `uniform float fade;varying vec3 n;void main(){
      float rim=pow(1.-abs(normalize(n).z),5.);
      gl_FragColor=vec4(.13,.50,.84,fade*rim*.58);
    }`,
  });
  const limb = new T.Mesh(new T.SphereGeometry(740, 40, 26), limbMaterial);
  limb.name = 'launch-earth-atmospheric-limb';
  limb.userData.visualOnly = true;
  limb.visible = false;
  scene.add(limb);

  const moonMaterial = new T.ShaderMaterial({
    uniforms: { fade: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: vertex,
    fragmentShader: `uniform float fade;varying vec3 n;varying vec3 p;${noise}
      void main(){
        vec3 N=normalize(p);
        float craters=fbm(N*46.1+vec3(3.,9.,1.));
        float ridges=fbm(N*14.);
        float pit=smoothstep(.37,.53,craters);
        vec3 c=mix(vec3(.20,.23,.25),vec3(.62,.64,.64),ridges);
        c*=.65+.35*pit;
        float lit=.10+.90*max(0.,dot(normalize(n),normalize(vec3(-.75,.33,.55))));
        gl_FragColor=vec4(c*lit,fade);
      }`,
  });
  const moon = new T.Mesh(new T.SphereGeometry(112, 36, 22), moonMaterial);
  moon.name = 'launch-orbit-moon';
  moon.position.set(255, 255, -1260);
  moon.userData.fixedSky = true;
  moon.userData.visualOnly = true;
  moon.visible = false;
  scene.add(moon);

  const sun = new T.Group();
  sun.name = 'launch-orbit-sun';
  sun.position.set(-255, 275, -1170);
  sun.userData.fixedSky = true;
  sun.userData.visualOnly = true;
  const discMaterial = new T.MeshBasicMaterial({
    color: '#fff1c3',
    transparent: true,
    opacity: 0,
    toneMapped: false,
    fog: false,
    depthWrite: false,
  });
  const disc = new T.Mesh(new T.SphereGeometry(31, 20, 12), discMaterial);
  disc.name = 'launch-sun-disc';
  disc.userData.visualOnly = true;
  sun.add(disc);
  const texture = sunGlowTexture();
  const glow = [];
  for (const [i, radius, strength] of [
    [0, 295, 0.6],
    [1, 620, 0.21],
  ]) {
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map: texture,
        color: i === 0 ? '#fff1c2' : '#ffd490',
        transparent: true,
        depthWrite: false,
        depthTest: false,
        fog: false,
        blending: T.AdditiveBlending,
        opacity: 0,
      }),
    );
    sprite.name = 'launch-sun-halo-' + i;
    sprite.scale.set(radius, radius, 1);
    sprite.userData.opacityScale = strength;
    sprite.userData.visualOnly = true;
    sun.add(sprite);
    glow.push(sprite);
  }
  // Camera-facing anamorphic gleam and two optical ghosts create a visible
  // sunset cue without importing flare textures or overlaying the flight HUD.
  const streakMaterial = new T.MeshBasicMaterial({
    color: '#fff3cd',
    transparent: true,
    opacity: 0,
    toneMapped: false,
    fog: false,
    depthTest: false,
    depthWrite: false,
    blending: T.AdditiveBlending,
    side: T.DoubleSide,
  });
  const streak = new T.Mesh(new T.PlaneGeometry(260, 3.2), streakMaterial);
  streak.name = 'launch-sun-anamorphic-streak';
  streak.userData.visualOnly = true;
  sun.add(streak);
  const ghostSprites = [];
  for (const [index, x, y, size] of [
    [0, 85, -70, 76],
    [1, 170, -138, 43],
  ]) {
    const ghost = new T.Sprite(
      new T.SpriteMaterial({
        map: texture,
        color: index === 0 ? '#acdfff' : '#ffe3ac',
        opacity: 0,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: T.AdditiveBlending,
      }),
    );
    ghost.name = 'launch-sun-lens-ghost-' + index;
    ghost.position.set(x, y, 2);
    ghost.scale.set(size, size, 1);
    ghost.userData.visualOnly = true;
    sun.add(ghost);
    ghostSprites.push(ghost);
  }
  scene.add(sun);

  // A separate evacuation squad remains above the falling city during boost
  // and atmospheric climb. These ships gradually shrink into the orbital sky
  // instead of teleporting out with the urban tile.
  const escapeGroup = new T.Group();
  escapeGroup.name = 'launch-evacuation-convoy';
  escapeGroup.userData.visualOnly = true;
  const escapeHull = new T.MeshStandardMaterial({
    color: '#8ea9c3', metalness: 0.76, roughness: 0.33,
  });
  const escapeCockpit = new T.MeshStandardMaterial({
    color: '#1a4c69', metalness: 0.42, roughness: 0.17,
  });
  const escapeFlame = new T.MeshBasicMaterial({ color: '#ffa35a', toneMapped: false });
  const convoyShips = [];
  for (let i = 0; i < 4; i++) {
    const ship = new T.Group();
    ship.name = 'launch-escaping-ship-' + i;
    ship.userData.visualOnly = true;
    const core = new T.Mesh(new T.CapsuleGeometry(3.3, 13, 5, 9), escapeHull);
    core.rotation.x = Math.PI / 2;
    ship.add(core);
    const cabin = new T.Mesh(new T.BoxGeometry(4.8, 2.3, 7), escapeCockpit);
    cabin.position.set(0, 2.1, -5.2);
    ship.add(cabin);
    const wing = new T.Mesh(new T.BoxGeometry(19, 0.8, 5), escapeHull);
    wing.position.set(0, -0.4, 2.4);
    ship.add(wing);
    const plumes = [];
    for (const side of [-1, 1]) {
      const jet = new T.Mesh(new T.ConeGeometry(1.4, 13, 9), escapeFlame);
      jet.name = 'launch-escaping-ship-thruster';
      jet.rotation.x = -Math.PI / 2;
      jet.position.set(side * 2.3, -1.1, 13.4);
      ship.add(jet);
      plumes.push(jet);
    }
    ship.userData.plumes = plumes;
    escapeGroup.add(ship);
    convoyShips.push(ship);
  }
  scene.add(escapeGroup);

  let high = false;
  function setGraphicsQuality(quality) {
    high = quality === 'high';
    clouds.visible = earth.visible && high;
    limb.visible = earth.visible && high;
  }
  function update(amount) {
    const progress = T.MathUtils.clamp(amount, 0, 1);
    const earthFade = smooth((progress - 0.38) / 0.59);
    const sunFade = smooth((progress - 0.27) / 0.48);
    const moonFade = smooth((progress - 0.51) / 0.4);
    const positionY = -920 + 350 * smooth(progress);
    earth.position.y = positionY;
    clouds.position.copy(earth.position);
    limb.position.copy(earth.position);
    earth.visible = earthFade > 0;
    earthMaterial.uniforms.fade.value = earthFade * 0.96;
    cloudMaterial.uniforms.fade.value = earthFade * 0.75;
    limbMaterial.uniforms.fade.value = earthFade;
    clouds.visible = earth.visible && high;
    limb.visible = earth.visible && high;
    // Atmospheric motion is deliberately subtle during the 38 s transition.
    // In particular, the cloud layer does not snap to a new position as the
    // city yields to Earth.
    clouds.rotation.y = 0.16 + progress * 0.085;
    moon.visible = moonFade > 0;
    moonMaterial.uniforms.fade.value = moonFade * 0.93;
    sun.visible = sunFade > 0;
    discMaterial.opacity = sunFade;
    for (const sprite of glow) sprite.material.opacity = sunFade * sprite.userData.opacityScale;
    streakMaterial.opacity = sunFade * (high ? 0.42 : 0.23);
    for (const [i, sprite] of ghostSprites.entries()) {
      sprite.visible = high;
      sprite.material.opacity = sunFade * (i === 0 ? 0.24 : 0.13);
    }
    escapeGroup.visible = progress > 0.10 && progress < 0.995;
    for (const [i, ship] of convoyShips.entries()) {
      const side = i % 2 ? 1 : -1;
      const climb = smooth(progress);
      ship.position.set(
        side * (90 + i * 28 + climb * 95),
        -15 + climb * (500 + i * 32),
        -600 - i * 195 - climb * 990,
      );
      ship.rotation.set(-0.28 - climb * 0.30, side * 0.08, side * (-0.03 - climb * 0.13));
      ship.scale.setScalar(0.95 - climb * 0.78);
      for (const plume of ship.userData.plumes) {
        plume.scale.set(1, 1 + 0.16 * Math.sin(progress * 52 + i), 1);
      }
    }
  }
  update(0);
  return { earth, clouds, limb, moon, sun, update, setGraphicsQuality, reset: () => update(0) };
}
