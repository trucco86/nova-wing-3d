# Voo, combate terrestre e instalação biomecânica

## Comportamento esperado

- Câmera de perseguição com deslocamento lateral, direção de olhar e inclinação suaves. A cidade próxima apresenta paralaxe maior que o horizonte; a mira permanece alinhada com os tiros. Pausa congela câmera e cenário; reinício restaura ambos.
- Comunicações com fundo translúcido, retrato compacto e duração reduzida, fora do centro de mira. Alertas de ataques continuam legíveis.
- Toque: joystick e tiro/impulso simultâneos, pressão longa sem seleção, menu contextual, arraste ou scroll. Cancelamento, perda de captura, pausa e perda de foco liberam todas as ações. Um segundo dedo não rouba o joystick.
- Tanques sobre plataformas e robôs gigantes articulados nos setores terrestres. Canhões miram o jogador, partes luminosas sinalizam alvos. Pods teleguiados miram o centro elevado da área de dano de tanques e robôs, não a origem no solo. Tiros e bombas causam dano, rendem créditos e removem entidades.
- Obstáculos industriais com colisores tridimensionais correspondentes às peças sólidas; aberturas são transitáveis. Um túnel por setor terrestre possui entrada, saída, iluminação, barreiras alternadas com passagem e combate interno. Não reaparece após terminar; reinício e troca de setor limpam todos os elementos.
- Chefes preservam os dez tipos e geradores/núcleo, agora combinados com carapaça mecânica, mandíbula, olho, costelas e tentáculos animados. A decoração não cobre os pontos fracos.

## Gates

Testes determinísticos de câmera em 30/60 Hz, colisão com passagem e travessia rápida, spawns terrestres/túnel e limpeza, pressão simultânea/cancelamento. Playwright desktop/mobile testa inputs, ausência de erros WebGL, comunicações, captura de chefes e instalação. Testes visuais usam o renderer real e uma fixture não distribuída. Inspeção de screenshots complementa os gates; emulação não comprova comportamento em todos os aparelhos físicos. Não há garantia absoluta de ausência de regressões.
