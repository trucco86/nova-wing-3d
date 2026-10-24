# Robot transformation — release acceptance matrix

Status: **NOT YET HOMOLOGATED**. The implementation exists in PR #52; required CI is red.

| Scenario | Expected result | Evidence required |
| --- | --- | --- |
| Keyboard `T` during active play | Switches ship/robot if energy ≥15 and cooldown complete | Browser interaction test |
| Mobile ROBÔ control | Toggles state; label changes to NAVE and `aria-pressed` reflects mode | Touch browser test |
| Insufficient energy | Transformation refused without energy deduction | Deterministic unit/browser test |
| Cooldown active | Rapid repeated input does not toggle or double-charge | Fake-clock test |
| Robot combat | Damage multiplier applied; mobility reduced | Deterministic gameplay test |
| Stage restart | Robot hidden; ship visible; cooldown and button reset | Regression test |
| Shield/effects | Barrier and non-ship effects remain independent of ship visibility | Visual/browser test |
| Performance | No obvious scene-graph leak or frame regression after repeated transitions | Browser profile |
| Accessibility/localization | Controls remain usable and text follows selected language | UI review |

Before stable release: format, build, version-sync, QA and browser gates must pass on final SHA; user gameplay homologation required. This document records acceptance criteria, not completed tests.
