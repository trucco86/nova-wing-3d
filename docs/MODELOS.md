# Delegação nativa de tarefas com modelos

## Disponibilidade e seleção

Nesta sessão, o agente principal pode delegar trabalho a agentes usando os modelos nativos disponíveis:

| Modelo        | Uso recomendado                                             |
| ------------- | ----------------------------------------------------------- |
| `gpt-6-luna`  | Documentação, tarefas simples e mudanças de escopo estreito |
| `gpt-6.1-sol` | Implementação, testes e correções comuns                    |
| `gpt-6-astra` | Arquitetura complexa, bugs difíceis e revisão crítica       |

Essa é uma capacidade desta sessão, não uma promessa de disponibilidade em todas as interfaces do ChatGPT. A seleção ocorre quando o agente principal cria agentes delegados; ela não troca automaticamente o modelo desta conversa principal. Se a delegação nativa não estiver disponível, o agente principal segue o fluxo local e relata a limitação.

## Escolha por tarefa e risco

- **Documentação ou tarefa simples e isolada:** delegar a `gpt-6-luna`; o agente principal verifica consistência e diff.
- **Implementação ou testes delimitados:** delegar a `gpt-6.1-sol`, informando arquivos, comportamento esperado e critérios observáveis.
- **Arquitetura, mudanças entre sistemas, risco alto, bug persistente ou revisão crítica:** delegar a `gpt-6-astra` para análise ou execução apropriada; o agente principal mantém responsabilidade pela decisão e integração.
- **Escopo que cresceu ou duas tentativas sem resolver:** parar a repetição, escalar para `gpt-6-astra` com diagnóstico e tentativas anteriores, ou devolver ao agente principal para replanejar. Não reduzir gates nem ampliar escopo silenciosamente.

Delegue partes independentes com instruções claras e limite o escopo de edição. O agente principal coordena conflitos, valida o resultado integrado e decide se os critérios foram atendidos. Delegação não transfere responsabilidade pela qualidade.

## Qualidade e prestação de contas

Use os mesmos requisitos do repositório: leia as instruções aplicáveis, consulte contexto e arquitetura quando necessário, atualize especificação para mudanças funcionais, acrescente testes quando houver risco comportamental e preserve os contratos existentes. Execute `npm run format`, `npm run build` e `npm run validate`; mudanças visuais ou de entrada também exigem `npm run validate -- --browser` na CI ou ambiente compatível. Revise o diff e reporte evidências, limitações e riscos. Nunca afirme que um gate passou sem executá-lo.

Ao encerrar, o agente principal informa os modelos efetivamente usados por tarefa, o que foi integrado, os comandos executados e seus resultados, e qualquer bloqueio ou tentativa escalada. Se não houve delegação, declare isso.

## Fluxo de API opcional

Não são necessárias chaves de API para a delegação nativa descrita acima. O seletor e executor de API permanecem como experimento opcional pausado no [PR 6](https://github.com/trucco86/nova-wing-3d/pull/6); não são o fluxo padrão e não há alegações de benchmark ou recomendação medida. Uma assinatura do ChatGPT não implica acesso à API.
