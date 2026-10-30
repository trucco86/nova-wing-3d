/**
 * City of Machines / Graphics 3.0: art-directed wet metallic roadway.
 * The visual-only shader preserves the current ocean/ice ground.
 * Analytic reflections avoid expensive screen-space or ray-traced passes.
 */
export function createPremiumWetRoadFragment(noiseSource) {
  return `varying vec3 w;
uniform float time;
uniform float travel;
uniform float water;
uniform float cityWet;
uniform float premiumWet;
${noiseSource}
void main() {
  vec2 p = w.xz;
  p.y -= travel;
  float dist = length(w - cameraPosition);
  float wet = water * (1. - smoothstep(34., 39., abs(p.x)));
  float rip = sin(p.y * .6 + sin(p.x * .15 + time)) * sin(p.x * .27 - time * .8);
  vec3 c = vec3(.009, .019, .027);
  float gx = 1. - smoothstep(.04, .12, abs(mod(p.x + 8., 16.) - 8.));
  float gz = 1. - smoothstep(.04, .16, abs(mod(p.y + 8., 16.) - 8.));
  c += vec3(.005, .14, .09) * max(gx, gz) * (1. - wet);
  float refl = pow(max(0., sin(p.x * .06 + sin(p.y * .08) * .6)), 14.) *
    (.25 + noise(vec3(p * .5, time)) * .75);
  c = mix(c, vec3(.004, .023, .031) + vec3(.01, .13, .12) * refl +
    vec3(.008, .045, .06) * rip, wet);
  float road = (1. - wet) * (1. - smoothstep(.12, .3, abs(abs(p.x) - 18.))) *
    step(4., mod(p.y, 16.));
  c += vec3(.05, .18, .17) * road;
  float edge = exp(-abs(abs(p.x) - 36.) * .8);
  c += vec3(.08, 1., .63) * edge;

  if (premiumWet > .5 && cityWet > .5) {
    // Real-world panel scale adds readable surface density at chase-camera angle.
    vec2 tile = vec2(p.x / 6.0, p.y / 12.0);
    vec2 cell = abs(fract(tile) - .5);
    float joint = smoothstep(.472, .493, max(cell.x, cell.y));
    float metalTone = noise(vec3(floor(tile.x), floor(tile.y), .4));
    float grain = noise(vec3(p * 2.3, time * .018));
    float puddles = smoothstep(.35, .75, noise(vec3(p * .14, .6)));
    float wetCoat = .4 + .5 * puddles;
    vec3 panel = mix(vec3(.013, .027, .037), vec3(.025, .052, .066), metalTone);
    panel += .009 * grain;
    panel *= 1. - .57 * joint;
    float corridor = 1. - smoothstep(32., 75., abs(p.x));
    c = mix(c, panel, corridor * .83);

    // Long, broken reflections read as light reflecting from wet metal.
    float wobble = (noise(vec3(p.y * .041, p.x * .091, time * .08)) - .5) * 2.2;
    float lane = abs(p.x + wobble);
    float cyanEdge = exp(-pow((lane - 36.) * .46, 2.));
    float cyanSecondary = exp(-pow((lane - 24.) * .31, 2.));
    float warmWindow = exp(-pow((lane - 54.) * .18, 2.));
    float stretchedHighlight = pow(.5 + .5 * sin(p.y * .08 +
      noise(vec3(p * .042, 1.)) * 3.5), 4.);
    float sparkle = pow(max(0., sin(p.y * 1.35 +
      sin(p.x * .6) + time * .34)), 20.);
    float shine = wetCoat * (.50 + stretchedHighlight * .47);
    c += vec3(.015, .44, .51) * cyanEdge * shine;
    c += vec3(.005, .14, .19) * cyanSecondary * wetCoat;
    c += vec3(.21, .093, .032) * warmWindow * shine * .57;
    c += vec3(.025, .13, .14) * sparkle * puddles * corridor * .48;
    // Leave the centerline less luminous to keep shots/reticle legible.
    c *= 1. - .17 * (1. - smoothstep(0., 10., abs(p.x)));
  }
  float fog = 1. - exp(-dist * .002);
  gl_FragColor = vec4(mix(c, vec3(.013, .046, .054), fog), 1.);
}`;
}
