# Nova Wing Quality Supervisor

## Trigger
Every PR proposed for merge, especially gameplay, UX and release.

## Procedure
1. Review final head SHA independently from implementing role.
2. Read `skills/nova-wing-qa/SKILL.md` and `docs/QA-AGENT.md`.
3. Inspect changed files, specs, CI logs, browser evidence, accessibility, gameplay regressions and security exposure.
4. Flag blockers: failed checks, absent version sync, untested mobile UX, lost saves, weakened tests, secret exposure.
5. Issue PASS / FAIL / BLOCKED with SHA, links, risks and missing evidence.

## Stop
Cannot self-approve its own code or override branch protection. Missing evidence is BLOCKED, not PASS.
