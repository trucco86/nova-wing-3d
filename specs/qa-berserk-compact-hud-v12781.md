# QA Berserk compact control — mobile HUD v1.27.81 (QA)

## Problem

The QA-only Berserk test card consumed roughly 238×72 px under the permanent RPG shortcuts. On a 390×844 or 844×390 game this obscures the boss's side guns, warning labels and aim corridor. The user specifically requested no obstacles in front of boss during Stage 6.

## Change

- Preserve the existing #qaBerserkAction / #qaBerserkStatus DOM and the one-tap activation logic; the existing `qa-menu-berserk.spec.mjs` continues to validate both ATIVAR and REPETIR labels.
- Shrink the dock from 238 px to <=124 px plus a 44 px touch target. Border glows in active Berserk; detailed status remains in DOM for accessibility, not the player's 3D field of view.
- Reduce QA-only HUD notice offset so the arena opens earlier in portrait, while avoiding overlap with the button and the phone's thumb controls.
- Never show the dock in production or without an explicit developer QA session.
- No changes to combat, damage, specials, player controls, radar, boss weak points, Saturn/Europa geometry or production UI.

## QA gates

- Existing one-tap Berserk test still activates and repeats in developer launcher.
- New Playwright 390×844, 844×390, 320×568 mobile tests assert dock <=135×62, button >=44 px, click targeting, active state and no overlap with boss health/radar and thumb controls.
- Screenshots of Boss Europa before and after Berserk. Hardware iPhone High/Medium review still required.
- Stacked draft PR on #269, no production merge.
