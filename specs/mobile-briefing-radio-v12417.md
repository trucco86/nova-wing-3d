# P0 mobile briefing and radio — v1.24.17

## Behavior

- For touch gameplay, the three-second sector briefing occupies a compact upper
  information card. Pilot radio does not overlap it and the central flight corridor
  remains free. RPG, shield, score, radar and combat actions retain their lanes.
- After the briefing, the genuine pending radio message receives its normal three
  seconds of visible lifetime. Hiding the radio must not silently consume its timer.
- The briefing and radio clocks freeze while paused; restarting restores both.
- Critical shield/health and incoming-boss warnings take precedence over briefing.
- Desktop presentation and radio lifetime remain unchanged. Native gameplay keeps
  the existing timer contract.

## Verification

- Node regression uses real game messages and verifies delayed expiry, pause,
  restart and the unchanged desktop/native behavior.
- Playwright inspects the actual initial pilot message before and after briefing,
  without injecting DOM text or forcing the radio active. Test 320x568, 390x844 and
  844x390, with screenshots and bounding-box checks against RPG/radar/score/shield.
- Existing top-rail warning tests continue using real damage and verify that radio
  resumes after the intro. Critical warning precedence remains covered visually.
- Preserve the read-only committed-bundle CI gate introduced in v1.24.16.

## Delivery

Port the scoped CSS/test changes from PR #95 onto the published v1.24.16 baseline,
fix the hidden-radio timer regression and prepare v1.24.17. The maintainer has
authorized continuation and pending human release approvals; technical gates and
deployment confirmation still apply. Do not claim physical-device measurements.
