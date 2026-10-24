# Parallel workstreams — agents and next game release

## Track A: agent infrastructure

Owner: Orchestrator + Architecture. Branch `feat/agent-roles-governance`, PR #53. Scope: role skills, policies, independent review, CI wiring. Does not change gameplay or game version. Current gate: Prettier formatting failing on eight files; fix and re-run checks before merge.

## Track B: next game release

Owner: Gameplay + Visual/UX + Release. PR #52 (robot), PR #51 (stage palettes), PR #46 (mobile stick). Scope: ship/robot switch, energy/cooldown, mobile control, ten stage identities, safe persistence. Current gate: PR #52 Prettier failures on four files, build/version consistency and browser validation pending. Combine only after source QA; release candidate before stable publication.

## Isolation and handoff

Separate branches and PRs. No shared source edits in parallel. Integrate agent docs independently; game release branch is not allowed to cherry-pick agent governance before it is green. Use final SHA and real CI URLs as evidence. Main/stable release requires required checks and user gameplay acceptance. Do not claim background coding merely because a monitoring automation exists.
