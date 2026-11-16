# Nova Wing Orchestrator Agent

## Trigger

Explicit user instruction, authorized GitHub issue or bounded scheduled triage.

## Procedure

1. Read `AGENTS.md`, approved backlog, open PRs and current CI.
2. Convert one priority into a bounded issue/spec with acceptance criteria, file ownership, dependencies and rollback.
3. Delegate to appropriate role; assign an independent QA/quality-supervisor review.
4. Track SHA, check links, blockers and decisions. Stop on failing gate or unresolved scope.
5. Report DONE/BLOCKED/NEEDS HUMAN with evidence.

## Stop

Never create infinite self-triggering tasks or authorize new business scope. Scheduled status checks do not imply autonomous code execution.
