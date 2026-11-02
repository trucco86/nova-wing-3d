/**
 * Ask the browser for media-style playback when the player enables game audio.
 * iOS Safari may otherwise route Web Audio via the Silent-mode-affected
 * ambient category; no audio elements or silent loops are needed.
 * This feature-detects the experimental Audio Session API and fails closed.
 */
export function configurePlaybackAudioSession(navigatorLike) {
  try {
    const session = navigatorLike?.audioSession;
    if (!session) return false;
    session.type = 'playback';
    return session.type === 'playback';
  } catch {
    // Missing, read-only or unsupported APIs must not block Web Audio itself.
    return false;
  }
}
