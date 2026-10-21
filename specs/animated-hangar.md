# Web 1.13 — capa viva e hangar 360

- Preservar a capa aprovada. Animar aproximação lenta, estrelas e luz sem modificar a arte; respeitar movimento reduzido e suspender fora do menu.
- Reutilizar recortes da arte original nos cinco retratos e na ficha, com nomes e perfis existentes.
- Oferecer inspeção 3D separada de piloto e nave antes de iniciar. Naves usam os modelos e cores reais do jogo; pilotos usam esculturas procedurais inspiradas na arte, sem prometer reconstrução fiel da imagem.
- Bia preta e Jenifer cinza do mesmo porte; Christopher e Bob pretos e quase iguais em porte, Christopher com cabeça maior; Calvinho pequeno, preto e com pouco pelo.
- Arrastar com mouse/toque gira horizontalmente e inclina; botões permitem rotação, zoom, restauração e auto giro sem depender de gestos. Cancelar ponteiro libera captura. Seleção não altera controles da missão.
- Atualizar modelo e cor imediatamente; fechar seleção, iniciar missão ou ocultar página interrompe o renderer do hangar. Liberar recursos exclusivos ao trocar modelos e ao destruir.
- Preservar teclado, toque, pausa, checkpoints e orçamento de 2 MB. Validar modelos finitos e independentes, interação desktop/mobile, redução de movimento, build e gates.

- Com a capa/hangar opacos abertos, o renderer principal fica ocioso; o hangar renderiza continuamente apenas em auto giro. Interações e resize continuam renderizando sob demanda.
