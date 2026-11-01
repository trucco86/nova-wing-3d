// One lock per physical target. An original fire-control mechanic:
 // holding LOCK paints different targets; releasing sends a bounded salvo.
export function mechaMultiLockCapacity(stage = 0) {
  if (stage >= 18) return 12;
  if (stage >= 12) return 8;
  if (stage >= 6) return 5;
  return 3;
}
export function availableMechaTargets(
  origin,
  candidates,
  { visible = () => true, maxDistance = 280 } = {},
) {
  return candidates
    .filter((item) => {
      if (!item?.position?.isVector3 || item.alive === false) return false;
      const forward = origin.z - item.position.z;
      if (forward < 8 || forward > maxDistance) return false;
      const angle = Math.atan2(
        Math.hypot(item.position.x - origin.x, item.position.y - origin.y),
        forward,
      );
      return angle <= 0.75 && visible(origin, item.position);
    })
    .map((item) => {
      const forward = origin.z - item.position.z;
      const angle = Math.atan2(
        Math.hypot(item.position.x - origin.x, item.position.y - origin.y),
        forward,
      );
      return { ...item, score: angle * 190 + forward * 0.16 - (item.weak ? 24 : 0) };
    })
    .sort((a, b) => a.score - b.score);
}
export function collectMultiLocks(existing, candidates, capacity, availableSlots) {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const stillAlive = existing.flatMap((item) =>
    byId.has(item.id) ? [byId.get(item.id)] : [],
  );
  const result = [...stillAlive];
  for (const candidate of candidates) {
    if (result.length >= Math.min(capacity, availableSlots)) break;
    if (result.some((item) => item.id === candidate.id)) continue;
    result.push(candidate);
  }
  return result;
}
export function multiLockCost(targets) {
  return Math.min(60, 6 + Math.max(0, targets) * 3.5);
}
