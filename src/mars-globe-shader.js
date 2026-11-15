// Analytic Martian albedo; no external 4K textures, new draw calls, or
// per-frame resource updates. The same low-frequency terrain, crater bowls and
// Valles Marineris-style canyon pattern rotate with the existing planet mesh.
export const MARS_GLOBE_FRAGMENT_SHADER = `
  varying vec3 surface;
  varying vec3 normalDir;
  uniform float alpha;
  float hash3(vec3 p) {
    p = fract(p * .1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(
      mix(mix(hash3(i),hash3(i+vec3(1.,0.,0.)),f.x),
          mix(hash3(i+vec3(0.,1.,0.)),hash3(i+vec3(1.,1.,0.)),f.x),f.y),
      mix(mix(hash3(i+vec3(0.,0.,1.)),hash3(i+vec3(1.,0.,1.)),f.x),
          mix(hash3(i+vec3(0.,1.,1.)),hash3(i+vec3(1.,1.,1.)),f.x),f.y),
      f.z);
  }
  void main() {
    vec3 N = normalize(surface);
    float basin = noise3(N * 4.9 + vec3(2.,4.,1.));
    float rock = noise3(N * 21. + vec3(7.,2.,9.));
    float dust = hash3(floor(N * 125.));
    float latitude = abs(N.y);
    // Broad rusty lowlands, dust-coated highlands and basaltic volcanic fields.
    vec3 lowland = vec3(.23,.072,.042);
    vec3 desert = vec3(.68,.275,.125);
    vec3 highland = vec3(.83,.52,.285);
    vec3 albedo = mix(lowland, desert, smoothstep(.25,.73,basin*.73+rock*.27));
    albedo = mix(albedo, highland, smoothstep(.57,.79,basin)*.38);
    albedo *= .91 + .15 * rock + .05 * dust;
    // Deterministic basins and raised crater rims, instead of concentric
    // sine rings across the entire surface.
    vec3 cell = N * 33. + vec3(5.,8.,1.);
    vec3 center = floor(cell);
    vec3 local = fract(cell) - .5;
    float occupied = smoothstep(.48,.82,hash3(center + vec3(2.,1.,7.)));
    float distanceToCrater = length(local.xy + vec2(hash3(center)-.5)*.12);
    float rim = exp(-pow((distanceToCrater-.30)*24.,2.))*occupied;
    float bowl = (1.-smoothstep(.08,.27,distanceToCrater))*occupied;
    albedo *= 1. - bowl*.25;
    albedo += vec3(.17,.09,.055)*rim;
    // Continental canyon systems: no bright artificial crack neon.
    float canyon = exp(-abs(N.y+.19+.085*sin(N.x*9.)+.022*sin(N.z*31.))*24.)
      * smoothstep(-.7,.12,N.x) * (1.-smoothstep(.5,.9,N.x));
    albedo = mix(albedo, vec3(.13,.045,.034), canyon*.55);
    float polarCap = smoothstep(.82,.965,latitude);
    albedo = mix(albedo,vec3(.72,.65,.55),polarCap*.83);
    vec3 sun = normalize(vec3(-.58,.37,.68));
    float lighting = max(0.,dot(normalize(normalDir),sun));
    float terminator = .10 + .90 * smoothstep(-.18,.34,lighting);
    float limbDust = pow(1.-abs(N.z),4.)*.08;
    albedo += vec3(.18,.075,.024)*limbDust;
    gl_FragColor = vec4(albedo*terminator,alpha);
  }`;
