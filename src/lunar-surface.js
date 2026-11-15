/**
 * One deterministic lunar surface for the city landmark and the orbital reveal.
 * Detailed fracture edges are analytic, so no glow mesh or per-frame texture
 * allocation is required. Only one fbm + two noise samples per fragment.
 *
 * The supplied noise functions already belong to the owning celestial shader.
 */
export function createLunarFragmentShader(noiseFunctions) {
  return `uniform float crackIntensity;
    uniform vec3 bodyTint;
    uniform float fade;
    varying vec3 p;
    varying vec3 n;
    ${noiseFunctions}
    void main() {
      vec3 N = normalize(p);
      float highlands = fbm(N * 7.7 + vec3(2., 4., 7.));
      float regolith = noise(N * 61.);
      float maria = noise(N * 3.8 + vec3(5., 1., 8.));
      vec3 cell = fract(N * 25. + vec3(N.z * 3., N.x * 2., N.y * 2.)) - .5;
      float seed = hash(floor(N * 25.) + vec3(4., 7., 2.));
      float craterRadius = length(cell.xy + vec2(seed - .5) * .12);
      float craterMask = smoothstep(.16, .62, seed);
      float craterRim = exp(-pow((craterRadius - .31) * 23., 2.)) * craterMask;
      float craterBowl = (1. - smoothstep(.09, .27, craterRadius)) * craterMask;
      float ejecta = exp(-craterRadius * 6.) * (1. - craterBowl) * craterMask;

      vec3 rock = mix(vec3(.16, .19, .22), vec3(.52, .56, .57),
        smoothstep(.18, .78, highlands * .79 + regolith * .21));
      rock = mix(rock, vec3(.13, .15, .18), smoothstep(.49, .73, maria) * .57);
      rock *= 1. - craterBowl * .41;
      rock += vec3(.15, .16, .16) * craterRim + vec3(.045) * ejecta;

      // Jagged primary fault with three branching and irregular secondary seams.
      // A dark core, broken shadowed banks and thin amber mineral glow give
      // physical depth without adding geometry or post-processing passes.
      float fault = N.x + .19 * sin(N.y * 5.) + .038 * sin(N.y * 23.)
        + .011 * sin(N.y * 67.);
      float faultDistance = abs(fault);
      float primary = 1. - smoothstep(.009, .028, faultDistance);
      float branchA = (1. - smoothstep(.009, .032,
        abs(N.y - .18 - N.x * .82 + .032 * sin(N.x * 29.))))
        * smoothstep(-.48, .08, N.x);
      float branchB = (1. - smoothstep(.009, .029,
        abs(N.y + .37 + N.x * .71 + .034 * sin(N.x * 31.))))
        * (1. - smoothstep(.08, .53, N.x));
      float branchC = (1. - smoothstep(.008, .024,
        abs(N.y - .52 + N.x * .53 + .024 * sin(N.x * 47.))))
        * smoothstep(-.62, -.17, N.x);
      float fracture = clamp(primary + branchA * .83 + branchB * .76
        + branchC * .53, 0., 1.);
      float bank = clamp((1. - smoothstep(.023, .07, faultDistance))
        - primary, 0., 1.);
      float relief = craterRim * .14 - craterBowl * .18 + bank * .07;
      float sunlight = max(0., dot(normalize(n),
        normalize(vec3(-.73, .44, .75))) + relief);
      vec3 shaded = rock * bodyTint * (.15 + .85 * sunlight);
      float broken = fracture * crackIntensity;
      shaded = mix(shaded, vec3(.008, .011, .018), broken * .87);
      shaded += vec3(.86, .29, .065) * broken * .46;
      shaded += vec3(.95, .53, .19) * broken * broken * .23;
      shaded += vec3(.24, .18, .12) * bank * crackIntensity * .26;
      gl_FragColor = vec4(shaded, fade);
    }`;
}
