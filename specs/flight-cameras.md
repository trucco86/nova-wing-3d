# Navegação ampla e câmeras — web 1.7

Pedido: reduzir sensação de nave presa ao centro, acompanhar deslocamento pelo cenário e oferecer cockpit, perseguição e combate distante. Entrega primeiro na web; apps aguardam validação.

- A área de voo web passa de ±25 para ±72 unidades horizontais, com altura entre -1 e 46. São limites de missão, não da tela. Avanço da campanha permanece guiado; não prometer exploração 360°.
- Perseguição deixa a nave se deslocar dentro do enquadramento antes de acompanhar; câmera acompanha além dessa faixa, mantendo a nave visível em paisagem e retrato.
- C alterna perseguição, cockpit e combate; botão de câmera funciona por toque. Transições suavizam posição/FOV. Pausa congela câmera e impede troca; fenda 2D mantém sua perspectiva, depois restaura escolha.
- Cockpit mostra painel, estrutura e dois canhões com clarão sincronizado ao tiro real, ocultando casco externo durante o voo. Tiros, retículo e colisões permanecem no mesmo mundo.
- Combate afasta câmera e amplia campo de visão; não altera velocidade, dano, recursos ou cadência.
- Apps preservam limites e câmera anteriores; escolha começa em perseguição em nova campanha. Recompensas continuam alcançáveis e passam a nascer na vizinhança lateral da nave.
- Validar deslocamento da nave na tela, acompanhamento, limites, pausa, reinício, alternância com teclado/toque, tiros e renderização sem erros nas três câmeras, inclusive retrato.
