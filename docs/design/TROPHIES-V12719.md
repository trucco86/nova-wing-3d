# Trophy system — Nova Wing / Five Cats

## Product contract
- Rarities **Bronze (10), Silver (25), Gold (50), Platinum (100)**. Trophy points are not XP, in-game score, Credits, or global ranking scores.
- **41** initial achievements: unique boss kills (10), campaign, records, precision, clean clears, primary-fire boss battles, difficulty, mecha, team, exploration, secrets and platinum. Source-of-truth catalog in `src/trophy-catalog.js`; no unsupported hidden conditions.
- On-device guest-first ledger `nova-wing-trophies-v1`, separate from gameplay checkpoint, ranking, Firebase and Cloudflare D1. No automatic Google account sync or competitive validity claim. A later authenticated backend must validate achievements server-side before public rankings.
- Unlocks **monotonic**, once per ID; run IDs prevent replay of the same completed stage. No retroactive challenge unlock when old records cannot prove the conditions.
- Do not unlock in developer scenarios, QA flights, previews without real completed combat or defeated stages.
- New record = **beat a previously recorded result** in the same sector, not the initial score.
- “Só na Bala” requires entire boss fight with actual primary weapon impact only, no bomb, offensive pods, RPG or Five Cats squad damage, not just final hit.
- “Sem Dano” counts real shield/HP damage, not invulnerability frames or absorbed barrier hits.
- Speed goal currently stage time <= 140% of configured base sector duration; calibrate threshold using real QA before stable release.
- Two secrets unlock only on hard difficulty; show hidden description while locked.

## Architecture and gates
1. **Wave A implemented in isolated module:** catalog + pure rule evaluation + versioned safe local ledger + idempotence + unit tests. No backend or ranking mutation.
2. **Wave B integration required:** wire actual `recordStageResult` to verified per-stage counters for damage, boss damage sources, kills, rings, difficulty, pilot, speed. Do not trust player-submitted synthetic event payloads for official online rewards.
3. **Wave C UI:** trophy drawer in menu and pause; portrait tile, rarity, progress, 1-2 top-edge notifications, secret lock, accessible modal; internationalize all catalogue text PT/EN/ES.
4. **Wave D QA:** ordinary/charged/scatter vs pod/bomb/RPG/squad attribution, 10 bosses, mecha final kill, pause/restart, guest, corrupted state, double callbacks; browser Playwright 4 shards and mobile 320px/landscape, developer sessions excluded.
5. **Wave E opt-in cloud sync:** design secure server attestation, Google login association, conflict-free merge and deletion under privacy controls. **Not included** in v1.

## Acceptance policy
- Local achievements are motivational, not anti-cheat protected. Do not award real-money value, in-game power or commercial rewards.
- Preserve existing 1.27.14 DEV; #155/#156/#157 are separate drafts. No HML/PROD promotion without full review.
