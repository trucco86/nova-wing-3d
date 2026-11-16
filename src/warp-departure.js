import * as T from 'three';

/**
 * Preserve the existing eight-second stage progression so hangar, checkpoints
 * and the unique Devastador finale retain their tested timing. Extend only the
 * visible warp portion by activating the automatic jump earlier.
 */
export const VICTORY_EXIT_SECONDS = 8;

/** One radio lane and one speaker at a time, driven by simulation time. */
export const VICTORY_RADIO_BEATS = Object.freeze([
  Object.freeze({
    at: 0.6,
    speaker: 'bia',
    text: 'ALVO NEUTRALIZADO! FIVE CATS, REAGRUPAR NA MINHA ASA.',
  }),
  Object.freeze({
    at: 2.8,
    speaker: 'bob',
    text: 'ESQUADRÃO REUNIDO. COORDENADAS DE SAÍDA CONFIRMADAS!',
  }),
  Object.freeze({
    at: 5.4,
    speaker: 'calvin',
    text: 'CORREDOR LIVRE. PREPAREM OS MOTORES: SALTO DE LUZ!',
  }),
]);

export function victoryDialogueAt(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid victory time');
  let beat = null;
  for (let index = 0; index < VICTORY_RADIO_BEATS.length; index++) {
    if (seconds >= VICTORY_RADIO_BEATS[index].at)
      beat = { ...VICTORY_RADIO_BEATS[index], index };
  }
  return beat;
}

/**
 * Regular boss victory flight: explosion at 4.7s, squad departure dialogue,
 * then optional BOOST at 4.9s or automatic launch at 5.8s.
 * The warp never changes scoring, gameplay time or the final-boss escape.
 */
export function warpExitAt(seconds, boostHeld = false) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid victory time');
  const ready = seconds >= 4.9;
  const active = ready && (boostHeld || seconds >= 5.8);
  return { ready, active, speed: active ? 420 : 0 };
}

/**
 * Cheap, depth-tested 3D speed streaks attached to the in-game flight position.
 * Works on the first three sectors even when no destination vista is active.
 */
export function createWarpStreaks() {
  const count = 48;
  const points = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963;
    const radius = 9 + (i % 5) * 3.5;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius * 0.66;
    const z = -18 - (i % 9) * 8;
    const offset = i * 6;
    points.set([x, y, z, x * 1.14, y * 1.14, z - 48 - (i % 4) * 9], offset);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(points, 3));
  const material = new T.LineBasicMaterial({
    color: '#a3e9ff',
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
  });
  const streaks = new T.LineSegments(geometry, material);
  streaks.name = 'boss-victory-light-speed-streaks';
  streaks.userData.visualOnly = true;
  streaks.frustumCulled = false;
  streaks.visible = false;
  return streaks;
}

export function updateWarpStreaks(streaks, active, seconds, position) {
  if (!streaks) return;
  streaks.visible = active;
  if (!active) return;
  streaks.position.copy(position);
  streaks.scale.z = 1 + Math.min(0.6, Math.max(0, seconds - 4.9) * 0.3);
}
