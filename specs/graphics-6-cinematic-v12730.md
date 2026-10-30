# P0 — Nova Wing Graphics 6.0: Cinematic Flagship, Studio IBL and Boost VFX

Base: Graphics 5.0 PR #178, 375/375 unit tests and 4/4 Playwright green. Candidate version: 1.27.30. PR is QA draft; no DEV/HML/PROD promotion.

## Scope implemented

- **Devastador, flagship:** replaces the rectangle-dominated mother ship visible in High with a custom mesh of tapered spear hull, swept bevelled armored wings, integrated engine pods, glossy cockpit and visible lit boss-bay frame. Medium uses original parts. Existing named launch bay remains visible in both profiles; physical boss logic/collision unchanged.
- **Lighting:** a one-time GPU PMREM reflection cubemap baked from four studio light cards. It is an original offline-generated environment, not an external HDRI. Browser High gets improved metal reflections in gameplay and hangar, Medium restores original environment. If PMREM is unsupported, the scene falls back without crash. No always-on lights or render-to-texture per gameplay frame.
- **Boost:** new original layered, additive plasma cores/envelopes with halo glow for hero fighter and mecha. Animation driven by true boost and game time. High-only, safe on switching to Medium, no gameplay stats changed.
- Core mechanics, hitboxes, save, sound, HUD, weapon origin and ranking unchanged.
- Honesty: this is still a visual vertical slice. True reference concept fidelity also requires original modeled/UV authored GLB assets and high-resolution licensed maps across all bosses/environments.

## Acceptance

- Exactly one mother ship body per quality; separate launch bay consistently readable, boss emerges from mother ship.
- High fighter and mecha plasma show visibly stronger discharge while boosting, no HUD occlusion. FPS/frame-time 30s measured independently in mobile landscape and desktop.
- Studio reflections on metal (highlight shape/softboxes) visible in 360 hangar and game; environment does not cover original space/star background.
- No asset fetches, new external services, or runtime GLB downloads.
- Auto/Medium/High switching persists; mobile controls and transformations preserved.

## Gates

- Release prepare 1.27.30, format, deterministic bundle, lint, unit suite, CI Playwright 4/4, Source Repair, Cloudflare isolated preview, human visual validation on actual devices.
- Prioritize GLB authoring + original texture atlas, artist pass on fighter/mecha and other sectors immediately after this QA slice.
