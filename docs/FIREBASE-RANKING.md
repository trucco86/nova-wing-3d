# Firebase ranking foundation — design and rollout

Status: security rules proposed in a separate PR; **no Firebase project, Google sign-in, backend score verifier, deployment, or live leaderboard configured**.

## Data contracts

- `players/{uid}`: `nickname`, `createdAt`; owner-only reads; nickname-only edits.
- `sessions/{sessionId}`: server-created signed/nonce-bound run context with expiry, game build SHA and anti-replay state; no direct client access.
- `scores/{scoreId}`: server-verified result, `uid`, `points`, `sector`, `durationMs`, `buildSha`, `verifiedAt`; no direct client access.
- `leaderboards/{season}/entries/{uid}`: server-materialized public fields `nickname`, `points`, `sector`, `verifiedAt`; no email addresses.

## Submission protocol

1. Anonymous play works without login; score is local-only.
2. User opts into Google sign-in using Firebase Authentication.
3. Callable Cloud Function issues a short-lived session nonce bound to uid, build and start time.
4. Game sends run events and final score to a server endpoint; server checks authentication, expiry, nonce reuse, duration, score caps, level transitions and event consistency.
5. Server stores accepted score and updates leaderboard transactionally, keeping each user's best verified result per season.
6. Rejected submissions are not ranked and receive an understandable response.

**Security limitation:** a browser game cannot prove that its own JavaScript was not modified. These controls raise the cost of abuse but do not provide authoritative anti-cheat without server-side gameplay simulation or event replay.

## Deployment prerequisites

- Create a dedicated Firebase project for DEV, separate from PROD.
- Enable Google provider and register authorized domains.
- Enable Firestore and Cloud Functions; review billing/quotas.
- Configure Firebase App Check and rate limits; it is a supplementary control, not a substitute for score verification.
- Run rules emulator tests: visitor reads ranking; player reads/edits own nickname; player cannot edit another profile; no client can write leaderboard, scores or sessions.
- Use CI deployment with least-privilege identity; no service account JSON in git.
- Document consent, privacy, account deletion, moderation of nicknames and retention before public launch.

## Acceptance gates

- Firestore rules pass emulator tests; deny-by-default verified.
- Backend verifier has adversarial/replay and rate-limit tests.
- Auth works on desktop/mobile and sign-out removes authenticated UI.
- Public ranking excludes email and other personal data.
- DEV deployment validated before PROD.
