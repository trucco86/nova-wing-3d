const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** A bounded continuous synthetic engine sound using the game's AudioContext. */
export function createMechaThrusterAudio(context) {
  const output = context.createGain();
  output.gain.value = 0;
  output.connect(context.destination);
  const tones = [context.createOscillator(), context.createOscillator()];
  const gains = tones.map(() => context.createGain());
  tones.forEach((tone, i) => {
    tone.type = i === 0 ? 'sawtooth' : 'triangle';
    tone.frequency.value = i === 0 ? 62 : 126;
    gains[i].gain.value = i === 0 ? 0.042 : 0.013;
    tone.connect(gains[i]);
    gains[i].connect(output);
    tone.start();
  });
  let destroyed = false;
  let amplitude = 0;
  let velocity = 0;
  function update({ dt = 0, active = false, boosting = false, accelerating = 0, volume = 1 } = {}) {
    if (destroyed) return;
    const enabled = active && context.state !== 'suspended' && volume > 0;
    const target = enabled ? clamp(boosting ? 1 : 0.36 + Math.abs(accelerating) * 0.3, 0, 1) : 0;
    const speed = 1 - Math.exp(-clamp(dt, 0, 1) * (target > velocity ? 6 : 13));
    velocity += (target - velocity) * speed;
    amplitude += (velocity * clamp(volume, 0, 1) - amplitude) *
      (1 - Math.exp(-clamp(dt, 0, 1) * 15));
    output.gain.value = clamp(amplitude, 0, 1);
    const now = context.currentTime;
    [62 + 42 * velocity, 126 + 100 * velocity].forEach((hz, i) =>
      tones[i].frequency.setValueAtTime(hz, now));
  }
  function silence() {
    amplitude = 0;
    velocity = 0;
    output.gain.value = 0;
  }
  function destroy() {
    if (destroyed) return;
    silence();
    destroyed = true;
    tones.forEach((tone) => {
      try { tone.stop(); } catch { /* already stopped */ }
      tone.disconnect();
    });
    gains.forEach((gain) => gain.disconnect());
    output.disconnect();
  }
  return {
    update, silence, destroy,
    snapshot: () => ({ destroyed, amplitude, velocity, voices: destroyed ? 0 : 2 }),
  };
}
