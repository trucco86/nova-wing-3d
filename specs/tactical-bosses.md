# Web 1.10 — combate orbital tático

Referência de design: manual de Panzer Dragoon Saga (Sega, 1998), radar de risco,
reservas de ação e ataques de precisão. Adaptação própria para ação em tempo real;
sem copiar personagens, modelos, músicas ou interromper o tiro básico.

- Impactos na superfície da colisão: clarão visível e confirmação breve; bloqueios
  têm cor/ícone distintos, sem simular dano. Um bloqueio não apaga um acerto
  confirmado durante sua janela de 250 ms. Robôs mantêm HP atual.
- Checkpoint atualiza o indicador de arma na entrada, sem depender do primeiro frame.
- Chefes têm movimento corporal, orientação e ataques especiais por perfil. A
  telemetria antecipa a zona perigosa antes da execução; reposicionamento importa.
- Pontos fracos acompanham a orientação do chefe; scanner revela a leitura tática.
- Três reservas recarregam mais devagar durante órbita: precisão (1), reparo (2),
  rajada guiada (3). Custos e tempos congelam na pausa e reiniciam na campanha.
- Radar compacto lateral; ações na gaveta NAVE, sem novos blocos no centro.
- Preservar comportamento nativo e checkpoints, teclado/toque e progressão.
- Testar dano versus bloqueio, variação de chefes, telegraph antes de ataque,
  custos, pausa, reset e encerramento de chefes. Capturas desktop/toque na CI.
