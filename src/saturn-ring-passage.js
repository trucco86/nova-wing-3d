// Distinct flight beats for Saturn sector 8. Keep the camera and boss gates.
// This module has no 3D objects, random numbers or per-frame timers.
const smooth = (v) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};

export function saturnPassageAt(seconds, duration = 98) {
  if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(duration) || duration <= 8)
    throw new RangeError('Invalid Saturn passage time');
  const p = seconds / duration;
  if (seconds < 8)
    return { zone: 'approach', density: 0.27, label: 'SATURNO À VISTA · ANÉIS À FRENTE', meteor: false };
  if (p < 0.24)
    return {
      zone: 'outer',
      density: 0.34 + 0.38 * smooth((p - 8 / duration) / (0.24 - 8 / duration)),
      label: 'SATURNO · ANEL EXTERNO',
      meteor: false,
    };
  if (p < 0.63)
    return {
      zone: 'ice-field',
      density: 0.72 + 0.28 * smooth((p - 0.24) / 0.21),
      label: 'SATURNO · CAMPO DE GELO DOS ANÉIS',
      meteor: true,
    };
  if (p < 0.79)
    return {
      zone: 'cassini-gap',
      density: 1 - 0.62 * smooth((p - 0.63) / 0.16),
      label: 'SATURNO · DIVISÃO DE CASSINI',
      meteor: true,
    };
  return {
    zone: 'blockade',
    density: 0.27,
    label: 'SATURNO · BLOQUEIO DO COURAÇADO ÔMEGA',
    meteor: false,
  };
}
