# POC isolada: Deep Agents + Stagehand para QA exploratorio

**Status:** experimental e opt-in. Este diretorio nao muda o gameplay, os testes atuais,
as fases aprovadas, os workflows da CI ou os ambientes DEV/HML/PROD.

## Por que adicionar se ja existe Playwright?

Playwright e o harness Node detectam regressoes conhecidas com criterios
repetiveis. Deep Agents usa Stagehand para **explorar** a interface com um browser
real e propor hipoteses de bugs. O resultado do agente e um relato a ser
verificado, **nao** um teste deterministico nem evidencia de que um bug existe.

- P0: menus inacessiveis, renderizacao WebGL indisponivel, controles essenciais bloqueados.
- P1: drawer RPG bloqueia orbita, HUD cobre a mira, layout de celular inutilizavel.
- P2: scroll exagerado, problemas de idiomas, comunicacao visual pouco clara.
- P3: microinteracoes e oportunidades de polimento visual.

## Compatibilidade Python (erro de instalacao de deepagents)

O pacote `deepagents` exige **Python 3.11 ou superior**. No macOS,
`python3` pode apontar para Python 3.9 ou 3.10, mesmo quando outra versao
estiver instalada. Confira ambos:

```sh
python3 --version
.venv/bin/python --version
```

Se forem anteriores a 3.11, use Python 3.12 (via Homebrew) e recrie **somente**
o ambiente virtual:

```sh
brew install python@3.12
rm -rf .venv
python3.12 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r qa-agent/requirements.txt
```

O comando `rm -rf .venv` exclui apenas o virtualenv desta pasta, nao apaga
codigo do jogo, fontes ou saves. **Nao executar no diretorio errado.**
Se `brew` nao estiver instalado, baixe o instalador macOS em
https://www.python.org/downloads/.

## Executar localmente

A POC atual usa **Ollama local** para o agente Deep Agents e para o navegador
Stagehand. **Nao e necessario OPENAI_API_KEY, LangSmith nem outra API paga.**
A documentacao anterior descrevia um prototipo de API diferente e nao correspondia
ao codigo atual. E necessario ter Node.js 24, Python 3.11+ (3.12 recomendado),
Ollama instalado e Chromium/Chrome local.

Na primeira instalacao, inicie o Ollama e instale um modelo local compativel.
No macOS, o aplicativo Ollama tambem pode manter o servico ativo em segundo plano.

```sh
# Terminal 1, caso o Ollama ainda nao esteja ativo:
ollama serve

# Terminal 2 (uma unica vez para baixar o modelo):
ollama pull qwen3.5:4b
```

Na raiz do repositorio, inicie o jogo no endereco
`http://127.0.0.1:4173/`:

```sh
npm ci
npm run build
npm run dev
```

Em outro terminal, sempre na raiz do repositorio:

```sh
python3.12 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r qa-agent/requirements.txt
.venv/bin/python qa-agent/run.py --scenario menu-desktop --max-model-calls 8 --show-browser
```

Se o virtualenv ja existir e estiver em Python 3.11+, nao o recrie.
Se estiver usando outro modelo disponivel localmente, selecione com
`--model nome:tag`; o preflight verifica se o modelo realmente esta instalado.

Para exercitar os demais fluxos:

```sh
.venv/bin/python qa-agent/run.py --scenario mobile-hud --show-browser
.venv/bin/python qa-agent/run.py --scenario rpg-orbit --show-browser
```

O browser so pode visitar a URL do jogo em localhost/127.0.0.1.
A POC e manual/opt-in e nao altera DEV, HML ou producao.
A importacao de pacotes Python, a inicializacao do Stagehand e a exploracao
ponta a ponta ainda exigem um smoke real no seu ambiente.

## Resultados e evidencias

Apos cada execucao, consulte os artefatos em `artifacts/agent-qa/`:

- `AAAAMMDDTHHMMSSZ-cenario.md`: relato detalhado do agente, **nao homologado**;
- `AAAAMMDDTHHMMSSZ-cenario.json`: metadados auditaveis (cenario,
  modelo, duracao, status e caminho do relato).

Visualize as dez ultimas execucoes, sem usar modelo ou chave de API:

```sh
.venv/bin/python qa-agent/report.py --latest 10
.venv/bin/python qa-agent/report.py --latest 10 --json
.venv/bin/python -m unittest discover -s qa-agent -p 'test_*.py'
```

O JSON pode alimentar dashboards, sem ser tratado como resultado de teste
funcional. O status `RELATO_NAO_VALIDADO` significa apenas que o agente
retornou texto. `BLOQUEADO` indica falha de execucao, nao necessariamente
bug no Nova Wing. Arquivos `.md` anteriores a esta evolucao continuam
legiveis; o consolidador conta apenas execucoes com sidecar JSON.

## Observabilidade e custo por entrega

Deep Agents, Stagehand, Ollama e o browser local nao exigem chamadas a
um provedor de modelos na nuvem no fluxo atual. A inferencia local
**tem custo de hardware, eletricidade e tempo**, mas esse custo nao e
mensurado automaticamente pelo runner.

- `--max-model-calls` limita chamadas feitas pelo agente principal; pode
  nao contabilizar todas as chamadas internas do Stagehand.
- `model_calls_actual`, `tokens_actual` e `cost_usd` sao registrados como
  `null` ate haver medicao real, nunca como zero estimado.
- Para medir o valor, confirme manualmente cada achado via Playwright/harness
  e registre tempo total, bugs reproduzidos e esforco de correcao.
- Tracing LangSmith fica **desabilitado** por seguranca na POC local. Nao
  configure chaves de API sem motivo e nao coloque segredos em relatorios.

## Escopo e limites tecnicos

| Cenario | Executa o que? | Nao demonstra |
| --- | --- | --- |
| `menu-desktop` | Capa, press start, hangar, abas, opcoes | Qualidade visual certificada |
| `mobile-hud` | Controles e HUD no viewport 844x390 | Safari/iPhone fisico |
| `rpg-orbit` | Entrada via QA local, RPG abrir/fechar, orbita acessivel | Que o chefe rotaciona corretamente em 3D |

Um canvas WebGL nao aparece semanticamente na arvore de acessibilidade.
Para afirmar que o chefe vira para encarar a nave, projete uma **API de
telemetria somente em DEV/fixture** contendo angulos, distancia, hardpoints,
colisoes e estado da batalha. Confirme com harness deterministico e teste
Playwright; nao use a opiniao de um LLM como assercao de fisica/colisao.

Requisitos para promover um bug encontrado:
1. Reproduzir em commit/SHA identificado, URL local e viewport.
2. Confirmar comportamento esperado/observado e screenshot/log sem segredos.
3. Escrever teste que falha antes da correcao e passa depois, se viavel.
4. Executar CI obrigatoria existente e revisão humana no celular.
5. **Nunca promover para DEV/HML/PROD automaticamente** a partir desta POC.

A integracao Python segue o exemplo oficial publicado pela LangChain em
03/11/2026: https://www.langchain.com/blog/how-we-optimized-browser-use-for-deep-agents

Browser local Stagehand:
https://github.com/browserbase/stagehand/blob/main/packages/docs/v4/configuration/browser.mdx

A depender da versao dos pacotes e do browser local, podem ser necessarios
ajustes apos o primeiro smoke test. **Nenhuma execucao de agente foi validada
na criacao inicial da POC**; o primeiro uso exige chave de API e Chrome local.
