# P0 — Ergonomia mobile do chefe e naves espaciais

## Cenários observáveis

1. Na arena do chefe, os botões de rotação esquerda/direita devem ficar no canto inferior junto ao joystick, nunca sobre a nave ou o retículo.
2. TIRO é a ação primária ao alcance do polegar direito, com BOOST adjacente. ROBÔ, PODS, BOMBA e GIRO não podem sobrepor nenhum outro alvo interativo.
3. Validar 320×568 e 390×844 em portrait, 844×390 em landscape e margens seguras. Ações principais com 60px em portrait; orbitais com 48px ou mais.
4. A configuração para canhotos deve espelhar orbitais junto ao joystick. Durante pausa ou saída da arena, não aceitar rotação indevida.
5. Cargueira, satélite, destroço e capitânia devem ter silhuetas reconhecíveis, detalhes de blindagem, motores e elementos funcionais.
6. Peças físicas dos cargueiros entram nos volumes de colisão. Peças luminosas pequenas podem ser meramente decorativas.
7. Não modificar duração de fases, lógica de BOOST, economia, save, materiais remotos ou funcionalidades sem relação.

## Evidências

- Teste de navegador com toque real na órbita e screenshots portrait/landscape; checagem de retângulos dos alvos.
- Testes de geometrias e sólidos, incluindo as naceles dos motores das cargueiras.
- CI verde no SHA final e avaliação de FPS/capacidade em hardware real antes de HML/PROD.