# Nova Wing — Worker de ranking experimental

**Status atual:** implementação de autenticação, histórico e leaderboard experimental em PR candidata. **Sem Worker/D1 remotos provisionados ou OAuth PROD homologado.** As rotas de escrita continuam devolvendo HTTP 501 até a variável de ambiente `SCORE_WRITE_ENABLED=true` ser explicitamente definida **no Worker**.

- `GET /v1/health`: estado da API (o flag reflete a implementação e não implica score oficial).
- `GET /v1/leaderboard`: somente registros oficiais `verified` (sem mudanças na regra original).
- `GET /v1/leaderboard?mode=experimental`: melhores scores **não verificados** por nickname.
- `GET /v1/me`: perfil autenticado sem UID/e-mail público.
- `GET /v1/me/history`: últimas 30 partidas remotas da pessoa autenticada.
- `POST /v1/runs/start`: login + consentimento/nickname, nonce e TTL de 2 h, com rate limit.
- `POST /v1/runs/finish`: usa nonce hash, verificação de identidade, tempo/score de plausibilidade e SQL condicional anti-replay; registra apenas resultados experimentais.
- `DELETE /v1/me`: grava tombstone privado e exclui dados da conta no ranking, em transação D1 (FK/cascata); bloqueia POSTs antigos que poderiam recriar o perfil. **Até existir protocolo específico de reinscrição, o mesmo UID não pode voltar a participar do ranking após exclusão.**

Os resultados produzidos no browser NÃO constituem pontuação competitiva oficial. Futuro: reproduzir eventos/simulação autoritativa de score e combater contas múltiplas.

Arquivos: `src/index.js`, `src/provisional.js`, `src/firebase-jwt.js`, `migrations/0001_initial.sql`, `migrations/0002_provisional_history.sql`, `migrations/0003_account_deletion_tombstones.sql`, `wrangler.hml.example.toml`, `wrangler.prod.example.toml`.

Execução local dos testes:

```sh
node --test tests/ranking-worker.test.mjs tests/provisional-ranking.test.mjs
```

A configuração operacional, domínios OAuth, variáveis GitHub/Cloudflare, autorização de deploy, migrations, testes de segurança e LGPD estão descritos no runbook [Identidade e Ranking](../../docs/IDENTITY-RANKING-DELIVERY.md). **Não aplicar migrations em PROD a partir de PR.**
