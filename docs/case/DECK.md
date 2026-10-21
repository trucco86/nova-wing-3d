# Deck executivo — Nova Wing: o aprendizado maior do que o jogo

**Apresentação proposta: 8 telas / 7 a 10 minutos.** Público: executivos de tecnologia, engenharia e produto. Não é uma apresentação de performance financeira comprovada.

## Slide 1 — Um jogo de nave. Um experimento de engenharia.

**Headline:** _O produto é o Nova Wing. O case é o processo que conseguimos construir ao redor dele._

Visual: arte/captura real do jogo, sem diagramas nesta primeira tela.  
Fala: objetivo de validar ideia e aprender sobre entrega acelerada com IA, não vender um jogo.

## Slide 2 — Ideia → primeiro protótipo → feedback

**Headline:** _A distância entre imaginar e testar ficou menor._

Visual: três quadros com hipótese, protótipo e jogador avaliando.  
Fala: o jogo permitia perceber movimento, colisão, HUD e som imediatamente. **Não atribuir número de dias economizados sem baseline.**

## Slide 3 — O problema mudou quando o produto cresceu

**Headline:** _Gerar a primeira versão era simples. Preservar o que funcionava era outra história._

Visual: imagens reais de controles mobile, chefe e áudio com labels de risco.  
Fala: regressões e complexidade — alterações localizadas podem afetar o restante.

## Slide 4 — Contexto: transformar conversa em contrato

**Headline:** _Se a decisão só existe no chat, a próxima alteração começa sem memória operacional confiável._

Visual: mapa de `AGENTS.md`, `specs/`, `skills/`, `docs/`.  
Fala: por que conhecimento versionado reduz ambiguidade e o que ainda exige revisão humana.

## Slide 5 — Especialização por etapa, não agentes soltos

**Headline:** _Cada etapa precisa de uma responsabilidade, uma entrada e uma evidência de saída._

Visual: pipeline de [papéis e handoffs](PAPEIS-E-HANDOFFS.md). **Legenda obrigatória: modelo proposto.**  
Fala: Product Discovery → Requirements → Architecture → Implementation → Quality → Review → Release → Learning. Skills existentes ≠ agentes autônomos executando.

## Slide 6 — Harness e validação: reduzir feedback sem mascarar risco

**Headline:** _Não basta uma resposta do agente dizendo “funciona”._

Visual: foto da execução real do teste/screenshot e diagrama “harness determinístico + navegador + pessoa”.  
Fala: casos reproduzíveis, teste de produção com interface injetada e complemento visual real.

## Slide 7 — CI/CD: de alteração para release auditável

**Headline:** _Cada release precisa de um commit e de uma história de evidências._

Visual: [CI oficial](../../.github/workflows/ci.yml), [run v1.15](https://github.com/trucco86/nova-wing-3d/actions/runs/39591873578), [PR #24](https://github.com/trucco86/nova-wing-3d/pull/24).  
Fala: gates, versões, falhas e rollback. CI verde não implica zero defeitos. Proteção de main exige verificação administrativa.

## Slide 8 — O que eu levaria para uma plataforma de produto

**Headline:** _IA acelera a geração. Engenharia determina se conseguimos evoluir com confiança._

Visual: cadeia com loop de feedback; links de demo e repositório.  
Fala: aplicar os princípios em produtos reais, medir custo/qualidade/lead time e ampliar o modelo de agentes apenas quando houver observabilidade e limites.

## Perguntas que a liderança provavelmente fará

**“Qual ganho de produtividade?”** Não há baseline controlado. O case demonstra entrega e processo; [instrumentação](METRICAS.md) define como quantificar.  
**“Agentes trabalharam sozinhos?”** Existem instruções, skills e fluxo de agentes assistidos; orquestração automática por estágio é uma proposta, não uma evidência atual.  
**“Passou em todos os dispositivos?”** CI browser e outras validações existem, mas testes humanos em GPUs/dispositivos reais ainda são relevantes.  
**“Isso serve para sistemas empresariais?”** Sim como padrão de engenharia; não como substituto de segurança, compliance, observabilidade e operação corporativa.

[Case](CASE-STUDY.md) · [Vídeo](VIDEO.md) · [Evidências](EVIDENCIAS.md).
