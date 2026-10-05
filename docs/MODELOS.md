# Modelos LLM para tarefas de desenvolvimento

O seletor `tools/model-router.mjs` resolve uma política versionada em `model-policy.json`. Ele retorna uma decisão JSON; o runtime externo deve chamar a API e aplicar os limites. Não existe chamada de modelo, cobrança ou agente residente neste repositório.

## Política inicial

| Tarefa         | Perfil preferido         | Uso no jogo                                       |
| -------------- | ------------------------ | ------------------------------------------------- |
| planning       | deep                     | Arquitetura, câmera, mudanças que cruzam sistemas |
| implementation | balanced                 | Alterações delimitadas com contrato e teste       |
| review         | deep de outro fornecedor | Encontrar regressões e lacunas no diff            |
| tests          | balanced                 | Reproduzir bugs e criar assertions observáveis    |
| documentation  | fast                     | README e notas a partir de evidências verificadas |

Essa distribuição é uma hipótese inicial, sem benchmark neste projeto. Risco alto e segunda tentativa exigem deep, inclusive para documentação. Perfil é uma classificação do mantenedor, não certificação de qualidade do fornecedor.

## Configurar os modelos

Defina somente IDs públicos nas variáveis `NOVA_MODEL_FAST`, `NOVA_MODEL_BALANCED`, `NOVA_MODEL_DEEP` e `NOVA_MODEL_DEEP_FALLBACK`. Credenciais ficam no runtime, separado deste comando. O fornecedor em cada entrada precisa coincidir com o modelo escolhido; é editável, assim como capacidades e janela. Os limites de 32/64 mil são tetos conservadores do harness, não especificações dos modelos.

Como ponto de partida: Gemini Flash para fast, Claude Sonnet para balanced, Claude Opus para deep e Gemini Pro para deep-fallback. Consulte IDs e disponibilidade nas fontes oficiais abaixo antes de configurar. Não use um alias descontinuado nem deduza acesso à API a partir de uma assinatura de chat. Trocar por Codex/OpenAI ou um modelo local exige editar o fornecedor e validar o perfil nas tarefas reais.

Fontes consultadas em 04/10/2026: [Claude Models](https://platform.claude.com/docs/en/models/overview) e [Gemini Models](https://ai.google.dev/gemini-api/docs/models). Nomes de família são orientação; as versões e capacidades mudam.

Exemplo de seleção (IDs ilustrativos, sem chamada de API):

```sh
NOVA_MODEL_BALANCED=example-coding-model npm run agent:route -- implementation medium 12000
NOVA_MODEL_DEEP=example-reasoning-model npm run agent:route -- planning high 24000 --vision
```

Sem candidato configurado o comando termina com exit code 2 e `status: blocked`. Pedido inválido termina com 1; seleção com 0. A CLI aceita tarefa, risco, estimativa de tokens de entrada e `--vision`. O runtime pode importar `routeTask(policy, request, env)` e passar `attempts`, `failedModels` (chaves da política) e `authorModel` (`fornecedor/ID`). A revisão exclui a identidade do autor quando informada; isso não substitui revisão humana nem garante independência do contexto. Registre o ID efetivamente resolvido, especialmente quando houver alias.

## Execução e evidência

O runtime deve contar a entrada completa (instruções, contexto e ferramentas), reservar a saída, aplicar timeout e tokens, persistir tentativas/falhas e impedir chamadas depois do orçamento. O seletor recebe esse estado; não o armazena nem valida a disponibilidade remota. Erro de API permite fallback elegível; falha de teste exige diagnóstico antes da segunda tentativa. Nunca reduza o perfil para caber no orçamento.

Compare modelos com as mesmas tarefas e gates: correção de boost, coleta nos limites da tela, pausa/reset e revisão de PR. Registre commit, tarefa, risco, modelo resolvido, tentativas, duração, tokens/custo observado e resultado dos testes. Escolha pelo custo de uma entrega validada. Ainda não há resultados medidos nem recomendação definitiva de fornecedor.

Os testes do roteador rodam em `npm run validate` sem credenciais. A decisão de modelo não aprova merge, não executa testes e não altera a publicação do jogo.
