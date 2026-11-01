// Physical generator coordinates and matching orbit arcs. Sector 4's boss
// is a reactor + drive assembly: exhaust valves on the lateral / REAR hull,
// not two glowing eyes aimed at the camera. Other bosses keep their existing
// authored combat arcs until their corresponding encounters are rewritten.
export function bossWeakPointPlan(sectorIndex) {
  if (sectorIndex === 3) return [
    { x: -38, y: -8, z: -15, yaw: -Math.PI / 2, arc: -2.35, type: 'port-drive-valve' },
    { x: 38, y: 11, z: -24, yaw: Math.PI / 2, arc: 2.35, type: 'starboard-drive-valve' },
  ];
  if (sectorIndex === 5) return [
    { x: -35, y: 15, z: -9, yaw: -Math.PI / 2, arc: -1.68, type: 'left-shoulder-joint' },
    { x: 35, y: -14, z: -12, yaw: Math.PI / 2, arc: 1.68, type: 'right-hip-joint' },
  ];
  return [
    { x: -17, y: 4, z: 19, yaw: 0, arc: -Math.PI / 3, type: 'left-generator' },
    { x: 17, y: 4, z: 19, yaw: 0, arc: Math.PI / 3, type: 'right-generator' },
  ];
}

export function bossWeakPointAngle(sectorIndex, partIndex) {
  return bossWeakPointPlan(sectorIndex)[partIndex]?.arc ?? 0;
}
export function bossWeakPointOpen(sectorIndex, relativeAngle, partIndex) {
  if (!Number.isFinite(relativeAngle)) return false;
  const center = bossWeakPointAngle(sectorIndex, partIndex);
  const difference = Math.atan2(Math.sin(relativeAngle - center), Math.cos(relativeAngle - center));
  return Math.abs(difference) < ([3, 5].includes(sectorIndex) ? 0.75 : 0.8);
}
