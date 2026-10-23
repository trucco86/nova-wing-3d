# v1.20 — Subchefes táticos

## Objetivo

Concluir a parte de subchefes do NW-06. As dez silhuetas existentes precisam produzir
confrontos reconhecíveis por movimento, preparação e ataque, sem permanecer lentas e
quase estáticas no centro da rota.

## Critérios

- Web: os dez subchefes usam perfis táticos identificáveis, com aproximação mais rápida,
  deslocamento próprio em X/Y, inclinação e cadência por fase independentes do FPS.
- Cada perfil informa no HUD o nome do subchefe e seu ataque; nos instantes anteriores à
  rajada, o canhão emite um brilho da cor do perfil e o HUD exibe o alerta correspondente.
- As assinaturas existentes de projéteis continuam abertas a uma rota de fuga. Perfis
  alternam tiro direto, pinça, leque ou rajada dupla e podem usar plasma, fogo ou arcano.
- As fases 2 e 3 aumentam pressão por cadência e movimento, sem teleporte, contato
  inevitável ou projéteis acima do limite global atual.
- Pausa congela posição, carga, HUD e projéteis; reinício e troca de setor restauram o
  perfil correto.
- HP, fraquezas, dano, recompensas, bombas, túnel e sequência da campanha não mudam.
- O comportamento nativo anterior permanece intacto. Android e iOS continuam sem build
  ou publicação nesta fase.
- Capturas desktop e mobile devem mostrar subchefe, brilho de preparação e HUD legível.
  Tempos de frame da fixture são apenas diagnóstico de Chromium/SwiftShader.

## Validação

Testes puros cobrem os dez perfis, limites e cadências. O harness real cobre entrada,
ataque, pausa e reinício. A suíte browser captura o confronto em desktop e mobile. Os
gates finais são `npm run format`, `npm run build` e `npm run validate`; a CI executa a
validação browser no commit final. O HTML permanece abaixo de 2 MB.
