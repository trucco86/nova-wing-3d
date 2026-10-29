# Nova Wing v1.27.21 — Start screen / Console-style navigation

## Problem
The web cover currently shows START, hangar, language, music, intro, account/login,
trophies, cat military ranks and ranking all together. The original approved
Five Cats poster is obscured; mobile displays require long scrolling.

## UX contract
1. `splash`: keep the original embedded artwork **centered and uncropped** (CSS `contain`).
   Only `PRESS START` appears, in the lower safe zone; Enter activates it; touch target >=62px.
2. `home`: three main choices `JOGAR`, `HANGAR`, `CENTRAL`.
   No rank, signup, FAQ, awards or options visible in the three-choice overview.
3. `play`: `INICIAR MISSÃO`, optional `CONTINUAR`, `VER ABERTURA`.
4. `hangar`: existing five cats/ship selection and complete 360° preview,
   skins, arsenal, cat military ranks. Existing game controller owns state.
5. `central`: settings, audio toggle, account/Google login, How to Play,
   five-cat ranks, trophies, leaderboard, DEV tools. Expandable cards remain closed.
6. `Esc` or `VOLTAR AO MENU` returns to home; reentering menu after exit
   from gameplay restores title splash. Pause settings stay operational.
7. Preserve old element IDs and gameplay event handlers. All 41 trophies,
   cat ranks, save checkpoints and account opt-in remain accessible.

## Engineering
- Native HTML gate and CSS data-screen view. `src/compact-menu.js` handles
  view state and keyboard routing only. It does not own game start, auth or save.
- Existing `src/game.js` owns launch/continue, 360 model selection,
  options and cinematic. Direct `Enter` during splash must never launch.
- Keep existing original `BUILD:COVER` embedded asset, no new artwork.
- Progressive menus live on the title screen; all gameplay HUD constraints remain.

## QA
- Browser tests assert 390x844, 844x390, 1366x768: artwork `contain`,
  centered pressStart, exactly three choices, central sign-in,
  hangar inspections, launch, Enter, Escape and mobile scroll.
- Existing tests are updated to traverse the same menus as real users.
- Do not declare visual approval or production release based only on CI.
