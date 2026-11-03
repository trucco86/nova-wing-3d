# Boss Tactical Identity 1.0 — Nova Wing 1.27.77 (QA)

## Tactical design reference

Reference mechanic: _Panzer Dragoon Saga_ places the player in sectors around an enemy, with a danger radar, deliberate repositioning, risk near weak points, and attack windup. This work reinterprets the **decision system**, never Sega designs, assets, melodies or exact boss attacks.

Historical sources:

- https://strategywiki.org/wiki/Panzer_Dragoon_Saga/Battles
- https://www.digitpress.com/library/manuals/saturn/panzer_dragoon_saga.pdf
- https://gamefaqs.gamespot.com/saturn/198258-panzer-dragoon-saga/faqs/27452

## Implemented vertical slice

| Sector | Boss     | Physical attack variants             | Dangerous area and counterplay                                                 | Model/Radar origin                            |
| ------ | -------- | ------------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------- |
| 1      | Rok      | Pinça convergente; investida frontal | Wide horizontal hit lane (climb) vs aimed ellipse (dodge sideways)             | Animated independent wing-banks               |
| 2      | Stingray | Tesoura vertical; ferrão             | Narrow high scissor zone (dodge sideways); stinger ellipse (evade from center) | Animated wing vanes and tail                  |
| 3      | Carbide  | Broca reta; varredura transversal    | Direct frontal ram vs horizontal drill crosscut (change altitude)              | Spinning drill rig with lateral tilt          |
| 9      | Orion    | Pulso gravitacional; raio da íris    | Circular pulse (leave center) vs narrow vertical iris strip (shift sideways)   | Pulsing lens rotates into laser configuration |

## Combat integrity

- Intents are chosen at **windup** from the actual pilot position, altitude, boost and orbit, then frozen for the attack, never teleport-targeting after the warning.
- A new pure, shared `bossExclusiveFootprint(kind)` returns the **same physical shape and radius** for both boss collision and radar.
- The existing warning clock, health, pause, boss battery destruction, projectile emission, actual muzzle hardware and safe point solver remain intact.
- Each of the four bosses has different geometry on the HUD; all retained `barrage` recovery cycles.
- Hardpoints for melee/ray threats match named visible animated model parts. The radar attack origin projects the actual world position of that part instead of inventing a central muzzle.
- Existing Stage 4 Devastador, Stage 5 Phoenix, Stage 6 Europa, Stage 7 Hydra, Stage 8 Omega, and Stage 10 Marvin attack logic are **unchanged**. All previously approved gameplay must remain intact.

## Quality gates

- New Node cases for eight attack kinds (including 2 per family), radar collision/safe path agreement, fixed target, and animated windup on real 3D models without moving hitboxes.
- Browser Playwright snapshots for all four bosses, both desktop and emulated mobile, verifying true boss HUD, radar threat origin, safe marker and warnings at real windup.
- User visual inspection on real iPhone required for warning text, camera framing, and FPS modes Alto/Médio.
- Production not touched, draft stacked PR on 1.27.76.

## Following P1 slices (issue #264)

- Europa: crackable ice clusters that reorganize safe altitude lanes, maintaining locked cryo-pincer and ice-quake.
- Hydra: linked snake heads with independent attack origins and paired safe sectors.
- Omega: side armament, biting/fang and articulated tentacles, separate timing with 1.8-second lateral tracking retained.
- Marvin: counter-attack lessons for boost, robot, front, flank and rear with distinct windups.
- Phoenix and Devastador are already distinctive; refine telegraph clarity rather than erase approved structures.
