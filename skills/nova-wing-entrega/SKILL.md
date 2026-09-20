---
name: nova-wing-entrega
description: Validar, revisar e entregar alterações do Nova Wing 3D, incluindo documentação, build, CI e upload autorizado para GitHub.
---

# nova-wing-entrega

## Contexto

Leia AGENTS.md, docs/HARNESS.md e docs/PUBLICACAO.md. Verifique git status antes de editar. Revise o diff para fontes, bundle, lockfile e documentação coerentes.

## Procedimento

1. Localize a especificação e registre critérios observáveis antes de alterar comportamento.
2. Faça uma mudança limitada ao objetivo; atualize explicações quando os contratos mudarem.
3. Execute npm run format, npm run build e npm run validate. Para gráficos ou entradas, execute também npm run validate -- --browser em ambiente compatível. Leia artifacts/validation.json e logs; confirme CI no commit final. Não confunda checks configurados com proteção de branch ativada.
4. Execute os gates de AGENTS.md. Não remova testes para mascarar falha; diagnostique a causa.
5. Entregue resumo, evidências executadas e limitações. Publicações seguem a autorização existente do usuário.

## Conclusão verificável

O diff deve corresponder ao pedido, os gates pertinentes devem passar e qualquer validação indisponível deve permanecer explicitamente pendente. Não invente evidências nem reproduza funcionalidades inexistentes do projeto de referência.
