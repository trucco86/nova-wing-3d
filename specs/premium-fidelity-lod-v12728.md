# Nova Wing — Graphics 2.2 / Fidelity + Near LOD (QA)

## Purpose

The v1.27.28 browser-only graphics package makes metallic surfaces and city depth richer without increasing baseline mobile demands. This is a real WebGL render change, not an AI-generated screenshot.

## Observable behavior

- A deterministic 32×32 unsigned-byte RGBA tangent-space micro-normal texture is shared by the NOVA-7, Aegis and Specter physical materials. No remote asset is required.
- High mode adds instanced holographic facade panels, luminous borders, rooftop beacons and ambient flying traffic; objects remain outside the flight corridor.
- A city-premium-near-lod group is visible on the foreground city tile in High mode only and always hidden on the far repeating tile, while the large skyline remains available.
- Medium mode omits all new detail draw calls. Changes do not affect gameplay, HUD, save, difficulty, robot, keyboard, touch, ranking or localization.
- The game remains a static Three.js/WebGL page that can run directly in the browser.

## Mandatory gates

- release:prepare 1.27.28, format, build, build:check, validate and all four browser CI shards on the final commit.
- Mobile/desktop visual comparison and physical FPS/frame-time measurements in High and Medium for 30 seconds; test 1366×768, 844×390 and 390×844.
- No promotion to DEV, HML or production without human visual and technical acceptance.

## Limitations

This is not an imported GLB/PBR asset pack, photorealistic lighting or ray tracing. The concept art remains a reference; screenshot claims must come from a running build.
