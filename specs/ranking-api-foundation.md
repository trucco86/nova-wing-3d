# R-API-01 — Cloudflare Worker ranking foundation (P1)

**Status:** code and unit tests proposed in a PR; no Cloudflare Worker/D1 deploy and no leaderboard yet.

## Scope

- Host a separate Worker entrypoint under `workers/ranking/` with explicit CORS allowlist.
- GET `/v1/health`: report service running with `scoreSubmissionsEnabled: false`.
- GET `/v1/leaderboard`: read verified results only through D1 parameterized statements; unavailable DB returns 503.
- GET `/v1/me`: require validated Firebase ID token, never expose UID or email in response.
- POST `/v1/runs/start`, POST `/v1/runs/finish`: **501 disabled** until validation, fraud protection and transaction isolation are implemented.
- D1 SQL schema must have unique constraints for run, nonce, idempotency and best score.

## Security acceptance

- Firebase token: RS256 signature verified against Google public keys and correct `aud`, `iss`, `exp`, `iat`, `auth_time`, `sub`. Reject unsigned, tampered, expired, wrong project and invalid format.
- Only configured `ALLOWED_ORIGINS` get CORS headers. **CORS is not a security boundary**; every authenticated route validates identity server-side.
- No client-side score writing and no direct database credentials exposed in the game bundle.
- Failure to contact Firebase certificates or D1 must fail closed (401/503). Never default to trusting browser data.
- Auth tokens and email do not appear in Worker responses or logs.
- No Worker deployment as part of this PR; security review and quotas/rate limits required before public exposure.

## Evidence and limitations

- `tests/ranking-worker.test.mjs`: tests health, closed score writes, missing DB, safe public query, CORS and RS256 token signature/claims using local generated RSA keys.
- Tests with mocked D1 do not prove production SQL migration, operational quota, JWKS endpoint availability or reliable anti-cheat.
- Externally contributed scores must **not** be ranked until server-side simulation/replay and abuse constraints are implemented.
