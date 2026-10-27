# Architecture Decision Records — Nova Wing

ADRs registram **decisões, motivação, opções e consequências** e não provam implantação de serviço externo.

- [ADR-0001 — Ambientes isolados e publicação](0001-ambientes-e-publicacao.md): GitHub Pages produção e Cloudflare Pages DEV/HML/previews.
- [ADR-0002 — Firebase Authentication e ranking Cloudflare](0002-identidade-e-ranking.md): separação identidade vs pontuação; Worker/D1 como alvo **não implementado**.
- [ADR-0003 — Harness e quality gates](0003-harness-e-gates.md): build isolado por runner, regressão e gates de promoção.

Referências operacionais: [Arquitetura consolidada](../ARCHITECTURE-PLATFORM.md), [Firebase Auth](../AUTH-FIREBASE.md), [Cloudflare Ranking](../RANKING-CLOUDFLARE.md).
