# Graphics 2.5 — PBR Studio Reflections + Stable Browser QA (v1.27.31)

## Design decision

Further primitive geometry alone cannot achieve a premium-looking starfighter. A physically meaningful material environment gives curvature and bevels visible contrast without adding meshes, HUD clutter or gameplay-affecting light volumes.

## Behavioral contracts

- In **Alto**, the WebGL scene gets a deterministic 256x128 equirectangular RGBA studio-reflection environment with soft cyan overhead panels, muted amber sides and fine longitudinal strip highlights.
- This texture is generated in JS from a small formula and shared; no external HDR/network requests. Three.js prefilters equirectangular reflections for physically based surfaces as required.
- In **Médio**, the environment is disabled (scene.environment=null) and the base lighting/gameplay remain unchanged.
- Visual environmental color is separate from the game sky shader; transitions from city to orbit, menus, weapons, HUD and collisions remain unchanged.
- Preserve current ACES tone mapping, controls, pause, mobile touch, language, rankings, saves and game logic.
- Browser QA timeout is raised from 12 to 15 minutes on the complete second shard after observed overrun; workflow budget raised from 15 to 20 minutes. No skips, retries or test assertions removed.

## Acceptance criteria

- `npm run release:prepare -- 1.27.31`, prettier, lint, build:check, unit validations and all four real Playwright shards on the final SHA.
- The High -> Medium -> High transition must update the environment and retain the chosen setting after reload.
- Maintain reproducible static browser HTML and the existing 2MB package budget; no new network dependencies for playing.
- Human screenshot compare on 1366×768 desktop, 844×390 mobile landscape and 390×844 portrait; measure 30 second frame-time in Alto/Médio.
- No promotion to DEV/HML/production without real visual acceptance.

## Important limitation

This is a physically based reflection pass, not a replacement for art-directed professional GLB meshes or an AAA renderer. The approved concept image remains a future fidelity target; no artificial screenshots can validate this build.
