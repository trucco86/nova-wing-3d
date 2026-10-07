# Executor e benchmark de modelos

O executor usa Claude Messages e Gemini generateContent com HTTP nativo do Node. A seleção continua em `model-policy.json`. O jogo não chama esses serviços; a execução é uma ferramenta de desenvolvimento iniciada pelo mantenedor.

## Preparar e rodar

1. Configure no ambiente seguro da máquina/CI `ANTHROPIC_API_KEY` e/ou `GEMINI_API_KEY`. Não coloque valores no repositório, chat ou logs. Nenhum arquivo de credencial é procurado automaticamente.
2. Configure os IDs nos `NOVA_MODEL_*` descritos em [modelos](MODELOS.md). Fornecedor e capacidades da política devem coincidir com o ID. O adaptador suporta somente as APIs diretas Anthropic e Google neste estágio.
3. Execute o preflight, sem tráfego de rede:

```sh
npm run agent:benchmark
```

4. Escolha um caso para executar chamadas reais:

```sh
npm run agent:benchmark -- --case input-review --live
```

Casos: `camera-plan`, `input-change`, `input-review`, `collision-tests`, `input-doc`. Cada caso compara os candidatos elegíveis da rota, com o mesmo prompt e contexto público versionado. A CLI exige um caso explícito para chamadas reais. Há no máximo quatro gerações por invocação, cada uma com teto solicitado de 1.024 tokens e timeout de 60 segundos incluindo contagem. Modelos que consomem saída com raciocínio podem truncar nesse teto: o relatório marca incomplete; aumente conscientemente o limite no uso programático se precisar de um experimento diferente.

Preflight retorna ready quando modelo e chave estão presentes, mas não comprova autenticação, acesso ao modelo, saldo ou conectividade. Ausência de configuração retorna blocked. Exit code 2 indica amostra bloqueada, falha ou contrato não atendido; 1 indica configuração/comando inválido; 0 indica preflight pronto ou respostas completas com contrato válido. Nenhum desses resultados comprova qualidade semântica.

## Limites e recuperação

`executeTask` em `tools/model-executor.mjs` pode ser importado por outro runtime. Recebe política, pedido com task/risk/prompt/authorModel e opções live/limits/prices. O default é preflight. Na execução roteada, somente HTTP 429/5xx permite fallback, dentro de maxAttempts e com escalada para deep. Resposta incompleta e falha de transporte/timeout interrompem. Timeout pode ter ocorrido depois de cobrança; o consumo permanece desconhecido e não há repetição automática.

O benchmark desativa fallback para manter atribuição de cada amostra ao modelo pedido. Uma nova invocação é um novo experimento com novo orçamento. A contagem do provedor é feita antes de gerar; nenhum truncamento silencioso do contexto é usado. O executor atual aceita somente texto. Não oferece shell, ferramentas, escrita de código, aplicação de diff ou publicação para os modelos.

## Custo e evidências

Os relatórios únicos ficam em `artifacts/llm-benchmark-*.json`, ignorados pelo Git e com permissão local restrita. Incluem commit, hashes do prompt e política, tarifas utilizadas, modelo pedido/resolvido, duração, contagem e consumo de tokens, resposta, término e avaliação de contrato. Corpos de erro e credenciais não são gravados. Não use prompts com dados privados neste benchmark público.

`model-pricing.json` começa vazio para não assumir preços. Para estimativa em USD, inclua uma entrada por `fornecedor/ID-resolvido`, com quatro tarifas por milhão de tokens: `input`, `output`, `cachedInput`, `cacheWrite`. Registre também `source` e `verifiedAt` como proveniência. Consulte [preços Claude](https://platform.claude.com/docs/en/about-claude/pricing) e [preços Gemini](https://ai.google.dev/gemini-api/docs/pricing) para o modelo, tamanho de contexto e modo usados. Faixas, descontos e cobranças especiais precisam ser representados corretamente; a ferramenta não os descobre.

A estimativa conta tokens de raciocínio reportados pelo Gemini e diferencia cache de entrada entre provedores. Sem tarifa completa ou uso conhecido, o custo é null. O relatório não é fatura e o executor não impõe teto em dólares; limites financeiros devem ser configurados na conta do provedor. Uma falha pode ter custo desconhecido, nunca ser assumida gratuita.

## Avaliar qualidade

O validador automático verifica JSON, evidência apontando aos arquivos fornecidos e presença de checks. Ele não verifica se a resposta está correta. Todos os resultados ficam com `semanticQuality: human-review-pending`. Não execute automaticamente código retornado.

Para cada resposta, revise correção técnica, preservação dos contratos, utilidade dos testes e alegações sem evidência. Dê 0 (incorreta), 1 (parcial) ou 2 (correta e suficiente) em cada dimensão. No caso input-review, a resposta precisa identificar a incompatibilidade de capture no cleanup; em câmera, preservar atualização por dt e reset; em colisão, apresentar coordenadas e expectativas consistentes. Esses critérios não são enviados como gabarito no prompt.

Compare custo e latência somente entre respostas aprovadas, repetindo cada caso para medir variabilidade. Cinco tarefas pequenas são um piloto, não benchmark de produtividade nem ranking universal. Neste ambiente, o preflight identificou ausência de credenciais e IDs; nenhuma medição real foi produzida.

Referências de implementação consultadas em 04/10/2026: [Claude Messages](https://platform.claude.com/docs/en/api/messages/create), [Claude token count](https://platform.claude.com/docs/en/api/messages/count_tokens), [Gemini generateContent](https://ai.google.dev/api/generate-content) e [Gemini countTokens](https://ai.google.dev/api/tokens).
