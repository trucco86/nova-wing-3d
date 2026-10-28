# P0 — Exclusão dos dados de ranking pelo jogador

**Status:** implementação candidata sobre #107, sem uso de Firebase real ou D1 em HML/PROD.

## Jornada

- Em RANK, **EXCLUIR MEUS DADOS NA NUVEM** aparece desabilitado para visitantes
  e quando não existe API remota no ambiente.
- Autenticado: confirmação específica esclarece que somente nickname e resultados
  remotos serão excluídos (não a conta Google ou o checkpoint local).
- O jogador pode cancelar sem alterar consentimento, histórico ou servidor.
- Após confirmar, invalidar runs pendentes, revogar consentimento e chamar
  `DELETE /v1/me` com token Firebase verificado pelo Worker.
- Proteção contra corrida: sessão/epoch checados depois de obter o token,
  botão bloqueado durante a operação e respostas de conta anterior ignoradas.
- Uma resposta `{deleted:true}` permite informar sucesso e remover imediatamente
  histórico remoto e leaderboard renderizados; falhas não podem alegar exclusão.
- Não usar `localStorage.clear`, não mudar campanha, XP, pontuações locais ou
  save slots. Exclusão irreversível de dados remotos exige confirmação expressa.
- Ao enviar dados novamente, exigir novo nickname e novo opt-in.

## Evidência necessária

- `tests/ranking-data-deletion.test.mjs`: sessão A→B com JWT tardio,
  confirmação cancelada, duplo clique, falha de API, botão de visitante,
  feedback e integridade local.
- `tests/provisional-ranking.test.mjs` cobre cascade D1 do backend simulado.
- Reproduzir em HML com projeto Firebase/OAuth e Worker/D1 reais, com conta
  descartável; confirmar remoção de perfil e runs no banco, e teste em outro
  navegador com a mesma conta.
- LGPD operacional: publicar política de retenção, instrução de solicitação de
  exclusão fora do app e verificação operacional de backup/logs antes de PROD.
