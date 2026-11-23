# QA180 | Abertura da fase 1 com saída real do hangar

## Diagnóstico

A versão principal ainda executava a animação antiga de cinco naves substitutas, com a nave selecionada oculta. As correções anteriores estavam nos PRs #406 e #413 (ambos em draft) e não podiam ser promovidas diretamente sem conciliar o código atual da main.

## Alteração isolada sobre main

- Importar somente o hangar cinematográfico/abertura de QA168-169, **sem** carregar os patches de chefes ou o treinamento opcional do #406.
- Fase 1 e somente quando `enableSquadIntro`: câmera atrás da nave, três momentos contínuos em 6,5 segundos, portas deslizantes, hangar com teto e fundo fechados, piso e galerias, passagem pelo portão e retorno à câmera do gameplay.
- Manter a **instância real** da nave do jogador no centro com a seleção de piloto, chassi e pintura existente. As quatro naves de apoio usam modelos de referência distintos; nenhuma quinta nave fantasma substitui o protagonista.
- Ocultar HUD/controles móveis/tags gigantes durante a entrada, oferecer botão `PULAR DECOLAGEM` e restaurar controles com segurança ao término ou skip.
- Efeitos 3D de hangar temporários não participam da física nem alteram fases 2-10, boss, checkpoints ou relógio da missão. Recursos são descartados no destroy.

## Critérios de aceite obrigatórios

1. Capturas Playwright desktop/móvel em hangar (0,4s), saída (2,6s) e aproximação (5,3s) mostram o **mesmo** protagonista e as quatro escoltas; não basta testar apenas flags.
2. O observador consegue entender de onde a nave partiu, por qual portão passou e qual direção está seguindo. A nave, a porta e os detalhes de pista preservam continuidade espacial.
3. Portas abrem antes da aceleração e não ficam em frente à câmera quando se cruza o limiar.
4. HUD/joystick/nomes de aliados ausentes até terminar a cinemática, botão de skip acessível e controles funcionais imediatamente depois.
5. CI: `format:check`, `build:check`, `validate`, quality e Playwright 6/6 no SHA integrado; sem regressão de gameplay, colisão, saves ou cenário.
6. Homologar em smartphone físico e medir FPS/frametime; não confundir Playwright verde com aceite visual.

## Política

Branch de integração específica, base original main v1.27.158, candidata prevista 1.27.161. Reconciliar versão se a PR #431 for integrada antes. **Draft, sem merge, sem publicação em produção até aprovação.**

## Integração contínua

- Recriada a distribuição web após a remoção do import obsoleto `formationPose`, com fonte e `index.html` sincronizados.
- O teste adicional protege piloto Bob, nave Specter e cor Crimson após o botão PULAR DECOLAGEM.
- Exigir CI completa no commit humano final, porque pushes originados por `github-actions[bot]` podem registrar checks não executados.

## QA180.1 | Velocidade e continuidade externa

- Adicionadas famílias InstancedMesh de balizas exteriores a partir do portão; elas percorrem o campo visual junto ao cenário, criando parallax mesmo com a nave em coordenadas físicas estáveis no rail shooter.
- Os marcadores externos perdem opacidade conforme ocorre o handoff, sem desaparecer abruptamente no meio da aceleração.
- A chama dos propulsores da nave protagonista aumenta durante a saída e volta ao estado padrão ao pular ou terminar a cinemática.
- Novos testes fixam deslocamento de parallax, fade para zero e ausência de propulsão presa após o skip.
- Aceite visual continua dependente de revisão das capturas e do gameplay real no preview PR #440.

## QA180.2 | Auditoria perceptiva e correções dos screenshots Playwright

A captura da candidata anterior revelou quatro regressões reais mesmo com CI 6/6:

1. O teto opaco ocupava o topo do enquadramento e escondia a profundidade do hangar.
2. Os caças de escolta estavam próximos demais da câmera e eram cortados pelas laterais.
3. A passagem pelo portão não era legível na captura de saída. As folhas deixavam a pista parcialmente aberta no primeiro quadro.
4. Os controles `#cameraView`, `#pilotSwitch` e a indicação de vidas `#pilotName` vazavam durante a cinemática.

Correções: câmera inicial mais baixa e centrada, telhado elevado e iluminado, porta frontal de largura completa, travelling ligeiramente mais lento pelo portão, formação compacta e mais distante, recolhimento para fora do eixo visual e CSS ocultando os comandos que faltavam. Para telas em retrato, a câmera recua e centraliza a composição.

A revisão agora captura **quatro momentos** (0,4; 2,1; 2,6; 5,3 s) no navegador e mais três em retrato. Os testes automatizados verificam flags, geometria e elementos ocultos, mas a aprovação definitiva exige inspeção perceptiva das imagens e do gameplay. Não promover à produção apenas por CI verde.
