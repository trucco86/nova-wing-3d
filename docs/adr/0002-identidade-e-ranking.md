# ADR-0002 — Firebase para identidade; Cloudflare Worker/D1 para ranking

- **Data:** 2026-10-24/25
- **Estado:** decisão-alvo documentada; **backend não implementado**
- **Escopo:** autenticação web e competição opcional

## Contexto

A PR #59 integrou Google Sign-in via Firebase Authentication em DEV. A PR #57 propôs uma outra arquitetura de ranking baseada em Firestore e Cloud Functions, mas está em draft, sem implantação. A direção atual pede Cloudflare para ranking e já usa Cloudflare Pages para o site.

## Decisão

1. **Firebase Auth** permanece fonte de identidade de usuário. Login social é opcional, não bloqueia jogo offline.
2. **Cloudflare Pages** hospeda somente a interface estática.
3. **Cloudflare Worker**, ainda por construir, fará API pública, validação do Firebase ID token, sessões de partida, autorização, antifraude e leitura do ranking.
4. **Cloudflare D1**, ainda não provisionado, será o banco das runs, resultados aceitos e leaderboard.
5. Segregação independente DEV/HML/PROD (Firebase projetos, Worker bindings e bancos), sem promoção automática de dados e sem segredos em HTML.
6. A PR #57 não deve ser mesclada como backend alternativo sem uma revisão arquitetural; não haverá dupla escrita Firestore + D1.

## Motivos

- Separação clara de responsabilidades identidade/score.
- Aproveitar distribuição Cloudflare já em uso sem confundir hospedagem estática com execução server-side.
- Esquema SQL, constraint de unicidade, consultas parametrizadas e histórico de versões/regras de temporada.
- O frontend não recebe acesso direto ao banco nem autoridade sobre scores.

## Consequências, limites e dívidas

- É necessário validar JWT (assinatura e claims do projeto) no Worker com biblioteca adequada, mais replay/idempotência, logs e rate limit.
- Um score enviado pelo próprio browser **não é confiável**. Validação de plausibilidade isolada não torna pontuação antifraude; campeonato oficial deve aguardar estratégia autoritativa de validação/replay.
- Identidade não é save remoto: checkpoints, itens e skins continuam locais até outra decisão.
- O botão visitante atual não desloga uma sessão já existente; corrigir antes de atribuir score ao UID.
- A complexidade operacional aumenta (Firebase, Cloudflare Worker, D1, CI, billing, LGPD, IAM e observabilidade); criar testes e limites de custo desde DEV.
- **Estado efetivo hoje:** somente o Firebase Web Auth de DEV está integrado. Worker/D1 e fluxo de score não existem.

## Decisões alternativas

- Firestore e Cloud Functions (PR #57): solução possível, mas **não selecionada como alvo desta fase**; regras anteriores são propostas e não devem ser apresentadas como proteção já operante.
- Um leaderboard inteiramente no cliente: rejeitado por permitir fraude trivial e edição arbitrária.
- API key estática no HTML para gravar score: rejeitada por expor acesso público de escrita.

Detalhamento: [AUTH-FIREBASE](../AUTH-FIREBASE.md) e [RANKING-CLOUDFLARE](../RANKING-CLOUDFLARE.md).
