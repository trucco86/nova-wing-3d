## Objetivo

Descreva o problema, o comportamento resultante e a especificação. Preferir PR pequena baseada em main.

## Classificação de risco

- [ ] Baixo: somente documentação/testes isolados, sem runtime, build ou deploy
- [ ] Médio: HUD, assets ou gameplay localizado
- [ ] Alto: engine, colisões, saves, dependências, versão, CI ou release
- [ ] Crítico: segurança, permissões, deploy ou branch protection

Na dúvida, usar a categoria mais alta. Baixo risco não significa autorização de produção.

## Validação

- [ ] Diff revisado e branch atualizada com main
- [ ] Quality e seis shards Playwright verdes no SHA final, ou exceção formalmente aprovada
- [ ] Testes de regressão e evidências visuais relevantes
- [ ] Verificada ausência de código exclusivo perdido de PR predecessora
- [ ] HTML gerado sincronizado com fontes

## Riscos e limitações

Registre testes pendentes, impacto da publicação e plano de rollback.

## Gate de produção

- [ ] Lote aprovado explicitamente, com referência: <!-- link -->
- [ ] Smoke test e responsável pelo aceite definidos
- [ ] Mudanças de CI/workflows/versão submetidas a revisão manual

**Até desacoplar deploy do push em main e confirmar branch protection, não habilitar auto-merge.**
