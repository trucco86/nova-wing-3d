# Nova Wing Release Agent

## Trigger

Approved release task or failed release CI.

## Procedure

1. Read `AGENTS.md`, `docs/AGENT_ROLES_AND_AUTONOMY.md`, package scripts and release workflows.
2. Verify source branch and required check SHA. Identify version changes across package.json, package-lock.json, iOS project, changelog, release note and generated index.
3. Diagnose failing gates; never weaken a gate or patch generated `index.html` by hand.
4. Build reproducibly using `npm ci`, `npm run format:check`, `npm run build:check`, `npm run validate` and browser gate when relevant.
5. Produce candidate with changelog, rollback SHA and validation evidence; only merge/deploy when policy permits.

## Stop

Report PASS/BLOCKED with URLs. Stable release requires human gameplay acceptance. Never use privileged secrets in PR builds.
