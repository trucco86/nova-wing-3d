# Cloudflare D1 schema review — no deployment

This branch updates the **candidate** D1 migration only. It does not create a database, bind it to a Worker, apply migrations, enable score writes, or publish a leaderboard.

## Read path
The read-only Worker uses `scores.season_id`, `scores.verdict = 'verified'`, descending `points`, ascending `verified_at` and joins `leaderboard_entries`, `players` and `scores`. The added index follows the score filter/sort. Validate with SQLite `EXPLAIN QUERY PLAN` and realistic row counts before deploying.

## Privacy and integrity
`players.uid` is an internal Firebase subject; never return it in public API responses. Player deletion must cascade from runs/scores/leaderboard entries. A season and its scores remain non-public unless explicit user consent and server-side verification have been implemented.

## Required before provision or rollout
- Security review of JWT verification, Firebase project isolation, idempotency, nonce expiration, replay and score anti-cheat.
- Consent/retention policy and account deletion tests.
- D1 migration tests on disposable local DB and rollback strategy.
- Isolated DEV D1 database and Worker binding; never reuse PROD DB in previews.
- Rate limiting, alerting, load test, threat model and manual go/no-go.
- Explicit secrets configured in Cloudflare, without committing credentials.

**Status:** schema proposal only; score writes remain disabled.
