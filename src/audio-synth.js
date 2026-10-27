// Original procedural instruments. Buffers are cached per AudioContext, never fetched.
const buffers = new WeakMap();
export function noiseBuffer(context, color = 'white') {
  if (!context.createBuffer || !context.createBufferSource) return null;
  let cache = buffers.get(context);
  if (!cache) {
    cache = new Map();
    buffers.set(context, cache);
  }
  if (cache.has(color)) return cache.get(color);
  const rate = context.sampleRate || 44100;
  const buffer = context.createBuffer(1, rate * 2, rate);
  const samples = buffer.getChannelData(0);
  let seed = 731,
    brown = 0;
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const white = seed / 2147483648 - 1;
    brown = (brown + white * 0.025) / 1.025;
    samples[i] = color === 'brown' ? brown * 4 : white;
  }
  cache.set(color, buffer);
  return buffer;
}

export function createVoicePool(context, output, limit = 48) {
  const voices = new Set();
  function release(voice) {
    if (!voices.delete(voice)) return;
    for (const node of voice.nodes) node.disconnect?.();
  }
  function play(tone, noise = false) {
    if (voices.size >= limit || !(tone.gain > 0)) return false;
    const buffer = noise ? noiseBuffer(context, tone.color) : null;
    if (noise && !buffer) return false;
    const source = noise ? context.createBufferSource() : context.createOscillator();
    const envelope = context.createGain();
    const now = (context.currentTime || 0) + (tone.delay || 0);
    const duration = Math.max(0.025, tone.duration);
    const end = now + duration;
    const voice = { source, nodes: [source, envelope] };
    if (noise) {
      source.buffer = buffer;
      source.loop = true;
    } else {
      source.type = tone.wave || 'sine';
      source.frequency.setValueAtTime?.(tone.from, now);
      source.frequency.exponentialRampToValueAtTime?.(tone.to || tone.from, end);
    }
    let tail = source;
    if (tone.filter && context.createBiquadFilter) {
      const filter = context.createBiquadFilter();
      filter.type = tone.filterType || 'lowpass';
      filter.frequency.setValueAtTime(tone.filter, now);
      if (tone.filterEnd) filter.frequency.exponentialRampToValueAtTime(tone.filterEnd, end);
      filter.Q.value = tone.q ?? 0.7;
      tail.connect(filter);
      tail = filter;
      voice.nodes.push(filter);
    }
    tail.connect(envelope);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(
      tone.gain,
      now + Math.min(duration * 0.4, tone.attack || 0.008),
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    if (context.createStereoPanner && tone.pan) {
      const pan = context.createStereoPanner();
      pan.pan.value = tone.pan;
      envelope.connect(pan);
      pan.connect(output);
      voice.nodes.push(pan);
    } else envelope.connect(output);
    voices.add(voice);
    source.onended = () => release(voice);
    source.start(now);
    source.stop(end + 0.025);
    return true;
  }
  return {
    tone: (tone) => play(tone),
    noise: (tone) => play(tone, true),
    count: () => voices.size,
    silence() {
      for (const voice of [...voices]) {
        try {
          voice.source.stop();
        } catch {
          /* source already ended */
        }
        release(voice);
      }
    },
  };
}
