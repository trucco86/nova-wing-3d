import { createMusic, MUSIC_MODES } from '../src/audio.js';
import { createAudioCues } from '../src/audio-cues.js';
const button = document.querySelector('button'),
  result = document.querySelector('pre');
const RATE = 22050,
  HZ = 30;
async function renderTimeline(seconds, setup) {
  const context = new OfflineAudioContext(2, RATE * seconds, RATE);
  const update = setup(context);
  update(0, 0);
  let next = context.suspend(1 / HZ);
  const rendered = context.startRendering();
  for (let tick = 1; tick < seconds * HZ; tick++) {
    await next;
    update(tick, 1 / HZ);
    if (tick < seconds * HZ - 1) next = context.suspend((tick + 1) / HZ);
    await context.resume();
  }
  return rendered;
}
async function lowBand(buffer) {
  const context = new OfflineAudioContext(2, buffer.length, RATE);
  const source = context.createBufferSource(),
    low = context.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 200;
  low.Q.value = 0.707;
  source.buffer = buffer;
  source.connect(low);
  low.connect(context.destination);
  source.start();
  return context.startRendering();
}
function measure(buffer, start, end) {
  let energy = 0,
    peak = 0,
    finite = true,
    stereoEnergy = 0;
  const left = buffer.getChannelData(0),
    right = buffer.getChannelData(1);
  const a = Math.round(start * RATE),
    b = Math.min(left.length, Math.round(end * RATE));
  for (let i = a; i < b; i++) {
    finite &&= Number.isFinite(left[i]) && Number.isFinite(right[i]);
    energy += (left[i] ** 2 + right[i] ** 2) / 2;
    stereoEnergy += (left[i] - right[i]) ** 2;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  return {
    rms: Math.sqrt(energy / (b - a)),
    peak,
    finite,
    stereoRms: Math.sqrt(stereoEnergy / (b - a)),
  };
}
function expose(buffer, audio, link) {
  const channels = buffer.numberOfChannels,
    frames = buffer.length;
  const wav = new ArrayBuffer(44 + frames * channels * 2),
    view = new DataView(wav);
  const str = (offset, text) =>
    [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  str(0, 'RIFF');
  view.setUint32(4, 36 + frames * channels * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, RATE, true);
  view.setUint32(28, RATE * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, frames * channels * 2, true);
  for (let channel = 0; channel < channels; channel++) {
    const samples = buffer.getChannelData(channel);
    samples.forEach((value, frame) =>
      view.setInt16(
        44 + (frame * channels + channel) * 2,
        Math.max(-1, Math.min(1, value)) * 32767,
        true,
      ),
    );
  }
  const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
  link.href = audio.src = url;
  link.hidden = false;
}
button.onclick = async () => {
  button.disabled = true;
  let music;
  try {
    const modes = ['menu', ...MUSIC_MODES];
    const buffer = await renderTimeline(modes.length * 6, (context) => {
      music = createMusic(context);
      return (tick, dt) => {
        if (tick % (6 * HZ) === 0) music.start(0, modes[tick / (6 * HZ)]);
        music.update(dt);
      };
    });
    music.destroy();
    const bass = await lowBand(buffer);
    const metrics = modes.map((mode, index) => {
      const m = measure(buffer, index * 6, (index + 1) * 6);
      const low = measure(bass, index * 6, (index + 1) * 6);
      return { mode, ...m, bassRms: low.rms, bassFraction: (low.rms / m.rms) ** 2 };
    });
    result.textContent = JSON.stringify(metrics);
    expose(buffer, document.querySelector('audio'), document.querySelector('a'));
    document.body.dataset.audioReady = 'true';
  } catch (error) {
    music?.destroy();
    result.textContent = error.stack;
    document.body.dataset.audioReady = 'error';
  }
};
const effectsButton = document.createElement('button');
effectsButton.textContent = 'Renderizar efeitos e mixagem';
effectsButton.id = 'renderEffects';
const effectsResult = document.createElement('output');
effectsResult.id = 'effectsMetrics';
const effectsAudio = document.createElement('audio');
effectsAudio.controls = true;
const effectsLink = document.createElement('a');
effectsLink.textContent = 'Baixar efeitos e mixagem';
effectsLink.id = 'effectsDownload';
effectsLink.download = 'nova-wing-immersive-effects.wav';
effectsLink.hidden = true;
document.body.append(effectsButton, effectsResult, effectsAudio, effectsLink);
effectsButton.onclick = async () => {
  effectsButton.disabled = true;
  let cues, music;
  try {
    const events = new Map(
      [
        [0, () => cues.play('transformRobot')],
        [2, () => cues.play('transformShip')],
        [
          4,
          () => {
            cues.play('boostIgnition');
            cues.setFlight({ active: true, boosting: true });
          },
        ],
        [6, () => cues.setFlight({ active: false })],
        [7, () => cues.play('shipImpact')],
        [8, () => cues.play('explosion')],
        [9, () => cues.play('plasmaCharge')],
        [10, () => cues.play('plasmaRelease')],
        [11, () => cues.play('shot')],
        [11.3, () => cues.play('shot')],
        [11.6, () => cues.play('shot')],
        [
          12,
          () => {
            music.start(0, 'boss');
            cues.setFlight({ active: true });
          },
        ],
        [
          13,
          () => {
            cues.play('transformRobot');
            cues.setFlight({ active: true, robot: true });
          },
        ],
        [
          14,
          () => {
            cues.play('boostIgnition');
            cues.setFlight({ active: true, boosting: true, robot: true });
          },
        ],
        [15, () => cues.play('explosion')],
        [16, () => cues.play('shipImpact')],
        [
          17,
          () => {
            cues.setEnabled(false);
            music.setEnabled(false);
          },
        ],
      ].map(([seconds, event]) => [Math.round(seconds * HZ), event]),
    );
    const buffer = await renderTimeline(20, (context) => {
      cues = createAudioCues(context);
      music = createMusic(context);
      return (tick, dt) => {
        events.get(tick)?.();
        if (tick >= 12 * HZ && tick < 17 * HZ) music.update(dt);
      };
    });
    const metrics = {
      ...measure(buffer, 0, 20),
      segments: [
        ['transformRobot', 0, 1],
        ['transformShip', 2, 3],
        ['turbineBoost', 4.2, 5.8],
        ['pause', 6.3, 6.9],
        ['shipImpact', 7, 7.7],
        ['explosion', 8, 8.9],
        ['plasma', 9, 10.9],
        ['shots', 11, 11.9],
        ['combatMix', 12, 16.9],
        ['mute', 17.2, 19],
      ].map(([name, start, end]) => ({ name, ...measure(buffer, start, end) })),
    };
    cues.destroy();
    music.destroy();
    metrics.afterDestroy = cues.snapshot();
    effectsResult.textContent = JSON.stringify(metrics);
    expose(buffer, effectsAudio, effectsLink);
    document.body.dataset.effectsReady = 'true';
  } catch (error) {
    cues?.destroy();
    music?.destroy();
    effectsResult.textContent = error.stack;
    document.body.dataset.effectsReady = 'error';
  }
};
