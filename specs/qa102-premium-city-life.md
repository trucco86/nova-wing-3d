# Nova Wing v1.27.102 — cidade premium viva e detalhada (QA)

## Motivação
A primeira fase agora permite voo livre e tem viadutos físicos, mas ainda precisa de elementos de escala pequena que façam o cenário parecer uma cidade habitada, com profundidade, atividades de manutenção e pontos de referência além das fachadas genéricas. O pedido atual é aumentar os detalhes do jogo preservando toda a mecânica que já passou por QA.

## Escopo v1.27.102
1. **Rooftops habitados**: instalar heliportos/taxiports circulares com pintura metálica, anéis de aproximação e luzes de balizamento sobre telhados pré-existentes; ancorar cada elemento às dimensões da torre real, nunca deixá-lo flutuar.
2. **Infraestrutura ativa**: elevadores técnicos externos e pequenas cápsulas de manutenção que sobem e descem fachadas, com trilhos fixos e luzes de segurança. As plataformas precisam se mover em diferentes fases temporais e sentidos, não em um enxame sincronizado.
3. **Mecânica de edifício**: exaustores e condensadores nos telhados, sinalização de serviço, suportes e dutos aparentes com cores industriais. Perfil Alto inclui vapor sutil e rotores; Médio preserva a silhueta da infraestrutura e os elevadores mais visíveis.
4. **Detalhe ao longo do percurso**: distribuir conteúdo tanto perto quanto longe do observador, com materiais metálicos e iluminação coerentes, preservando as peças de cidade já aprovadas, destroços, ISS e progressão cidade→órbita.
5. **Performance**: instanciar geometria repetida com lotes limitados de chamadas de desenho e atualizar matrizes já alocadas, sem criar Mesh/Material/Geometry dentro de animações. Alto e Médio devem ter densidades diferentes; não ativar a camada no tema oceano nem em Marte.
6. **Sem obstáculos decorativos fantasmas**: todos os equipamentos novos ficam ancorados em edifícios fora do volume lateral do piloto, são `visualOnly` e não participam da colisão; os viadutos e destroços efetivamente sólidos permanecem inalterados. Como o usuário exigiu colisões corretas, nenhuma nova barreira global é aceita.
7. **Compatibilidade de QA**: teclado, mobile, cinco gatos/cockpit, BLINDADO discreto, giro do robô, câmera com fade, Super Boost, dez setores e o arquivo HTML de distribuição não podem regredir.

## Aceitação observável
- Em perfil Médio e Alto, ambos os tiles urbanos contêm heliportos sobre os telhados reais, elevadores em movimento assíncrono, trilhos, dutos e luzes. No Alto há mais cápsulas e plumas de exaustão.
- Os elevadores se deslocam em altura com o avanço temporal. As partes rígidas e luzes de uma cápsula compartilham o mesmo percurso; após reset retornam ao estado inicial. Tile próximo e clone distante mantêm animações independentes sem deslocamentos compartilhados.
- Nenhuma nova geometria é criada durante 600 atualizações, e o teto de instâncias por categoria é respeitado. Todo equipamento novo fica fora do limite x=±72 e não adiciona colisor.
- Capturas em desktop/mobile mostram pontos de referência e parallax adicional sem cobrir controles, câmera ou silhueta da nave. Qualidade Média deve reduzir detalhes mantendo continuidade.
- Build, lint, Node, testes WebGL dirigidos e quatro shards de browser obrigatórios antes de recomendar homologação; avaliação FPS em dispositivo físico pendente.

## Fora do escopo imediato
Não reabrir física de viadutos, combate, chefes, IA, outras fases e telas com recursos decorativos não testados. A aplicação visual de outras fases requer iterações separadas, com testes específicos e identidade de cada planeta.
