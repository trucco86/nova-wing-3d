# QA evidence and release documentation

## Release checklist
- Record candidate version, commit SHA, environment and stable PR alias.
- Verify the delivered URL in a real browser: QA menu visible, sector and encounter selectable; production menu absent.
- Run build:check, validation, all browser shards and post-deploy smoke. A FAST pass is not release approval.
- Record manual acceptance separately from automated results; untested is not failed.
- Preserve previous stable release and verify rollback scope.

## Visual evidence manifest
For each actual capture record: file, SHA, version, environment, scenario, viewport, capture date and acceptance status. Never substitute a generated illustration for gameplay evidence.

| Capture | Required scenario | Status |
| --- | --- | --- |
| Hangar | First mission launch | Pending fresh capture |
| NOVA-7 | Rear turbines and boost | Pending fresh capture |
| Earth | City and space transition | Pending fresh capture |
| Mars | Orbit and surface | Pending fresh capture |
| Bosses | Attack, dodge and recovery | Pending fresh capture |
| HUD | Desktop and mobile | Pending fresh capture |
| Audio Lab | Five variants plus baseline | Planned |
| Flight training | Real 3D ship and controls | Planned |

## Current candidate
PR [#456](https://github.com/trucco86/nova-wing-3d/pull/456) integrates combat, audio and ship updates. Preview FAST 65/65 on 6c486fc; later head f3892ae has workflows action_required. No production approval implied. Five earlier manual acceptances remain recorded; six complementary scenarios remain pending. PR [#413](https://github.com/trucco86/nova-wing-3d/pull/413) requires reconciliation for boss attack diversity. Gameplay Quality Agent [#447](https://github.com/trucco86/nova-wing-3d/pull/447) merged; [#448](https://github.com/trucco86/nova-wing-3d/pull/448) remains a separate candidate.

## Definition of Done
Update gameplay guide, release notes and evidence when behavior changes. Review README gallery for stale screenshots. Keep planned features explicitly marked. Attach actual evidence before claiming visual acceptance. See issue [#459](https://github.com/trucco86/nova-wing-3d/issues/459).
