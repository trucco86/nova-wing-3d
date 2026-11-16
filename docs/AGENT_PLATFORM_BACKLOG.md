# Backlog — Agent Platform, CI/CD and execution economics

Status: **PROPOSED**. This is planning only; no automated agents or cost telemetry are claimed to exist.

## AP-01 — CI/CD Reliability & Optimization (P0)

Owner: Release Agent. Independent reviewer: Quality Supervisor.

- Map CI workflow DAG, mandatory checks, caches, artifact retention and PR vs main triggers.
- Identify root causes of formatting, version-sync and browser failures without weakening gates.
- Introduce per-job duration, retry counts and failure category into a lightweight report.
- Propose safe caching, change-based selective jobs and concurrency rules, preserving final merge gates.
- Acceptance: measured before/after on comparable runs, no loss of test coverage, reproducible build, rollback instructions.

## AP-02 — Agent Architecture & Governance (P1)

Owner: Architecture Agent + Orchestrator. Reviewer: Quality Supervisor.

- Document role boundaries, task contracts, tool permissions, trust boundaries and human approval.
- Specify context loading and handoff protocol, deterministic stopping, idempotency and duplicate-run protection.
- Validate least privilege for GitHub Actions and prohibit self-approval, infinite recursion and unbounded issue-triggered execution.
- Acceptance: threat-model checklist, architecture decision record, working bounded dry run and auditable PR evidence.

## AP-03 — Token & Execution Cost Observability (P1, after executor exists)

Owner: Orchestrator + Architecture. Reviewer: Release Agent.

- Instrument provider-reported input/output/cached tokens where API permits; do not infer counts from message length as exact.
- Track cost per task, successful PR, failure/retry, model, tool invocation and CI runner minutes.
- Budget per task with stop thresholds, retries cap, context compression policy and model routing based on complexity.
- Never log prompts containing credentials or personal data; redact before metrics.
- Acceptance: cost report for at least ten representative runs, documented pricing assumptions, comparison of quality vs cost and explicit missing-data handling.

## AP-04 — Architectural Fitness Checks (P2)

Owner: Architecture Agent. Reviewer: QA & Test.

- Add lightweight checks for module boundaries, bundle size, performance budget, save compatibility and forbidden dependency patterns.
- Acceptance: tests fail on a deliberately introduced violation and pass on clean baseline; no brittle false positives.

## Sequencing

1. AP-01 now: CI is the current release bottleneck.
2. AP-02 after governance PR and initial CI repairs.
3. AP-03 only when real agent executions generate trustworthy usage and cost data.
4. AP-04 when architecture boundaries are stable.

Do not spin up extra always-on agents for these tasks. Begin as specializations/skills of existing roles; split into dedicated agents only if volume, ownership conflicts or measurable operational benefit justify it.
