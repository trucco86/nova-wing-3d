# Mecha 2.0 — Integração limpa sobre DEV v1.24.18

## Contexto

A candidata histórica #69 acumulou diferenças com a DEV atual; evitar merge bruto e perda de controles mobile, arsenal/mapa, telemetria e qualidade. Esta branch nova parte da DEV v1.24.18 e porta somente rig 3D, pintura, evolução visual e animação do robô da #69/#91.

## Comportamento esperado

- Robô angular com armadura facetada, casco, asas com geometria compartilhada com o caça, canhões articulados, pernas animadas e turbina **dorsal** (não na cintura).
- Rotor de cinco pás, bocal com gimbal reativo ao joystick e ao boost; propulsão contínua com amortecimento, sem saltos de fase quando a energia muda.
- Transformação em combate, retorno à nave, progressão dos neons por níveis e cores do personagem escolhidas no hangar.
- Preservar o mapa da campanha, novas armas e HUD da DEV v1.24.18; não portar arquivos de versão, workflows antigos ou CSS de controles de branches defasadas.

## QA obrigatório antes de DEV/HML

- CI quality, testes unitários de geometria, ângulos, variações 30/60/120 Hz, pausa, reinício e fontes teclado/toque.
- Playwright desktop e mobile: transformação, boost, retorno ao caça, capturas frontal/perfil/traseira, gameplay real com chefe e queda de FPS.
- Comparação da proporção de asas e robô com arte aprovada; verificar turbinas nas **costas**, braços e pernas estilizados.
- Homologação visual explícita em preview. A aprovação anterior da v1.24.17 no celular não homologa este novo modelo.

**Não publicar em produção automaticamente.**
