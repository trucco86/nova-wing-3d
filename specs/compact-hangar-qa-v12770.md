# Nova Wing — Compact Hangar / QA menu (v1.27.70)

## Problem

The current title hangar places five pilot avatars, a 360-degree viewer, pilot stats, ships, colors and the arsenal in one long vertical stack. On phones the pilots are pushed away from the initial interaction area. The QA shortcut unexpectedly expands all sector controls when clicked. These menus force repetitive vertical scrolling and obscure decisions.

## Scope / behavior

- Opening **HANGAR** always lands on **PILOTOS**. Its five pilot choices are visible at the beginning of the selection; the 360 viewer is adjacent on desktop and below the roster on mobile, not between unrelated menus.
- The three explicit hangar switches **PILOTOS / NAVES / ARSENAL** show only the selected category. Switching tabs does not reset pilot, ship, color, uniform or progress; existing game state and original element IDs stay intact.
- The 360 viewer remains interactive and receives the relevant subject on pilot/ship selection; mouse drag, touch drag, zoom, rotate, reset and reduced-motion remain unchanged.
- The **TESTAR FASES · QA** shortcut leads to its own compact screen with only one collapsed QA entry. A user must explicitly open it to choose stage/encounter and launch. The advanced loadout/RPG controls form a separate collapsed section.
- All expandable panels in the title menu close when changing screen; main menu and central options remain compact by default. No QA actions become visible on production origins.
- Phone portrait (390 × 844), landscape (844 × 390) and desktop (1366 × 768) must keep tabs/back buttons and key actions reachable with minimal outer-menu scrolling; no content gets clipped on short screens.

## Regression and privacy

- No modification to flight physics, campaign save, boss, shop or ranking.
- QA launch stays isolated (without saving checkpoint or leaderboard scores).
- Input accessibility: switch buttons expose `aria-pressed`, buttons stay >=44 CSS px tall; hidden categories cannot receive pointer actions.
- Strings introduced by the navigation have PT/EN/ES translations.

## Quality gates

Tests cover compact navigation, collapsed QA opening, advanced options defaults, tab switching, pilot/ship model rotation and viewport ordering. Visual screenshots, CI build consistency and full browser suite remain release gates, not assumed successes.
