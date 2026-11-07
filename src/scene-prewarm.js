/**
 * Schedule shader compilation while the mission is loading instead of when
 * an invisible planet, boss or weak-point mesh first appears on screen.
 *
 * compileAsync walks the object synchronously to collect its materials and
 * resolves later when GPU shader programs finish. Visibility is restored
 * immediately, before the next render; this never shows hidden weak points.
 * Unsupported/failing renderers keep the normal rendering path.
 */
export function prewarmSceneShaders(renderer, root, camera, targetScene) {
  if (!root || typeof renderer?.compileAsync !== 'function') return Promise.resolve(false);
  const hidden = [];
  root.traverse((part) => {
    if (!part.visible) {
      hidden.push(part);
      part.visible = true;
    }
  });
  let pending;
  try {
    pending = renderer.compileAsync(root, camera, targetScene);
  } catch {
    return Promise.resolve(false);
  } finally {
    for (const part of hidden) part.visible = false;
  }
  return Promise.resolve(pending).then(
    () => true,
    () => false,
  );
}
