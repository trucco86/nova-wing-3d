# Elite Boss Counterplay 1.0 — Nova Wing v1.27.79 (QA)

## Objective
Distinct, readable attack strategies for the four advanced bosses, inspired by the *decision logic* of Panzer Dragoon Saga (not direct boss patterns, assets, sound effects, or animations).

### Europa — glacial lane controller
- Retains **ice-quake** and **cryo-pincer** collision/radar rules, previously validated.
- The wide quake now has six actual cosmetic crystals which grow in the windup and spike outward at impact, visually distinct from the arms closing during a pincer.
- No new hazard or hardpoint; crystals are visual-only and all generator positions remain unchanged.

### Hydra — seven heads, two-head crossfire
- On final combat phase, when the pilot lingers on a flank without boost and both batteries are operational, two visible mouths prepare a paired beam across a *narrow altitude lane*.
- A red horizontal band on the radar is the **same physical damage rectangle** as the actual attack; moving above or below evades it.
- Both firing mouths are named, tangible 3D objects on the 0th and 3rd Hydra heads. Glow/laser beams appear only while this attack is active.
- Destroying either generator prevents new paired attacks; damage from an attack already queued is cancelled if an emitter is destroyed before the strike. The surviving head may still engage with other attacks.

### Ômega — destructible appendages genuinely change tactics
- Existing phase 8 Saturn mechanic, 1.8s flank lock, orbit/aim controls and bite/claws/tentacles/hammer are **preserved**.
- If the generator powering the approached flank's claw is broken, Ômega uses its surviving tentacle instead. When both batteries are destroyed, it relies on an emergency ranged salvo, not an invisible physical hit.
- Radar warning source is now the actual jaw, claw or surviving tentacle mesh; public attack family labels remain stable so prior scenarios are not broken.
- User weakpoint and boss-part positions and all Saturn rings remain stationary.

### Marvin — Obsidian fighter defends the rear
- Marvin retains front bite, side claws, altitude/boost tracking tentacles and robot counters.
- From phase 2 onward, a sustained rear approach triggers a visible **aft-thruster horizontal sweep**, telegraphed by a thruster rig added to the *real visible fighter shell*.
- The damage footprint is a wide, shallow horizontal rectangle: changing altitude escapes; no retargeting after windup.
- Higher altitude/boost still has the established tracking grab; robot still receives the claw counter.

## Implementation safeguards
- Physical and radar footprints are reused through bossExclusiveFootprint(kind).
- The same frozen windup intent locks target coordinates. All new visual geometry is flagged visual-only.
- Keep the 1.27.78 actual cannon-to-bullet connection, version 1.27.77 four first-boss variants, approved Stage 4 Devastador, Stage 5 Phoenix, Saturn, mobile ORBITAR, and RPG.
- No untelegraphed hits, teleportation, hidden cannon fire or increased projectile budget.

## QA evidence / acceptance
- Node tests select and verify attacks with pilot inputs and generator states, exact radar safe direction, named emitters and visual animation, and locked hitboxes.
- Browser: real Europa, Hydra, Omega, Marvin encounters desktop/mobile with screenshots, pageerror and tactical HUD assertions.
- iPhone physical portrait/landscape: read distinct charge/attack/recovery, confirm visible laser sources, test side/rear orbit in Stage 8 and stage 10, check FPS High/Medium and overlapping HUD.
- **Production blocked** until complete CI, four browser shards, real device inspection and user acceptance.
