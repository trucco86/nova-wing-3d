# P0 — Deletion race e integridade do ranking remoto (#114)

## Falha corrigida em candidato

Uma requisição de início de run iniciada antes de `DELETE /v1/me` podia
recriar `players` e uma pontuação depois que o usuário tivesse recebido
confirmação de exclusão. Apenas anular uma Promise no browser não resolve
requisições que já chegaram ao Worker.

## Contrato do backend

- Migration 0003 cria `deleted_player_uids`, tabela privada de tombstones
  por Firebase UID, com timestamp. Nunca aparece em endpoints públicos.
- `DELETE /v1/me` usa **D1 batch transacional**: inserir tombstone
  (idempotente) e eliminar jogador; FKs ON DELETE CASCADE eliminam runs,
  scores e leaderboard entries.
- `POST /v1/runs/start` usa outra D1 batch transacional e SQL condicional
  `NOT EXISTS` tombstone tanto para perfil quanto para run. Retorna HTTP 410
  quando a exclusão está registrada.
- `POST /v1/runs/finish` nunca recria jogador ou run; run apagada vira 404.
- Requests já gravados antes do delete são apagados; requests que chegam
  depois são rejeitados. Repetir DELETE é idempotente.
- Outros UIDs não podem ser afetados; visitante e histórico local continuam.
- **Limitação consciente**: rejoin do mesmo UID bloqueado até implementar uma
  jornada autenticada independente de reinscrição, incluindo consentimento
  renovado e proteção contra replay antigo. O usuário deve ser informado disso.
- Tombstone é dado pessoal pseudonimizado; definir retenção operacional,
  backup e solicitação de eliminação antes de produção.

## Evidências

- `tests/provisional-ranking.test.mjs` com backend simulado valida
  rejeição de post-delete, exclusão idempotente e isolamento por UID.
- `tests/ranking-d1-schema.test.mjs` aplica migrations e executa SQL
  real em SQLite com FK/cascade para verificar a semântica.
- A documentação Cloudflare D1 garante `batch()` transacional e sequencial:
  https://developers.cloudflare.com/d1/worker-api/d1-database/#batch
- **Não equivale a homologação concorrente em D1 HML real**. Testar duas
  abas/dispositivos, POST/DELETE simultâneos, DB real, logs e rollback,
  assim como uma conta reapresentada após o erase.
- Não acionar `SCORE_WRITE_ENABLED=true` em ambiente público até QA real.
