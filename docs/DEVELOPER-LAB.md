# Nova Wing Developer Lab

## Permanent development contract

Developer and homologation environments must retain a discoverable QA menu, direct sector and boss access, and the Audio Lab. Production and native production builds must not expose these controls or apply experimental selections.

For each requested subjective change (audio, music, visual effects, camera or gameplay tuning), provide the current approved baseline and, where feasible, five distinct alternatives. Allow audition or preview, in-context testing, reset and export of selections. Record the candidate identifier, build SHA, environment and explicit approval before promoting a selection. Never silently replace the approved baseline.

## Release gates

- Verify the menu on both PR aliases and immutable preview URLs, as well as dev and homologation hosts.
- Verify the menu is absent and experimental settings cannot affect production gameplay.
- Verify direct boss and sector navigation remains available in QA.
- Verify selection, preview, reset and export for each supported lab.
- Keep experiments session-scoped and independent of campaign saves.
- Require explicit approval and normal CI, smoke and rollback gates before promotion.

## Scope

Audio Lab is the first implementation. Music, visual, camera and gameplay labs are incremental extensions, not yet delivered by this document.
