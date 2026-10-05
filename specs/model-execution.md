# Execução e comparação de LLMs

Status: implemented

## Objetivo

Conectar o seletor a Claude Messages e Gemini generateContent. Produzir evidências por tarefa do jogo, sem executar código retornado pelo modelo.

## Critérios

- Preflight é o padrão; rede só com `--live`. Ausência de modelo ou chave produz blocked, nunca resultado simulado.
- Contagem de tokens no provedor precede geração; contexto reserva saída. Timeout cobre contagem e geração de cada tentativa.
- Limite de tentativas vem da política. Fallback somente em 429/5xx; timeout/erro de transporte encerra com consumo desconhecido para evitar duplicação automática.
- Resposta truncada, recusa e resposta malformada não são sucesso.
- Relatório identifica modelo solicitado/resolvido, duração, uso, status e hash do prompt. Segredos e corpos de erro não são registrados.
- Custo é estimado apenas com tarifa explícita por fornecedor/ID e uso completo; custo desconhecido permanece null. A fatura é a fonte de custo real.
- Benchmark usa os mesmos casos versionados, sem fallback entre modelos, com avaliação de contrato automática e revisão humana pendente. Não declara ranking sem dados.
- Nenhum resultado altera arquivos do jogo, executa comandos ou aprova PR.

## Evidências

`tests/model-execution.test.mjs`, `tests/model-benchmark.test.mjs`, `npm run validate`. Testes HTTP são simulados e não comprovam integração autenticada.
