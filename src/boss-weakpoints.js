// Physical generator placement and angle exposure are one authored contract.
// Bosses 5/6/8/9 require a real rear-orbit approach to the right battery.
// Keep the generator count at two to preserve encounter duration and save.
export const REAR_WEAKPOINT_SECTORS = Object.freeze([5, 6, 8, 9]);

export function bossRearGenerator(sector, index) {
  return index === 1 && REAR_WEAKPOINT_SECTORS.includes(sector);
}

export function bossGeneratorAngle(sector, index = -1) {
  if (index < 0) return 0;
  if (index === 0) return -Math.PI / 3;
  return bossRearGenerator(sector, index) ? Math.PI * 0.82 : Math.PI / 3;
}

export function bossGeneratorLocation(sector, index) {
  if (![0, 1].includes(index)) throw new RangeError('Invalid generator');
  const rear = bossRearGenerator(sector, index);
  return Object.freeze({
    x: index === 0 ? -17 : 17,
    y: 4,
    z: rear ? -19 : 19,
    markerZ: rear ? -22 : 22,
    rear,
    label: index === 0 ? 'ESQUERDO' : rear ? 'TRASEIRO' : 'DIREITO',
  });
}
