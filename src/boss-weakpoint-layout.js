// Physical weak-point coordinates and attack arcs are authored together.
// Firing into a generator remains the only way to reveal its weakness.
// Authored flank and stern generators reward changing viewpoint instead of
// presenting the same two glowing eyes on every chief. Their combat arcs and
// actual hit volumes share this same plan; all keep exactly two real batteries.
const ORBITAL_SIGNATURES = Object.freeze({
  1: [
    { x: -33, y: 10, z: -10, yaw: -Math.PI / 2, arc: -2.2, type: 'stingray-port-wing-root' },
    { x: 34, y: -5, z: -20, yaw: Math.PI, arc: 2.75, type: 'stingray-rear-drive' },
  ],
  2: [
    { x: -25, y: 12, z: -10, yaw: -Math.PI / 2, arc: -2.25, type: 'carbide-side-bearing' },
    { x: 29, y: -12, z: -30, yaw: Math.PI, arc: 2.8, type: 'carbide-rear-engine' },
  ],
  4: [
    { x: -42, y: 7, z: -15, yaw: -Math.PI / 2, arc: -2.15, type: 'phoenix-wing-fuse' },
    { x: 40, y: 12, z: -30, yaw: Math.PI, arc: 2.9, type: 'phoenix-rear-reactor' },
  ],
  6: [
    { x: -35, y: 17, z: 0, yaw: -Math.PI / 2, arc: -1.7, type: 'hydra-side-neural-node' },
    { x: 25, y: -12, z: -22, yaw: Math.PI, arc: 2.75, type: 'hydra-spinal-heart' },
  ],
  7: [
    { x: -45, y: 14, z: -12, yaw: -Math.PI / 2, arc: -2.1, type: 'omega-port-shield-feed' },
    { x: 46, y: -9, z: -27, yaw: Math.PI, arc: 2.7, type: 'omega-stern-drive' },
  ],
  8: [
    { x: -30, y: 19, z: -5, yaw: -Math.PI / 2, arc: -1.9, type: 'orion-side-stabilizer' },
    { x: 30, y: -15, z: -33, yaw: Math.PI, arc: 2.65, type: 'orion-rear-lens' },
  ],
  9: [
    { x: -48, y: 8, z: -10, yaw: -Math.PI / 2, arc: -2.15, type: 'marvin-port-wing-turbine' },
    { x: 40, y: -5, z: -24, yaw: Math.PI, arc: 2.75, type: 'marvin-rear-power-cell' },
  ],
});

export function bossWeakPointPlan(sectorIndex) {
  if (ORBITAL_SIGNATURES[sectorIndex])
    return ORBITAL_SIGNATURES[sectorIndex].map((part) => ({ ...part }));
  if (sectorIndex === 3)
    return [
      { x: -38, y: -8, z: -15, yaw: -Math.PI / 2, arc: -2.35, type: 'port-drive-valve' },
      { x: 38, y: 11, z: -24, yaw: Math.PI / 2, arc: 2.35, type: 'starboard-drive-valve' },
    ];
  if (sectorIndex === 5)
    return [
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
