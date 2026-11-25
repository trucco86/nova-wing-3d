# Nova Wing: contrato de qualidade visual, colisão e legibilidade

**Status:** requisito obrigatório de aceite para mudanças em cenários, personagens, inimigos, chefes, câmera, controles, obstáculos e efeitos. Aplica-se a Web, mobile e modos nave/robô.

## Invariantes (bloqueiam a entrega)

1. **Sem interpenetração indevida:** nave, personagem, inimigos e objetos sólidos não atravessam paredes, chão, pilares, estruturas ou uns aos outros. Usar colliders coerentes com a geometria visível; testar em movimento, boost, dash, giro, órbita, transformação e mudanças de fase. Evitar tunneling em alta velocidade com swept collision/substeps quando aplicável.
2. **Sem colisão fantasma:** um collider não bloqueia passagem onde não existe geometria sólida visível. Objetos decorativos ou efeitos não sólidos precisam ser explicitamente classificados.
3. **Obstáculos com propósito:** preservar obstáculos que criem desafio legível e evitável; remover, reposicionar, reduzir ou alterar geometria/colisão quando bloquear progressão, interação, câmera ou combate sem intenção de design. Não apagar obstáculos indiscriminadamente para passar no teste.
4. **Visão de combate:** câmera e objetos não podem ocultar persistentemente jogador, ameaças, projéteis, pontos fracos, alvos, objetivos e feedback de dano. Aplicar camera collision, transparência contextual, reposicionamento ou enquadramento quando necessário. Oclusão breve pode ser intencional, desde que haja antecipação e recuperação.
5. **Navegação verificável:** entradas, saídas, corredores, objetivos e arenas têm rotas alcançáveis com controles reais, sem teleporte de QA. Validar áreas estreitas e mudanças de modo nave/robô.
6. **Física consistente:** movimento, gravidade, empurrões, colisão e destruição respeitam regras declaradas. Efeitos especiais e exceções (fantasmas, hologramas, projéteis atravessáveis) devem ser documentados e identificáveis.
7. **Sem regressão visual:** objetos não surgem ou desaparecem abruptamente sem transição intencional; cenários, inimigos e chefes mantêm escala, orientação e continuidade.

## Matriz mínima de inspeção

| Contexto               | Evidência exigida                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Nave em corredor/túnel | Vídeo de aproximação, travessia, saída e colisão lateral                              |
| Robô em exploração     | Caminhar até cada objetivo, tocar paredes, contornar pilares e voltar                 |
| Chefe/arena            | Ataques de frente e de lado, órbita, pontos fracos e câmera sem obstrução persistente |
| Obstáculos móveis      | Colisão em velocidade normal e boost, sem atravessamento                              |
| HUD e câmera           | Capturas desktop e mobile nos momentos de maior densidade visual                      |
| Transições             | Vídeo antes/durante/depois, sem salto de geometria ou visão de fundo indevida         |

## Protocolo do agente de validação visual

1. Abrir preview da PR com build identificável por SHA; registrar dispositivo, viewport, fase e seed.
2. Executar cenários com **controles reais** e coletar vídeo, screenshot, trace e estado de colisão.
3. Detectar pares de colliders sólidos com penetração acima da tolerância física definida por classe; distinguir contato válido, efeito visual e colisão real. Nunca usar somente comparação de pixels como prova de física.
4. Medir oclusão da área de interesse (jogador, alvo, ponto fraco, objetivo) por intervalo de tempo e em múltiplos ângulos; sinalizar casos persistentes para revisão.
5. Verificar alcançabilidade de objetivos e saídas; registrar bloqueios com coordenadas e sequência de inputs reproduzível.
6. Emitir relatório por ocorrência: **fase, timestamp, posição, objetos envolvidos, evidência, severidade, causa provável e recomendação**.
7. Bloquear merge em defeitos P0/P1 confirmados. P0: progressão impossível, atravessamento crítico, alvo obrigatório invisível. P1: oclusão persistente, colisão inconsistente reproduzível. P2: defeito cosmético sem impacto na jogabilidade.
8. Reexecutar o cenário corrigido e um cenário adjacente para evitar regressão.

## Critérios para manter, mover ou remover obstáculos

- **Manter:** comunica risco, tem hitbox previsível, oferece reação e não compromete leitura do combate.
- **Mover/redesenhar:** funciona como desafio, mas encobre câmera, bloqueia rota ou gera colisão injusta.
- **Remover:** não tem função de gameplay, contradiz a geometria, impede objetivo ou produz obstrução gratuita.
- **Exceção:** cenário deliberadamente destrutível, puzzle ou perigo inevitável somente com telemetria, indicação visual e regra explícita.

## Definition of Done para PRs que alteram gameplay

- [ ] Colliders e classificação sólido/não sólido revisados
- [ ] Sem clipping ou tunneling reproduzível
- [ ] Navegação e objetivos validados com inputs reais
- [ ] Combate legível com câmera e HUD em desktop e mobile
- [ ] Obstáculos mantidos por função, não por decoração
- [ ] Vídeo, screenshots e trace vinculados à PR
- [ ] Cenários automatizados de regressão atualizados
- [ ] Exceções intencionais documentadas
- [ ] Falhas P0/P1 corrigidas antes do merge

**Implementação incremental:** este documento define o contrato de qualidade. Detectores automáticos de penetração, oclusão e alcançabilidade precisam ser implementados e calibrados no runtime; esta PR documental não comprova que já existam.
