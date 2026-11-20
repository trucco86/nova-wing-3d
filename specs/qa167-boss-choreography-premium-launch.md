# QA167 | Boss contact and Six-shot Five Cats Launch

## Objective

Fix the gameplay feedback that repeated boss attacks look like a generic body zoom, and restore the stage-one opening inspired by classic rail shooters. Do not copy Nintendo assets, audio, choreography or branded scene details.

## Boss behaviour

- Only authored charges (bite, drilling ram, plasma dive, Rok ram and Stingray sting) translate the entire boss toward the camera.
- Claws, arms, tentacles and area weapons keep the body still and use their existing visible articulated components/VFX. Preserve original hitboxes and attack target locking at windup.
- The one-shot logical attack check is aligned with the apex of the existing 1.4s visual strike (0.7s), not an earlier arbitrary frame threshold. Manual orbit, dodging, weak points and broken hardware gates remain effective.
- Early phases now avoid two consecutive identical authored attack families when the previous attack is known, even before the pilot-pattern reader has enough samples. Bosses with damaged hardware are not assigned unavailable weapons.
- Limits: this patch improves audiovisual coherence, but does NOT assert exact triangle-to-hull collisions for every appendage. Visual/physics verification is required; do not describe this as physically simulated contact across all ten bosses.

## Stage-one launch

- Extend from 5.0s/four shots to 7.5s/six readable shots: wide hangar -> active cat/pilot -> side of launch deck -> front of opened exit -> rear follow -> exact gameplay chase camera.
- Clearly model the door threshold and external gate. Move the visual-only hangar past the five real spacecraft; maintain low and bounded mesh count.
- The hero remains the existing gameplay craft, selected by pilot, hull and skin. Four other distinct squad ships escort it. No placeholder hero mesh or substitution on handoff.
- Retain pause/skip behaviour, player clock freeze, no extra collisions/projectiles, keyboard and mobile compatibility.

## QA gates

1. Node: tests/stage-one-launch-intro.test.mjs, tests/five-cats-formation-supers.test.mjs, tests/qa167-boss-physical-contact.test.mjs and preflight tests.
2. npm run format:check, npm run build:check, npm run validate; Chromium desktop + 390x844 phone viewport.
3. At least one complete encounter each for Europa, Hydra, Omega and Marvin. Manually record 3 successive attacks and validate actual limb contact (not a fullscreen zoom), radar match, dodge window and attack diversity.
4. Capture every intro shot in desktop/portrait and check pilot model, paint, relative geometry, exit gates and transition. Measure physical iPhone FPS/memory before production.
5. Separate preview only. No production merge or deployment without explicit approval.

## Integration

Stacked on PR #406 (stage-one cinematic launch). Avoid independent cherry-picks into main because the source and generated index.html must be synchronized with QA167. Other performance/asteroid PR stacks remain independent.
