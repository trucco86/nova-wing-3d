# Memória de regressões do Nova Wing

O catálogo [versionado](../specs/gameplay-regression-memory.json) associa problemas históricos a contratos, testes existentes e lacunas de revisão. É uma seleção de testes, não prova de execução, aprovação ou cobertura integral.

## Uso

```sh
node tools/gameplay-regression-plan.mjs city europa
node tools/gameplay-regression-plan.mjs reactor
node --test tests/gameplay-regression-memory.test.mjs
```

Execute os comandos retornados pelo plano no SHA candidato, inspecione evidências e registre cada resultado real. Um plano não substitui a suíte FULL nem os gates de release. O agente deve manter a revisão humana pendente.

A cada bug confirmado, adicione uma regra rastreável, cenário, evidência, teste de regressão e lacuna de revisão. Preserve as referências de qualidade já aprovadas. Se a regra mudar intencionalmente, revise a spec e o teste com justificativa.

## Dependências e limites

- A PR #437 contém o contrato visual e físico em revisão; reconciliar antes de tornar os detectores obrigatórios.
- As PRs #431, #440 e #442 incluem mudanças candidatas de Europa, abertura e caminhada do reator. Não presumir que tenham sido publicadas ou que os testes históricos cubram as novas regras.
- Próximo passo: ligar o catálogo ao Gameplay Observer da PR #444 após validar seu CI, registrar métricas de detecção e adicionar telemetria de colisão.
