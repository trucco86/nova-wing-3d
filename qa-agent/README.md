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

## Executar localmente

Requer Node.js 24, Python 3.12+, Chromium/Chrome disponivel para Stagehand
e uma **chave de API do provedor do modelo** com credito/limite configurado.

Terminal 1 (a partir da raiz do repositorio):

```bash
npm ci
npm run build
npm run dev
```

Terminal 2, na mesma raiz:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r qa-agent/requirements.txt
read -s OPENAI_API_KEY  # cole a chave, pressione Enter; nao aparece na tela
export OPENAI_API_KEY
.venv/bin/python qa-agent/run.py --scenario menu-desktop --max-model-calls 10
```

Para observar o Chrome e outros cenarios:

```bash
.venv/bin/python qa-agent/run.py --scenario mobile-hud --show-browser
.venv/bin/python qa-agent/run.py --scenario rpg-orbit --show-browser
```

O modelo e selecionavel com `--model` (padrao experimental
`openai:gpt-5.5`), dependendo da disponibilidade na conta/API.
O browser Stagehand usa separadamente `--browser-model openai/gpt-5.4-mini`
(com a MESMA `OPENAI_API_KEY`), seguindo o SDK Python oficial. Esses
modelos podem ter cobrancas diferentes. Use `--model openai:gpt-5.4-mini`
se o projeto/API suportar e quiser experimentar um agente menor.
A chave e lida apenas da variavel de ambiente do terminal; nao a adicione
em `src/`, no HTML publico, no GitHub, nem a compartilhe em chats.
Para evitar grava-la no historico do shell, utilize a leitura interativa acima.
Em Bash e Zsh, `read -s` oculta a entrada digitada.

O runner aceita somente uma URL HTTP **localhost/127.0.0.1** e exige
um servidor respondendo antes de iniciar. Nao usa login de producao.
Apenas execute contra uma versao local sob seu controle.

## Observabilidade e custo

- Deep Agents e Stagehand sao bibliotecas open source; o browser local
  nao exige uma assinatura de hospedagem.
- A API de IA **pode cobrar tokens**, inclusive por imagens/acoes.
  `--max-model-calls 10` limita chamadas do modelo, **nao** impoe um teto
  monetario de gastos, nem garante que o cenario termine.
- Para traces em LangSmith (opt-in): configure `LANGSMITH_TRACING=true`,
  `LANGSMITH_API_KEY` e opcionalmente `LANGSMITH_PROJECT=nova-wing-qa-poc`.
  Nao habilite tracing com credenciais de usuarios reais.
- O script salva relato, duracao e limite em `artifacts/agent-qa/`. O campo
  de custo permanece **nao apurado** ate conferencia com o provedor/LangSmith.
- Compare taxa de passos reproduzidos, defeitos confirmados, tempo humano
  economizado, custo por bug valido e falhas regressivas evitadas; nao crie
  percentuais de ganho antes de uma baseline.

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
