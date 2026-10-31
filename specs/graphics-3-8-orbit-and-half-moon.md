# Graphics 3.8 — Mobile Half Moon, SUPER BOOST, Orbital Reveal

## P0 – Visual controls inspired by published accessibility guidelines

- Use a staggered **semi-circular convex thumb arc** anchored to right-hand safe area rather than rectangular 3-row grid. Right: PODS, ROLL, ROBOT, BOMB, LOCK when in mech mode, BOOST, and a larger FIRE target. Left: joystick, with orbit control above it. Keep center of gameplay free.
- Keep minimum 60×60 CSS px touch targets; never cover each other or leave viewport at 320/360/390 portrait and 844 landscape, including when LOCK is present.
- Background visual ~50% opacity on secondary controls, more legible FIRE and BOOST; touched controls highlight without changing the actual hitbox. Reference rationale: Apple Game Controls / Design great interfaces for handheld games (safe-area anchors, thumb reach) and Material Design accessibility (minimum 48dp touch targets and spacing). Do not imitate any protected graphic assets.
- During the mandatory orbital ascent, BOOST **temporarily becomes SUPER BOOST** with warm gold aura, accessible label and warning. No new control; physical hit target and bindings unchanged.
- Keep Arcade 2D gate (BOOST hidden where unsupported), Reflex Boost normal after the initial orbital mission, keyboard Shift and touch.

## P0 – Seamless Earth departure, no visual discontinuity

- Existing orbital launch game-state stays mandatory: arm after 22s, sustained boost for >=1.8s, exhaustion of energy triggers atmospheric phase, then 38s ramp to orbit. The SUPER BOOST period increases flight acceleration and reinforces the audiovisual moment while retaining actual resource cost and gating.
- Transition is staged via `src/orbit-reveal.js`: city visible until progress **0.73**, sky darkening from **0.66–0.87**, light haze **0.70–0.94**, planet starts only after **0.855** (strictly later than cityGone). Stars intensify before the Earth reveal. Moon and sun appear even later. No planet or celestial shell while city is visible.
- `launch-celestials.js` uses the same timeline for Earth, clouds, atmospheric limb, Moon and sun. Building visibility and fog/sky/star brightness share the timeline; there is no hard swap or city/planet overlap.
- Moon gains higher-resolution sphere (64×40) and crater rims, bowls, ejecta, dark maria, plus subtly varied artificial normals. No new external assets.

## P1 – Premium graphic budget

- Keep selective emission on NOVA-7/mecha from 3.6 and city instancing/green futuristic look from City 3.0.
- Preserve direct mobile rendering without heavy full-screen bloom. GLB/PBR model import, detailed textures and genuine high-end cinematic fidelity remain independent art-pipeline backlog.
- QA on Samsung Galaxy S21: Medium/High FPS and p95, city-only sky interval, no hard cut, first Earth on clean night background, readable Moon, correct obligatory SUPER BOOST feedback, multi-touch FIRE+BOOST/joystick, pause/resume, boss.
- PR isolated against Mobile Controls 3.1 / v1.27.45; do not promote DEV/HML/production before visual approval.
