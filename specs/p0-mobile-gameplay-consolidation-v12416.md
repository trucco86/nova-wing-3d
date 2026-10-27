# P0 mobile gameplay consolidation — v1.24.16

## Goal

Provide one reviewable Web candidate for the approved P0 mobile priorities without
adding arsenal, campaign expansion, sector art or Mecha redesign work. Preserve
the existing DEV platform foundation and its host restrictions; do not provision
ranking services or enable Google authentication on GitHub Pages.

## Included behavior

- The steering thumbstick uses 128 px at 430 px portrait width, 102 px at 390 px,
  88 px at 320 px and the compact breakpoint in short landscape viewports.
- Orbit controls remain in the right-thumb action area and do not cover the ship,
  fire, boost, robot transform or pause controls.
- Boss radar, boss/subboss health, warnings, hit feedback and RPG actions stay in
  reserved upper or peripheral HUD lanes, leaving the aiming and flight corridor free.
- Weapon, special selection and special activation remain permanently reachable in
  one upper row. Opening tactical details must not hide or intercept those shortcuts.
- Difficulty remains Easy, Normal or Hard with Normal as the default for a new
  session. The longer first mission, boost-driven ascent, orbital obstacle gate and
  visible city subboss withdrawal are preserved.
- Pause keeps the four primary actions and the opt-in controls/FPS panels usable in
  narrow portrait and compact landscape.

## Observable acceptance

1. Playwright passes on desktop, mobile landscape and mobile portrait, including
   320x568, 390x844 and 844x390 checks.
2. `elementFromPoint` reaches every permanent mobile action at its visual center.
3. RPG controls, warnings, radar and health cards do not overlap the central combat
   corridor or each other at the required viewports.
4. Opening the tactical drawer keeps `specialCast` visible and clickable.
5. The generated HTML, package metadata, iOS metadata, changelog and release notes
   all identify v1.24.16.
6. Source validation, four browser shards and the isolated HML deployment use the
   same final SHA.
7. Quality, browser and Cloudflare deploy must reject a stale committed HTML before
   any build step can overwrite it. Pages must receive the verified committed file.

## Human gate

Automation does not approve touch comfort, visual density, audio, sustained FPS or
game balance. The maintainer has explicitly approved the pending human releases:
"Todas liberações que eu precisava fazer estão ok. Aprovado". This authorizes
promotion of the P0 candidate after final technical checks and deployment review.
No physical-device measurements were supplied or performed by the agent.
