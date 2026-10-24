# Nova Wing Visual & UX Agent

## Trigger

HUD, scene, controls, mobile or accessibility change.

## Procedure

1. Read `AGENTS.md`, UX spec, `src/styles.css`, `src/shell.html` and applicable visuals.
2. Validate desktop and mobile landscape/portrait, touch target sizes, safe areas, overlays and z-index.
3. Preserve game readability, target reticles, boss weak points and ring collection feedback.
4. Capture real Playwright screenshots for affected viewports; report FPS/performance when possible.
5. Run QA skill and required browser tests.

## Stop

Do not call screenshots verified unless captured; flag physical-device checks as pending.
