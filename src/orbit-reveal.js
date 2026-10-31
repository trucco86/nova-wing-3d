/**
 * Four readable phases for the launch: urban skyline -> atmosphere only ->
 * night sky / stars -> Earth. The planet must never share a frame with a
 * visible city, including the distant tiles and the infinite ground.
 */
export const ORBIT_REVEAL = Object.freeze({
  groundGone: 0.57,
  cityGone: 0.73,
  skyDarkStart: 0.66,
  skyDarkEnd: 0.87,
  hazeStart: 0.7,
  hazeEnd: 0.94,
  firstEarth: 0.855,
  earthFull: 0.985,
  firstMoon: 0.93,
  firstSun: 0.915,
});
const clamp = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
export const eased = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export const between = (value, a, b) => eased((value - a) / (b - a));
export function orbitRevealAt(amount) {
  const p = clamp(amount);
  const {
    cityGone,
    skyDarkStart,
    skyDarkEnd,
    hazeStart,
    hazeEnd,
    firstEarth,
    earthFull,
    firstMoon,
    firstSun,
  } = ORBIT_REVEAL;
  const cityVisible = p < cityGone;
  const night = between(p, skyDarkStart, skyDarkEnd);
  const earth = cityVisible ? 0 : between(p, firstEarth, earthFull);
  const stars = between(p, 0.64, 0.89);
  const haze = between(p, hazeStart, 0.83) * (1 - between(p, 0.89, hazeEnd));
  return {
    cityVisible,
    planetVisible: earth > 0,
    phase: cityVisible ? 'city' : p < skyDarkEnd ? 'sky' : earth > 0 ? 'orbit' : 'stars',
    night,
    stars,
    haze,
    earth,
    moon: cityVisible ? 0 : between(p, firstMoon, 1),
    sun: cityVisible ? 0 : between(p, firstSun, 1),
    skyOnly: !cityVisible && earth === 0,
  };
}
