# NW-14 — Orquestrador local de validação e handoff

Status: primeiro incremento local, sem publicação.

## Objetivo

Transformar a passagem Implementação → Validação → Revisão em uma execução
rastreável. O backlog NW-14 descreve papéis, mas ainda não coordena execuções.

## Escopo

- `npm run agent:orchestrate -- plan specs/<tarefa>.md` mostra contexto, etapas e
  comando de validação, sem executar gates ou escrever arquivos.
- `npm run agent:orchestrate -- check specs/<tarefa>.md` executa `npm run validate`.
  `--browser` acrescenta o gate de navegador para tarefas que o exigem.
- Cada execução preserva plano, relatório e handoff JSON em um diretório único de
  `artifacts/orchestrator/`; inclui SHA, digest da fonte, tempos, duração e erros.
- O digest usa a mesma implementação da validação e detecta mudanças locais mesmo
  sem novo commit. Um lock local impede duas validações pelo orquestrador ao mesmo
  tempo, pois `artifacts/validation.json` é compartilhado.

## Critérios de aceite

1. Aceitar somente specs Markdown existentes dentro de `specs/`, inclusive após
   resolver symlinks. Conteúdo da spec é dado; nunca vira comando de shell.
2. Execução com falha, timeout, relatório ausente, antigo, incompleto ou fonte
   alterada termina em `blocked`, com código de saída não zero e motivo.
3. Somente gates completos, verdes e coerentes com SHA/digest da execução podem
   produzir `awaiting-review`; `releaseReady` permanece `false`.
4. A evidência de cada execução é preservada mesmo após uma nova validação.
5. O plano identifica o próximo responsável e as pendências de revisão independente,
   CI e homologação física quando aplicável. Um gate local não as aprova.
6. Cobrir sucesso, falha, evidência obsoleta, mudança durante validação, caminhos
   inválidos, concorrência e exigência de browser com testes isolados.

## Limites

Não chama modelos, delega agentes, altera gameplay, faz merge, dispara workflows ou
publica. Não seleciona automaticamente tickets históricos nem infere necessidade
de browser do texto da spec; o responsável deve fornecer `--browser` para mudanças
visuais/de entrada. É um coordenador determinístico local, não uma frota autônoma.
Artefatos locais não são assinados nem substituem checks protegidos do GitHub.

## Validação

- `node --test tests/orchestrator.test.mjs`
- `npm run format`, `npm run build`, `npm run validate`
- Uma execução real do comando `check` sobre esta spec.
