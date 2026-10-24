# CI failure triage — 2026-10-24

## Evidence

- Agent governance PR #53: CI run 40100461759 failed in `quality`; `format:check` flagged eight new Markdown skill/policy files. Source repair check run 40100461691 passed.
- Robot PR #52: CI run 40100128797 failed in `quality`; `format:check` flagged `src/game.js` and `docs/NEXT_RELEASE_SCOPE.md` (four total files reported). Source repair check run 40100128279 passed.
- Browser shards did not establish approval because quality failed first. Do not infer gameplay is validated.

## Immediate corrective sequence (AP-01)

1. On each feature branch: `npm ci && npm run format && npm run build && npm run validate`.
2. Inspect diff to avoid incidental changes; commit only intended formatted files and generated bundle/version artifacts.
3. Re-run required CI on the final SHA; classify any subsequent version/build failure separately.
4. For PR #52, run browser shards and inspect keyboard/touch robot transitions, stage reset, energy and cooldown.
5. Do not merge either PR while quality or browser gates are red.

## Metrics to collect

Per run: head SHA, job duration, first failing step, root-cause category (format/build/version/unit/browser/environment), number of retries, and link to logs. These are operational metrics, not measured token costs.
