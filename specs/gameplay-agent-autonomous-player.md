# Gameplay Agent: jogador autônomo e avaliador de experiência

## Objetivo do produto

Construir um agente que entre no Nova Wing pelo fluxo normal do navegador, descubra como jogar, tome decisões durante a partida e avalie a experiência como um jogador real. Ao final, deve entregar feedback acionável, com evidências reproduzíveis, e validar se uma mudança melhorou ou piorou a experiência.

O produto não é apenas uma suíte Playwright, um bot que segue uma sequência fixa de teclas ou um coletor de telemetria de chefes.

## Diagnóstico honesto do estado atual

A implementação existente de Gameplay Quality Agent é uma **sonda observacional determinística**:
- abre rotas de laboratório por cenário;
- usa `window.fixture` e APIs internas de QA para avançar o tempo e consultar snapshots;
- executa verificações predefinidas em cidade, Marte, Reator e Europa;
- gera JSON, screenshots e clipes curtos para revisão.

Isso é útil como instrumentação e regressão, mas não demonstra autonomia de jogador. Não descobre sozinho como iniciar uma partida, não aprende controles, não escolhe objetivos em uma campanha sem roteiro, não avalia a experiência completa e não gera recomendações de design com validação causal.

O agente autônomo ainda precisa ser construído. Não devemos apresentar a sonda atual como se já cumprisse esse objetivo.

## Princípios arquiteturais

### 1. Separar jogar de observar

**Player Runtime**
- Interage somente pela superfície que um jogador teria: viewport, pixels renderizados, texto e controles acessíveis/visíveis.
- Envia teclado, mouse e toque pelo navegador.
- Não consulta posições internas, HP oculto, colisores, estado de chefe, APIs de fixture ou snapshots para decidir o próximo movimento.
- Pode manter memória da sessão e inferir estado a partir do que foi apresentado ao jogador.

**Observer / Evidence Runtime**
- Coleta console errors, falhas de rede, screenshots, vídeo, duração, inputs enviados e checkpoints.
- Pode consumir telemetria de QA para explicar um achado, mas deve marcá-la como evidência privilegiada, separada da percepção do Player Runtime.
- Nunca injeta comandos no Player Runtime nem corrige o comportamento durante uma sessão.

Essa separação evita que o agente pareça inteligente por acessar informações que um jogador real não teria.

### 2. Política de jogador, não roteiro

O Player Runtime recebe observações e escolhe uma ação com base em:
- objetivo atual (entender menu, iniciar, sobreviver, explorar, combater, concluir);
- sinais visíveis (HUD, inimigos, projéteis, alertas, tutorial, estado da nave);
- perfil comportamental;
- histórico recente de ações e consequências.

A política pode usar um modelo multimodal por trás de uma interface substituível. O executor de browser e a interface de política devem ser desacoplados. A primeira versão pode ter uma política heurística para controles básicos, mas deve declarar explicitamente o que é heurístico e o que é inferência do modelo. Não chamar sequência fixa de teclas de autonomia.

### 3. Perfis de jogadores

Os perfis alteram preferências e tolerância a risco, não o acesso a informações:
- **Iniciante:** explora menus, demora a reconhecer controles, usa movimentos simples, precisa de instruções claras.
- **Casual:** procura progresso e diversão, evita repetição e não otimiza cada combate.
- **Agressivo:** prioriza combate e avanço, aceita risco maior.
- **Explorador:** testa limites, rotas e interações menos óbvias.
- **Experiente:** reage mais rápido e usa mecânicas avançadas quando são ensinadas/descobertas.

Cada perfil precisa de parâmetros versionados e sessões repetíveis. Perfis não são personas textuais sem impacto mensurável na política.

## Ciclo ponta a ponta

1. **Receber build e objetivo:** SHA, URL de DEV/PR preview, desktop ou mobile, perfil e duração máxima.
2. **Entrar como usuário:** abrir a URL sem deep link de QA, observar a tela inicial e navegar pelos controles visíveis.
3. **Jogar:** escolher ações a partir das observações atuais, registrar por que cada ação foi tomada e avaliar o resultado observado.
4. **Detectar fricção:** identificar bloqueios, instruções insuficientes, controles difíceis, feedback visual/sonoro ambíguo, dificuldade desproporcional, repetição ou interrupção.
5. **Produzir feedback:** separar fato observado, hipótese, impacto para o jogador e recomendação.
6. **Reproduzir:** criar uma sessão de confirmação independente, com o mesmo build/perfil e condições documentadas.
7. **Validar correção:** executar sessões equivalentes antes/depois, comparar métricas e evidências, procurar regressões em outros perfis/dispositivos.
8. **Emitir parecer:** `PASS`, `FAIL`, `REVIEW_REQUIRED` ou `BLOCKED`. Ausência de achados em uma amostra não significa aprovação global.

## Contrato de sessão

Cada sessão deve persistir:
- `schemaVersion`, `sessionId`, data, SHA, URL/ambiente, versão do jogo;
- dispositivo lógico, viewport, escala, perfil e configuração do Player Runtime;
- objetivo e limites da sessão;
- observações visuais com timestamp;
- ações de teclado/toque, duração e justificativa resumida;
- checkpoints, estado terminal percebido e motivo de encerramento;
- erros do navegador, screenshots e referência a vídeo;
- achados com severidade, confiança, evidência e passos para reprodução;
- limitações e dados ausentes.

O relatório deve distinguir `playerObserved` (o que o jogador poderia perceber) de `qaTelemetry` (dados internos de diagnóstico). Não misturar os dois como se tivessem a mesma proveniência.

## Contrato de feedback

Cada achado deve conter:
- **Título e severidade:** P0 bloqueador, P1 alto, P2 médio, P3 baixo.
- **Tipo:** defeito funcional, usabilidade, dificuldade/balanceamento, feedback visual/sonoro, performance observada ou hipótese de design.
- **Perfil e ambiente afetados.**
- **Fato observado:** o que ocorreu, sem inferência.
- **Impacto:** por que isso prejudica a experiência.
- **Reprodução:** build, rota de entrada normal, sequência de ações, duração e resultado.
- **Evidência:** timestamp, screenshot/clipe e logs relacionados.
- **Hipótese de causa:** explicitamente marcada como hipótese.
- **Recomendação:** mudança concreta e trade-offs.
- **Confiança:** evidência forte, moderada ou fraca.

O agente pode sugerir mudanças e abrir issue/PR experimental, mas não deve alterar o jogo automaticamente como consequência de uma avaliação sem uma etapa explícita de aprovação.

## Validação de mudanças

A comparação pré/pós deve manter constantes, tanto quanto possível:
- SHA e configuração de cada build registrados;
- perfil, viewport, dispositivo lógico e objetivo;
- duração/critério de término;
- número de repetições suficiente para separar ruído de melhoria.

Medir pelo menos:
- taxa de início e conclusão da jornada;
- tempo até primeira ação bem-sucedida;
- mortes, reinícios e bloqueios;
- ações sem efeito percebido;
- frequência de uso e descoberta de controles;
- tempo em menus/pausas;
- erros de runtime e falhas de interação;
- avaliação subjetiva do jogador humano quando a conclusão depender de diversão, ritmo, estética ou sensação.

Não usar tempo acelerado da fixture como FPS real ou duração percebida por humanos. Não declarar melhoria causal a partir de uma única execução.

## Marcos de implementação

### M0 - Contrato e separação de responsabilidades
- Esta especificação.
- Inventário explícito das capacidades determinísticas existentes.
- Definição de interfaces entre browser control, observation, player policy, session recorder e report.

### M1 - Jogador autônomo mínimo em navegador real
- Entrar pela URL normal de DEV ou PR preview.
- Capturar screenshot e texto visível.
- Enviar teclado/toque reais pelo Playwright.
- Tomar decisões iterativas a partir de novas observações, sem usar `window.fixture` ou estado interno para decidir.
- Encerrar com relatório de sessão e evidência.
- Começar por uma jornada curta de menu até gameplay em desktop; mobile vem em seguida.

### M2 - Perfis e exploração
- Perfis iniciante, casual, agressivo e explorador.
- Descoberta de controles e objetivos sem sequência de ações fixa.
- Repetições e memória por build.

### M3 - Feedback crítico
- Classificação de achados, evidência, reprodução e recomendação.
- Triagem de falsos positivos e confiança calibrada.
- Revisão humana para avaliações subjetivas.

### M4 - Validador de entregas
- Rodar baseline antes e depois de uma mudança.
- Comparar sessões equivalentes e procurar regressões cruzadas.
- Parecer de qualidade para DEV/HML; sem aprovação automática de produção.

## Critérios de aceite do primeiro marco executável (M1)

M1 só estará concluído quando uma execução demonstrar:
1. O navegador abre a URL normal do jogo, sem rota `__dynamic` ou `qa*`.
2. O agente identifica a tela inicial a partir do que está visível.
3. O agente descobre/inicia a jornada usando inputs reais do browser.
4. As próximas ações dependem de novas observações, não de uma sequência predefinida de teclas.
5. Nenhum snapshot, fixture, posição interna ou estado oculto é lido pelo Player Runtime.
6. O relatório contém observações, ações, timestamps, screenshot/vídeo, resultado e limitações.
7. A sessão pode ser reproduzida por outro executor a partir do relatório.
8. A execução é validada em desktop antes de ampliar para mobile.

## Fora de escopo e governança

- Não alterar física, dano, colisão ou balanceamento como parte da implementação do Player Runtime.
- Não promover achados hipotéticos a bugs confirmados.
- Não aprovar a própria entrega nem autorizar merge/deploy.
- Não usar produção para exploração destrutiva. Primeiros testes em DEV ou PR preview isolado.
- O agente não substitui testes determinísticos existentes; os dois sistemas têm objetivos complementares.
- Nenhum merge ou deploy ocorre sem aprovação explícita do mantenedor.

## Decisão de prioridade

A próxima implementação deve ser **M1: jogador autônomo mínimo no navegador real**. A expansão da telemetria específica de Colossus fica subordinada a essa prioridade e só deve continuar quando responder a uma pergunta de experiência concreta.
