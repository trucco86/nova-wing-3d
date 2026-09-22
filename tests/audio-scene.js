import { createMusic, MUSIC_MODES } from '../src/audio.js';
const button = document.querySelector('button'),
  result = document.querySelector('pre');
button.onclick = async () => {
  button.disabled = true;
  try {
    const sampleRate = 22050,
      seconds = 36,
      context = new OfflineAudioContext(1, sampleRate * seconds, sampleRate),
      music = createMusic(context);
    music.start(0);
    music.update(0);
    let next = context.suspend(0.125);
    const rendered = context.startRendering();
    for (let i = 1; i < seconds * 8; i++) {
      await next;
      if (i % 48 === 0) music.start(0, MUSIC_MODES[i / 48]);
      music.update(0.125);
      if (i < seconds * 8 - 1) next = context.suspend((i + 1) * 0.125);
      await context.resume();
    }
    const buffer = await rendered,
      samples = buffer.getChannelData(0);
    music.destroy();
    const metrics = MUSIC_MODES.map((mode, j) => {
      let energy = 0,
        peak = 0,
        finite = true;
      for (let i = j * 6 * sampleRate; i < (j + 1) * 6 * sampleRate; i++) {
        const v = samples[i];
        finite &&= Number.isFinite(v);
        energy += v * v;
        peak = Math.max(peak, Math.abs(v));
      }
      return { mode, rms: Math.sqrt(energy / (6 * sampleRate)), peak, finite };
    });
    result.textContent = JSON.stringify(metrics);
    const wav = new ArrayBuffer(44 + samples.length * 2),
      view = new DataView(wav);
    const str = (o, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    };
    str(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((v, i) =>
      view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 32767, true),
    );
    const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
    const link = document.querySelector('a');
    link.href = url;
    link.hidden = false;
    document.querySelector('audio').src = url;
    document.body.dataset.audioReady = 'true';
  } catch (e) {
    result.textContent = e.stack;
    document.body.dataset.audioReady = 'error';
  }
};
