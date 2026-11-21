import * as T from 'three';
import { createGame } from '../src/game.js';
import { installMobileRpgAccordion } from '../src/mobile-rpg.js';
import { installCompactMenu } from '../src/compact-menu.js';
import { defeatBoss } from './combat-helper.mjs';
import { SECTORS } from '../src/campaign.js';
const params = new URLSearchParams(location.search);
const sector = Number(params.get('sector') ?? 0);
localStorage.setItem(
  'nova-wing-3d-v1',
  JSON.stringify({
    version: 1,
    sector,
    credits: 650,
    weapon: 0,
    armor: 0,
    pods: Number(params.get('pods') ?? 0),
    strategy: { xp: Number(params.get('xp') ?? 0), arsenal: 0, special: 0 },
  }),
);
let rendering = true,
  capture = true;
let lastRenderStats = null;
let lastScene = null;
const game = createGame({
  autoLoop: false,
  // Test the actual pre-mission flow without starting a requestAnimationFrame
  // loop or altering the other deterministic browser fixtures.
  preflightMap: params.get('preflight') === '1',
  // Existing gameplay probes skip the pre-mission film; opt in with ?intro=1
  // for dedicated browser assertions of the real Five Cats opening.
  enableSquadIntro: params.get('intro') === '1',
  enableAsteroidCourse: params.get('asteroidCourse') === '1' || params.get('encounters') === '1',
  spawnEncounters: params.get('arcade') === '1' || params.get('encounters') === '1',
  // Explicit opt-out keeps legacy encounter tests isolated. In ordinary
  // gameplay and encounter-enabled fixtures, the authored train/boost path remains on.
  enableCitySetpieces: params.has('citySetpieces')
    ? params.get('citySetpieces') === '1'
    : params.get('encounters') === '1',
  rendererFactory(options) {
    const renderer = new T.WebGLRenderer(options);
    const render = renderer.render.bind(renderer);
    renderer.render = (...args) => {
      if (!rendering) return;
      // A physically based reflection cubemap triggers internal PMREM renders.
      // They are NOT the game world, and must never replace the test's scene
      // reference or GPU counters. Postprocessing passes likewise do not
      // represent gameplay draw calls.
      const realWorld = Boolean(
        args[0]?.fog?.isFogExp2 || args[0]?.getObjectByName?.('launch-city'),
      );
      if (realWorld) lastScene = args[0];
      render(...args);
      if (realWorld) {
        lastRenderStats = {
          calls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          lines: renderer.info.render.lines,
          points: renderer.info.render.points,
        };
      }
    };
    return renderer;
  },
});
// The visual test server must install the same RPG controller as src/main.js.
// Otherwise the fixture silently exposes raw hidden markup instead of gameplay UX.
installCompactMenu();
installMobileRpgAccordion({ game });
function advance(seconds, { renderAfter = true } = {}) {
  // Fast deterministic simulation can postpone the expensive software-GPU
  // frame until a visual checkpoint, without skipping physics or game logic.
  rendering = false;
  for (let t = 0; t < seconds - 1e-8; t += 0.05) game.step(Math.min(0.05, seconds - t));
  rendering = capture && renderAfter;
  game.step(0);
  rendering = capture;
}
window.fixture = {
  game,
  advance,
  renderStats: () => (lastRenderStats ? { ...lastRenderStats } : null),
  europaCavernState() {
    const root = lastScene?.getObjectByName('europa-cathedral-ice-cavern');
    const tunnel = root?.parent;
    return root
      ? {
          visible: root.visible,
          visualOnly: root.userData.visualOnly,
          batches: root.children.map((o) => ({ name: o.name, count: o.count ?? 0 })),
          breachPanel: Boolean(tunnel?.getObjectByName('europa-tunnel-breach-panel')),
          length: tunnel?.userData.length ?? null,
          renderCalls: lastRenderStats?.calls ?? 0,
        }
      : null;
  },

  alienWorldState(theme) {
    if (!lastScene) return null;
    const site = lastScene.getObjectByName('alien-architecture-' + theme);
    const globe = lastScene.getObjectByName('destination-celestial-body');
    const hero = lastScene.getObjectByName('europa-sunken-alien-vault-hero');
    const canyon = lastScene.getObjectByName('europa-premium-crystal-canyon');
    const frozenSurface = lastScene.getObjectByName('europa-frozen-surface');
    const matrix = new T.Matrix4();
    if (hero) hero.getMatrixAt(0, matrix);
    return {
      exists: Boolean(site),
      visible: site?.visible ?? false,
      siteName: site?.userData.site ?? null,
      structures: site?.children.map((node) => node.name) ?? [],
      heroDepth: hero ? matrix.elements[14] : null,
      heroX: hero ? matrix.elements[12] : null,
      heroBatchCount: hero?.count ?? 0,
      canyon: canyon
        ? {
            visible: Boolean(frozenSurface?.visible && canyon.visible),
            cyanCount: canyon.getObjectByName('europa-canyon-crystal-cyan')?.count ?? 0,
            violetVisible: canyon.getObjectByName('europa-canyon-crystal-violet')?.visible ?? false,
            cliffs: canyon.getObjectByName('europa-canyon-grounded-cliffs')?.count ?? 0,
            bridges: canyon.getObjectByName('europa-canyon-ancient-bridges')?.count ?? 0,
            gateway: Boolean(canyon.getObjectByName('europa-canyon-distant-alien-gateway')),
          }
        : null,
      visualOnly: site?.userData.visualOnly ?? false,
      giantGenericOrb: lastScene.getObjectByName('orion-generic-planet') !== undefined,
      globeVisible: globe?.visible ?? false,
      ringsAttachedToSaturn: Boolean(lastScene.getObjectByName('saturn-planetary-ring-system')),
      render: lastRenderStats ? { ...lastRenderStats } : null,
    };
  },

  // QA151: prove the LIVE WebGL world actually uses the soft dust map, not
  // just a detached createMarsSandstorm() object in a unit test.
  marsDustVisualState() {
    const storm = lastScene?.getObjectByName('mars-sandstorm');
    const dots = storm?.getObjectByName('mars-sandstorm-particle-field');
    const map = dots?.material?.map;
    const data = map?.image?.data;
    const width = map?.image?.width ?? 0;
    const height = map?.image?.height ?? 0;
    return {
      stormVisible: storm?.visible ?? false,
      pointCount: dots?.geometry?.attributes?.position?.count ?? 0,
      isNativeMap: Boolean(map?.isDataTexture),
      textureWidth: width,
      textureHeight: height,
      cornerAlpha: data?.[3] ?? null,
      centerAlpha: data
        ? data[(Math.floor(height / 2) * width + Math.floor(width / 2)) * 4 + 3]
        : null,
    };
  },
  // QA122 visual proof: inspect real WebGL scene and static urban GPU batches,
  // never a mocked HUD or a separate synthetic moon.
  city122State() {
    if (!lastScene) throw new Error('QA122 real scene was not rendered');
    const moon = lastScene.getObjectByName('world-orbital-globe');
    const realMoon = lastScene.getObjectByName('launch-orbit-moon');
    const tiles = ['launch-city', 'launch-city-far'].map((name) => {
      const tile = lastScene.getObjectByName(name);
      const root = tile?.getObjectByName('city122-lived-in-street-blocks');
      if (!tile || !root) throw new Error('QA122 street or duplicated road tile is absent');
      return {
        name,
        visible: tile.visible && root.visible,
        mediumBatches: root.getObjectByName('city122-visible-street-life-medium').children.length,
        highBatches: root.getObjectByName('city122-extra-street-furniture-high').children.length,
        quality: root.userData.quality,
        lots: root.userData.sidewalkParcels.length,
        outerLots: root.userData.outerParcels.length,
        groundCells: root.userData.groundCells.length,
        groundKinds: [...new Set(root.userData.groundCells.map((lot) => lot.type))],
        vaporPlumes: root.userData.vaporSources.length,
        groundSignals: root.userData.groundSignalIndices.length,
        outerKinds: [...new Set(root.userData.outerParcels.map((lot) => lot.kind))],
        occupiedSidewalks: root.getObjectByName('city122-grounded-pedestrian-pavements').count,
        storefronts: root.getObjectByName('city122-real-ground-floor-storefront-glazing').count,
        trees: root.getObjectByName('city122-grounded-street-tree-canopies').count,
        pedestrians: root.userData.pedestrians?.length ?? 0,
        adScreens: tile.getObjectByName('city-premium-ad-inventory')?.userData.total ?? 0,
      };
    });
    return {
      tiles,
      moon: {
        visible: moon?.visible ?? false,
        fractured: moon?.material?.uniforms?.crackIntensity?.value === 1,
        x: moon?.position.x ?? null,
        y: moon?.position.y ?? null,
        z: moon?.position.z ?? null,
        backgroundDepth: moon?.material?.uniforms?.backgroundDepth?.value ?? null,
        orbitalFractured: realMoon?.material?.fragmentShader.includes('branchA') ?? false,
        realOrbitalMoonVisible: realMoon?.visible ?? false,
      },
      citySky: lastScene.getObjectByName('launch-sky-dome')?.material?.uniforms?.cityGlow?.value,
    };
  },
  // Private QA fixture only: render exact same camera and clock with and
  // without the new 285m architecture; production has no such debug switch.
  graphics40Horizon() {
    if (!lastScene) throw new Error('QA visual scene was not initialized');
    const landmark = lastScene.getObjectByName('city40-distant-signature');
    return landmark
      ? {
          visible: landmark.visible,
          metrics: { ...landmark.userData.metrics },
          localZ: landmark.userData.localZ,
          visualOnly: landmark.userData.visualOnly,
          aperture: landmark.userData.aperture ? { ...landmark.userData.aperture } : null,
        }
      : null;
  },
  graphics40Details() {
    const tiles = [];
    if (!lastScene) throw new Error('QA scene not rendered');
    lastScene.traverse((node) => {
      if (node.name !== 'city40-hero-architecture') return;
      const masonry = node.getObjectByName('city40-sculpted-masonry')?.material;
      const glass = node.getObjectByName('city40-deep-bay-glazing')?.material;
      tiles.push({
        variant: node.userData.variant,
        buildings: node.userData.buildings.length,
        supportedSideRibbons: node.userData.corridorFacades.reduce(
          (sum, facade) => sum + (facade.supportedRibbonCount ?? 0),
          0,
        ),
        metrics: { ...node.userData.metrics },
        reflectionFaces: masonry?.envMap?.images?.length ?? 0,
        reflectionsShared: Boolean(masonry?.envMap) && masonry.envMap === glass?.envMap,
        batches: node.children.flatMap((group) => group.children).length,
      });
    });
    return tiles;
  },
  graphics40Visible(enabled) {
    if (!lastScene) throw new Error('QA visual scene was not initialized');
    let roots = 0;
    lastScene.traverse((node) => {
      // The scenic landmark is non-playable and joins this comparison
      // without changing the two-tile public QA fixture contract.
      if (node.name === 'city40-distant-signature') {
        node.visible = !!enabled;
        return;
      }
      if (node.name !== 'city40-hero-architecture') return;
      node.visible = !!enabled;
      roots++;
    });
    rendering = true;
    game.step(0);
    return { roots, stats: lastRenderStats ? { ...lastRenderStats } : null };
  },
  hangar() {
    capture = false;
    // Exercise the first-sector launch with the same keyboard controls as the
    // player. A timed wait alone must never bypass BOOST exhaustion.
    if (sector === 0) {
      advance(23);
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'ShiftLeft',
          key: 'Shift',
          bubbles: true,
          cancelable: true,
        }),
      );
      advance(3.6);
      window.dispatchEvent(
        new KeyboardEvent('keyup', {
          code: 'ShiftLeft',
          key: 'Shift',
          bubbles: true,
          cancelable: true,
        }),
      );
      advance(38.3);
    }
    const duration = SECTORS[sector].duration;
    advance(Math.max(0, duration + 6 - game.snapshot().seconds));
    defeatBoss({ game, advance });
    capture = rendering = true;
    game.step(0);
  },
};
// QA encounter variants start from the same authorized developer path that
// players use, not from an artificial HUD mock or an incomplete wave timer.
// These URLs exist only on the localhost visual fixture server.
const qaSector = params.get('qaBoss');
const qaSubboss = params.get('qaSubboss');
const qaTunnel = params.get('qaTunnel');
if (qaTunnel !== null) {
  if (!game.startDeveloperScenario(Number(qaTunnel), 'tunnel'))
    throw new Error('Developer/QA Europa tunnel fixture unavailable');
} else if (qaSubboss !== null) {
  if (!game.startDeveloperScenario(Number(qaSubboss), 'subboss'))
    throw new Error('Developer/QA subboss fixture unavailable');
} else if (qaSector !== null) {
  if (!game.startDeveloperScenario(Number(qaSector), 'boss'))
    throw new Error('Developer/QA boss fixture unavailable');
} else game.start(true);
game.step(0);
document.body.dataset.ready = 'true';
