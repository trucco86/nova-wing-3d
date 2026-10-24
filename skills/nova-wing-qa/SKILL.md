# Nova Wing QA — skill de testes e prevenção de regressões

## Quando usar
**Obrigatória em toda mudança funcional**, bugfix, UX mobile, alteração de combate, build ou CI. Em documentação pura, executar os gates aplicáveis sem simular testes visuais.

## Protocolo antes de alterar código
1. Ler `AGENTS.md`, a spec relacionada e os testes do módulo afetado.
2. Definir comportamento observável, risco e matriz de cenários: fluxo normal, limites, erro, pausa/reinício e persistência.
3. Verificar cobertura já existente; não duplicar testes só para aumentar números.
4. Escrever teste de regressão que **falhe na versão defeituosa** e passe com a correção, quando viável.
5. Para interface: validar portrait/landscape, safe-area, toque e elementos sobrepostos; registrar screenshot real.
6. Para gameplay: preservar colisões, progressão, boss, save, áudio e taxa de quadros; usar relógio determinístico no harness.

## Execução local obrigatória
```sh
npm ci
npm run format
npm run build
npm run validate
# Para alterações visuais, controles ou gameplay:
npm run validate -- --browser
```
O `format` e o `build` são preparação do artefato, **não** permissão para editar testes até passarem. Inspecionar `git diff` e commitar apenas arquivos intencionais, inclusive `index.html` gerado quando exigido.

## Política de testes
- Testar contratos públicos e comportamento do jogador, não detalhes internos arbitrários.
- Isolar estado, tempo, aleatoriedade e storage; cada teste deve funcionar sozinho.
- Nunca adicionar sleeps, retries ou snapshots regravados sem explicar causa e estabilidade.
- Nunca marcar `skip`, `only`, remover assertions ou enfraquecer limiares para obter verde.
- Erro de ambiente deve ser separado de bug real e documentado.
- Qualquer mudança em testes precisa de justificativa ligada ao requisito.

## Revisão e evidências
O agente revisor deve relatar: SHA, arquivos afetados, comandos executados, resultados, testes novos, riscos e o que **não** foi testado. `artifacts/validation.json` e GitHub Actions são evidências, não substitutos de observação. Reexecutar gates após **a última alteração**.

**Bloqueio:** CI obrigatória vermelha, build dessincronizado, regressão conhecida ou teste visual obrigatório não executado impedem recomendação de merge. Não contornar branch protection.

## Handoff
Implementação → QA independente → revisão de arquitetura (se pertinente) → CI → homologação visual/mobile → release. O revisor deve devolver correções concretas ao implementador e rever o SHA corrigido.
