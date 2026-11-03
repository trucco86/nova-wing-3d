# Saturno Cassini + Ômega 4.0 — QA v1.27.72

## Direção planetária

- Fotografia natural Cassini: amarelo pálido, creme e bege com baixas saturações; evitar planeta laranja ou anéis excessivamente dourados.
- Os anéis ficam no plano equatorial **local XZ**, pois a esfera gira para a inclinação da câmera. O disco e suas três faixas são filhos do globo; a esfera opaca escreve profundidade para esconder o semicírculo posterior.
- Bandas C/B/A e lacuna escura da divisão de Cassini. Nenhuma rotação falsa da imagem do anel a cada frame, nem textura comprada com licença desconhecida.
- Referências NASA/JPL: https://science.nasa.gov/photojournal/saturn-in-color/ e https://www.jpl.nasa.gov/images/pia08306-colorful-division/.

## Ômega: nave-mãe biomecânica de Saturno

- Ao orbitar para trás, a visão do **lado traseiro aparece imediatamente**; a **nave e a câmera orbitam fisicamente em torno do chefe**, sem fazer Saturno, seus anéis ou a arena girarem. A transformação da câmera é cancelada no cenário, que mantém coordenadas inerciais.
- O Ômega **não acompanha continuamente** o ângulo do jogador: ao permanecer por **1,8 s no flanco esquerdo, direito ou na retaguarda** (ângulo a partir de 75° em relação à frente do casco), ele percebe o piloto e **gira o próprio casco** gradualmente para encará-lo. Voltar ao setor frontal antes desse tempo reinicia a contagem; depois de encarar o jogador, cessa o rastreamento até nova incursão lateral ou traseira. Sem salto de orientação.
- Durante preparação/ataque o chefe desacelera a rotação, permitindo esquiva e acerto real das baterias laterais/traseiras.
- Frente baixa: mordida com mandíbula; flanco: garras; piloto em robô: braços/martelo; altitude alta: varredura de tentáculos; retaguarda: tentáculos perseguidores.
- Os golpes usam a função `chooseBossIntent`, o relógio de 2,2s de aviso, `bossMeleeHit` e as mesmas áreas marcadas no radar. Animações são somente visuais; nunca criar colisores que não correspondam à zona de dano.
- As partes destrutíveis pré-existentes conservam localização e HP. Azul = blindado; âmbar = detectado; amarelo = fraco naquele ângulo. Sem alvos fictícios. HUD informa onde orbitar.
- Quebra de bateria já restringe as armas via `bossBatteryPlan`; não modificar o sistema de geração de projéteis.

## Critérios de aceite

- Node: geometria dos anéis, paleta de referência, câmera e planeta fixos durante órbita, nave mudando de posição, atraso de 1,8 s em ambas as laterais e na retaguarda, reset no setor frontal, giro limitado do casco (inclusive ângulo +/-pi), quatro ataques, dois hardpoints preservados e fase 4 sem regressão.
- Playwright: quatro shards, screenshots e console limpo, browser mobile emulado.
- Humano: comparar Saturno com fotografia Cassini; assistir ataque de mordida e braço, tentar orbitar pelo lado e chegar às costas, atingir as duas baterias, conferir radar e seus feedbacks.
- FPS Alto/Médio em celular real: comparar p95, triângulos e draw calls com v1.27.71; não assumir performance pela quantidade de objetos.
- Nenhuma alteração a main/PROD sem aceite.
