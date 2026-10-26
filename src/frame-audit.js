// Browser-frame cadence sampler for opt-in, on-device QA. No network/storage;
// samples are kept only in a bounded in-memory ring buffer.
export function createFrameAudit({ capacity = 3600 } = {}) {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 36000)
    throw new RangeError('capacity must be an integer between 1 and 36000');
  const frames = new Float64Array(capacity);
  let active = false;
  let last = null;
  let used = 0;
  let cursor = 0;
  let interruptions = 0;

  function clear() {
    active = false;
    last = null;
    used = 0;
    cursor = 0;
    interruptions = 0;
  }
  function start() {
    clear();
    active = true;
  }
  function stop() {
    active = false;
    last = null;
  }
  function sample(timestamp, inGameplay = true) {
    if (!active) return;
    if (!inGameplay || !Number.isFinite(timestamp)) {
      last = null;
      return;
    }
    if (last === null) {
      last = timestamp;
      return;
    }
    const ms = timestamp - last;
    last = timestamp;
    if (!Number.isFinite(ms) || ms <= 0) return;
    // A background tab, OS suspension or wake-up gap is not a slow GPU frame.
    if (ms > 1000) {
      interruptions++;
      last = null;
      return;
    }
    frames[cursor] = ms;
    cursor = (cursor + 1) % capacity;
    used = Math.min(capacity, used + 1);
  }
  function report() {
    if (!used)
      return {
        active,
        frames: 0,
        durationSeconds: 0,
        avgFps: 0,
        p95FrameMs: 0,
        over33Ms: 0,
        over50Ms: 0,
        interruptions,
      };
    const ordered = Array.from(frames.slice(0, used)).sort((a, b) => a - b);
    const durationMs = ordered.reduce((total, ms) => total + ms, 0);
    return {
      active,
      frames: used,
      durationSeconds: Number((durationMs / 1000).toFixed(2)),
      avgFps: Number((1000 / (durationMs / used)).toFixed(1)),
      p95FrameMs: Number(ordered[Math.ceil(used * 0.95) - 1].toFixed(1)),
      over33Ms: ordered.filter((ms) => ms > 33.34).length,
      over50Ms: ordered.filter((ms) => ms > 50).length,
      interruptions,
    };
  }
  return Object.freeze({ start, stop, clear, sample, report });
}

const STRINGS = {
  pt: {
    empty: 'Sem quadros medidos. Inicie e continue jogando; depois pause para ver o resultado.',
    recording: 'Medição ativa',
    finished: 'Medição encerrada',
    frames: 'quadros',
    time: 'tempo válido',
    fps: 'FPS médio',
    p95: 'tempo de quadro p95',
    jank: 'quadros acima de 33/50 ms',
    gaps: 'interrupções de aba/sistema ignoradas',
    viewport: 'tela',
    disclaimer: 'Cadência de frames do navegador, não tempo de GPU. Requer teste no aparelho.',
  },
  en: {
    empty: 'No frames measured yet. Start, resume gameplay, then pause to review.',
    recording: 'Recording',
    finished: 'Recording stopped',
    frames: 'frames',
    time: 'valid duration',
    fps: 'average FPS',
    p95: 'p95 frame time',
    jank: 'frames over 33/50 ms',
    gaps: 'ignored tab/system interruptions',
    viewport: 'viewport',
    disclaimer: 'Browser frame cadence, not GPU time. Test on a physical device.',
  },
  es: {
    empty: 'Sin cuadros medidos. Inicia, reanuda el juego y pausa para revisar.',
    recording: 'Medición activa',
    finished: 'Medición finalizada',
    frames: 'cuadros',
    time: 'tiempo válido',
    fps: 'FPS promedio',
    p95: 'tiempo de cuadro p95',
    jank: 'cuadros superiores a 33/50 ms',
    gaps: 'interrupciones de pestaña/sistema ignoradas',
    viewport: 'pantalla',
    disclaimer: 'Cadencia del navegador, no tiempo de GPU. Se requiere prueba en dispositivo.',
  },
};
export function formatFrameAudit(data, { language = 'pt', width = 0, height = 0, dpr = 1 } = {}) {
  const s = STRINGS[language] ?? STRINGS.pt;
  if (!data.frames) return s.empty;
  const lines = [
    data.active ? s.recording : s.finished,
    `${s.frames}: ${data.frames} · ${s.time}: ${data.durationSeconds.toFixed(2)} s`,
    `${s.fps}: ${data.avgFps.toFixed(1)} · ${s.p95}: ${data.p95FrameMs.toFixed(1)} ms`,
    `${s.jank}: ${data.over33Ms} / ${data.over50Ms} · ${s.gaps}: ${data.interruptions}`,
    `${s.viewport}: ${width}×${height} @${Number(dpr).toFixed(2)} DPR`,
    s.disclaimer,
  ];
  return lines.join('\n');
}
