// One physical cave travels from the distant fog into the camera. Only the
// near-mouth moment transfers the visible floor to the cave's real deck.
export const EUROPA_CAVE_SPAWN_Z = -960;
export const EUROPA_CAVE_HANDOFF_DISTANCE = 28;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
export function europaCaveApproachAt(frontZ, length, pilotZ = 9) {
  if (![frontZ, length, pilotZ].every(Number.isFinite) || length <= 0)
    throw new RangeError('Invalid Europa cave approach geometry');
  const distance = pilotZ - frontZ;
  const tailDistance = pilotZ - (frontZ - length);
  const inside = distance <= EUROPA_CAVE_HANDOFF_DISTANCE && tailDistance >= -28;
  const phase =
    distance > 620
      ? 'distant'
      : distance > 180
        ? 'approach'
        : distance > EUROPA_CAVE_HANDOFF_DISTANCE
          ? 'align'
          : inside
            ? 'inside'
            : 'exit';
  const near = smooth((560 - distance) / 490);
  const exit = 1 - smooth((-tailDistance + 40) / 90);
  return Object.freeze({
    phase,
    frontZ,
    distance,
    inside,
    visualIntensity: near * exit,
    cameraIntensity: smooth((340 - distance) / 300) * exit,
    length,
  });
}
