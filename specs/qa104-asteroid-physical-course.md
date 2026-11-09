# QA104: passagem de lado e rochas físicas na fase 3

Entrega P0-B/C após a PR #300. Base `codex/qa103-asteroid-entry`, sem alteração nas fases 1/2 ou chefes. A candidata usa versão própria 1.27.104 para não sobrescrever QA103.

## Contrato

- Uma fenda de mineração vertical, largura 5.2 unidades, recebe a nave de lado. O casco conservador vem das malhas opacas do chassi; sua projeção usa a rotação real e escala. Segurar GIRO não concede invulnerabilidade nem reduz dimensões por booleano. Robô usa envelope próprio e deve voltar à nave para atravessar a fenda.
- Paredes em blocos minerais, dentes escalonados e fragmentos angulares compartilham exatamente as caixas de geometria/colisão. Sinalização mineral vertical marca a abertura, sem texto persistente no HUD.
- Trecho inicial ensina fenda; trecho seguinte tem rochas centrais/laterais com rotas alternativas; arena só abre após sair do percurso. Não há repetição infinita dos obstáculos.
- Colisão varrida em XYZ impede boost/dash atravessarem blocos. Impacto frontal freia o deslocamento da caverna no contato, preservando direcional, tiro e transformação para recuperar. Dano usa cooldown existente de 1.25 s.
- Ao soltar GIRO já dentro da fenda, o casco não pode se expandir por dentro da parede: conserva orientação até haver espaço. Toque curto e dash conservam seus controles existentes.
- Respawn, troca de chassi ou expansão que comecem sobrepostos recuam a caverna continuamente até liberar o casco, sem teleporte. Transformação que precisa de espaço fica pendente e só ocorre após esse recuo, com cobrança de energia apenas na execução; pausa cancela o pedido.
- Pausa congela distância e colisões. Reset repõe percurso. Boss/escape desativam o curso. Malhas instanciadas e recursos compartilhados, sem criação de geometria por frame.
- O limite radial legado da caverna não é ampliado nesta entrega. A física adicionada é local aos blocos novos; não alegar substituição completa dos limites antigos.

## Validação

Testes Node: passagem plana versus inclinada, projeção intermediária, robô, boost/CCD, movimento lateral e recuperação, 30/60/120 Hz, pausa/reset, geometria versus sólidos, projéteis. Browser: jornada e fenda com teclado e toque, quatro checkpoints desktop/mobile, liberação de input e chegada ao chefe. CI FULL obrigatória antes de merge; medições de FPS físico permanecem separadas.
