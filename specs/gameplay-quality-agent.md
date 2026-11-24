# Gameplay Quality Agent: primeira entrega

## Escopo

Executor observacional no harness Playwright existente, sem mudanças no jogo ou na distribuição. Cenários de cidade, Marte, Reator e Europa; dois projetos de navegador. Não é ainda um jogador autônomo por LLM.

## Aceite

- Usar o jogo WebGL real do laboratório, não um mock.
- Cidade: movimentar pelo teclado ou joystick conforme projeto; registrar deslocamento e limites laterais.
- Marte: capturar aproximação e superfície e conferir o rótulo de rota.
- Reator: conferir abertura da arena e mudança de ângulo orbital via API do laboratório.
- Europa: observar painel íntegro e brecha com detritos, usando passos de simulação limitados.
- Registrar checkpoints, screenshots, achados e erros do executor. Relatório parcial ou indisponível não aprova.
- Preservar testes obrigatórios, ranking, build, proteção de branch e autorização humana.
- Não confundir screenshot com análise visual, tempo simulado com FPS real ou fixture com campanha completa.

Referência: [contrato operacional](../docs/GAMEPLAY-QUALITY-AGENT.md).
