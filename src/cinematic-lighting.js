import * as T from 'three';

// Offline, one-time reflection studio. A PMREM cubemap is created only when
// High is requested and the browser has a real WebGLRenderer. No downloads,
// no environment map rendered on every frame, no change to the game's sky.
export function createCinematicReflectionStudio() {
  const studio = new T.Scene();
  studio.name = 'nova-wing-cinematic-ibl-source';
  const dome = new T.Mesh(
    new T.SphereGeometry(32, 24, 16),
    new T.MeshBasicMaterial({ color: '#0d192c', side: T.BackSide }),
  );
  studio.add(dome);
  const cards = [
    { c: '#d9eafd', pos: [0, 12, -8], size: [20, 8] },
    { c: '#64dff0', pos: [-15, 5, 2], size: [7, 17] },
    { c: '#ffac69', pos: [13, -2, 7], size: [6, 10] },
    { c: '#5276d9', pos: [0, 2, 19], size: [16, 5] },
  ];
  for (const [index, card] of cards.entries()) {
    const panel = new T.Mesh(
      new T.PlaneGeometry(...card.size),
      new T.MeshBasicMaterial({
        color: card.c,
        side: T.DoubleSide,
        toneMapped: false,
      }),
    );
    panel.name = 'cinematic-reflection-softbox-' + index;
    panel.position.set(...card.pos);
    panel.lookAt(0, 0, 0);
    studio.add(panel);
  }
  return studio;
}

export function installCinematicIbl(renderer, targetScene) {
  // Injected renderers used by unit tests have no GPU context; do not ask them
  // to allocate a reflection target.
  if (!renderer?.isWebGLRenderer) {
    return { setQuality() {}, dispose() {}, status: 'unsupported-renderer' };
  }
  let mapTarget = null;
  let failed = false;
  let active = false;
  const previous = targetScene.environment ?? null;
  const initialIntensity = targetScene.environmentIntensity ?? 1;
  return {
    get status() {
      return failed ? 'fallback' : active ? 'high' : 'medium';
    },
    setQuality(quality) {
      if (quality !== 'high') {
        targetScene.environment = previous;
        targetScene.environmentIntensity = initialIntensity;
        active = false;
        return;
      }
      if (!mapTarget && !failed) {
        const studio = createCinematicReflectionStudio();
        let generator;
        try {
          generator = new T.PMREMGenerator(renderer);
          mapTarget = generator.fromScene(studio, 0.04, 0.1, 32);
        } catch {
          failed = true; // Do not break gameplay if PMREM is unavailable.
        } finally {
          generator?.dispose();
          studio.traverse((object) => {
            object.geometry?.dispose();
            object.material?.dispose();
          });
        }
      }
      if (mapTarget) {
        targetScene.environment = mapTarget.texture;
        targetScene.environmentIntensity = 0.65;
        active = true;
      }
    },
    dispose() {
      targetScene.environment = previous;
      targetScene.environmentIntensity = initialIntensity;
      mapTarget?.dispose();
      mapTarget = null;
      active = false;
    },
  };
}
