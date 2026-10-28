# Template · Evidência de entrega AI SDLC

Este modelo documenta uma entrega rastreável. **Não preencha um campo como aprovado sem evidência real.** Pode ser copiado para `docs/case/entregas/<task-id>.md` quando uma entrega justificar uma narrativa aprofundada.

## 1. Contexto e hipótese

| Campo | Preencher |
| :--- | :--- |
| Identificador da demanda | `TASK-ID` |
| Feedback / problema observável | A descrever |
| Hipótese de solução | A descrever |
| Restrições de escopo e compatibilidade | A descrever |
| Spec / ADR / skill relevante | Links |
| Responsável pela validação humana | A informar |

## 2. Implementação

| Campo | Evidência |
| :--- | :--- |
| Branch / PR | URL |
| Commit SHA testado | SHA completo |
| Arquivos de fonte alterados | Links |
| Critério de aceite #1 | Regra e teste correspondente |
| Critério de aceite #2 | Regra e teste correspondente |
| Decisões de arquitetura | ADR ou justificativa |

## 3. Gates por SHA

| Gate | Resultado | Execução / artefato | Limitação |
| :--- | :--- | :--- | :--- |
| Formatação / lint | Pendente | URL | — |
| Build reproduzível | Pendente | URL | — |
| Testes unitários | Pendente | URL | — |
| Playwright desktop | Pendente | URL | Emulação/SwiftShader |
| Playwright mobile | Pendente | URL | Não substitui dispositivo físico |
| Inspeção visual | Pendente | Capturas + ambiente | Precisa de revisão humana |
| Inspeção de áudio | Não aplicável / Pendente | Gravação / dispositivo | Preferência subjetiva |

## 4. Publicação e aceite

- **DEV:** URL, versão e SHA realmente implantados; se não publicado, escrever “pendente”.
- **HML:** versão, SHA, gate e data; nunca inferir de DEV.
- **PROD:** commit e release publicada; se não promovida, escrever “não promovida”.
- **Aceite humano:** quem verificou, em qual dispositivo, qual versão e qual resultado.
- **Rollback:** plano e, se executado, evidência do retorno.
- **Problemas residuais:** riscos, limitações, trabalho futuro.

## 5. Aprendizado e próxima hipótese

Descrever o que não funcionou na primeira tentativa, como foi detectado, o custo de retrabalho (quando instrumentado) e o que mudaria no processo. **Não transformar falha do gate em fracasso do produto nem confundir build verde com experiência aceita.**

[Case principal](README.md) · [Matriz de evidências](EVIDENCIAS.md) · [Métricas](METRICAS.md).
