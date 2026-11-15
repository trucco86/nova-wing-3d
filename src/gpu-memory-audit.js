// Read-only renderer.info / optional browser JS heap counters for Nova Wing.
// These values are not GPU bytes or a hardware memory measurement.
// The sampler only runs when explicitly requested or between sector boundaries.
function validCount(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}
function difference(a, b) {
  return a === null || b === null ? null : a - b;
}

export function createGpuMemoryAudit({ capacity = 48 } = {}) {
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 1024) {
    throw new RangeError('GPU memory audit capacity must be between 2 and 1024');
  }
  const history = [];
  function clear() {
    history.length = 0;
  }
  function capture(renderer, { phase = 'sample', sector = null, jsHeapBytes = null } = {}) {
    const memory = renderer?.info?.memory;
    if (!memory) return null;
    const geometries = validCount(memory.geometries);
    const textures = validCount(memory.textures);
    if (geometries === null || textures === null) return null;
    const programs = Array.isArray(renderer.info.programs)
      ? validCount(renderer.info.programs.length)
      : null;
    const sample = Object.freeze({
      phase: String(phase),
      sector: Number.isInteger(sector) && sector >= 1 ? sector : null,
      geometries,
      textures,
      programs,
      jsHeapBytes: validCount(jsHeapBytes),
    });
    history.push(sample);
    if (history.length > capacity) history.shift();
    return sample;
  }
  function report() {
    const first = history[0] ?? null;
    const last = history.at(-1) ?? null;
    const peak = history.length
      ? {
          geometries: Math.max(...history.map((x) => x.geometries)),
          textures: Math.max(...history.map((x) => x.textures)),
          programs: history.some((x) => x.programs !== null)
            ? Math.max(...history.filter((x) => x.programs !== null).map((x) => x.programs))
            : null,
          jsHeapBytes: history.some((x) => x.jsHeapBytes !== null)
            ? Math.max(...history.filter((x) => x.jsHeapBytes !== null).map((x) => x.jsHeapBytes))
            : null,
        }
      : null;
    return {
      samples: history.length,
      baseline: first,
      latest: last,
      peak,
      delta: first && last
        ? {
            geometries: difference(last.geometries, first.geometries),
            textures: difference(last.textures, first.textures),
            programs: difference(last.programs, first.programs),
            jsHeapBytes: difference(last.jsHeapBytes, first.jsHeapBytes),
          }
        : null,
    };
  }
  return Object.freeze({ capture, report, clear });
}

export function formatGpuMemoryAudit(report, { language = 'pt' } = {}) {
  if (!report?.samples) {
    return {
      en: 'GPU resources: no measured samples',
      es: 'Recursos GPU: sin muestras medidas',
      pt: 'Recursos GPU: sem amostras medidas',
    }[language] ?? 'Recursos GPU: sem amostras medidas';
  }
  const lang = ['en', 'es'].includes(language) ? language : 'pt';
  const labels = {
    pt: ['Recursos GPU (contagens, não MB)', 'Geometrias', 'Texturas', 'Programas', 'Heap JS (quando disponível)', 'Amostras'],
    en: ['GPU resources (counts, not MB)', 'Geometries', 'Textures', 'Programs', 'JS heap (when available)', 'Samples'],
    es: ['Recursos GPU (conteos, no MB)', 'Geometrías', 'Texturas', 'Programas', 'Heap JS (si está disponible)', 'Muestras'],
  }[lang];
  const { latest, delta, samples } = report;
  const value = (n, d) => n === null
    ? 'n/d'
    : n + (d === null ? '' : ' (' + (d >= 0 ? '+' : '') + d + ')');
  const heap = latest.jsHeapBytes === null
    ? 'n/d'
    : (latest.jsHeapBytes / (1024 * 1024)).toFixed(1) + ' MiB' +
      (delta.jsHeapBytes === null ? '' : ' (' + (delta.jsHeapBytes / (1024 * 1024)).toFixed(1) + ' MiB)');
  return [
    labels[0] + ':',
    labels[1] + ': ' + value(latest.geometries, delta.geometries),
    labels[2] + ': ' + value(latest.textures, delta.textures),
    labels[3] + ': ' + value(latest.programs, delta.programs),
    labels[4] + ': ' + heap,
    labels[5] + ': ' + samples,
  ].join('\n');
}
