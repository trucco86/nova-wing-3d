import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Replaced by the reproducible build with the exact GLB from src/assets.
// Embedded to keep Nova Wing deployable as ONE static offline-capable HTML.
const encodedAsset = '__NOVA7_HERO_GLB_BASE64__';
let assetBytes;

function decodedAsset() {
  if (assetBytes) return assetBytes;
  if (encodedAsset.startsWith('__')) throw new Error('NOVA-7 GLB missing from browser build');
  const binary = atob(encodedAsset);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  assetBytes = bytes.buffer;
  return assetBytes;
}

function disposeLateScene(scene) {
  scene.traverse((node) => {
    node.geometry?.dispose();
    if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
    else node.material?.dispose();
  });
}

/**
 * Lazy High-only GLB loader. Gameplay geometry remains as fallback while
 * decoding, on failure, in Medium mode and on non-NOVA7 chassis.
 */
export function ensurePremiumNova7Glb(ship) {
  if (!ship?.name?.endsWith('nova7')) return;
  const premium = ship.getObjectByName('ship-premium-details');
  if (!premium?.visible) return;
  if (ship.userData.heroGlbLoad) return;
  const state = { cancelled: false, status: 'loading' };
  ship.userData.heroGlbLoad = state;
  ship.userData.cancelPremiumGlb = () => {
    state.cancelled = true;
  };
  try {
    new GLTFLoader().parse(
      decodedAsset(),
      '',
      ({ scene }) => {
        if (state.cancelled) {
          disposeLateScene(scene);
          return;
        }
        scene.name = 'nova7-authored-gltf-hero';
        const plating = ship.getObjectByName('ship-premium-wing-armor')?.material;
        scene.traverse((node) => {
          if (!node.isMesh) return;
          node.material.userData.heroGlb = true;
          if (node.material?.name === 'NOVA7_PAINT') {
            // Keep player cosmetics on the new authored glTF meshes.
            node.material.userData.paintModule = true;
            if (plating?.color) node.material.color.copy(plating.color);
          }
          node.castShadow = false;
          node.receiveShadow = false;
        });
        premium.add(scene);
        const old = premium.getObjectByName('ship-sculpted-high-detail');
        if (old) old.visible = false;
        state.status = 'ready';
      },
      (error) => {
        state.status = 'fallback';
        state.error = String(error?.message ?? error);
      },
    );
  } catch (error) {
    state.status = 'fallback';
    state.error = String(error?.message ?? error);
  }
}
