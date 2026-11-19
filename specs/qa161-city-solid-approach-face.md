# QA161 | Não atravessar paredes sem rota alternativa

## Falha reproduzível no resolvedor

O `resolveCitySolidContact()` trata corretamente a maior parte dos encontros
quando é possível desviar lateralmente ou verticalmente. Quando o obstáculo
ocupa a largura e altura inteira da arena, o último fallback sempre coloca
a nave na face +Z, voltada para a câmera. Em aproximações partindo da face -Z,
o movimento atravessa a parede e surge do outro lado.

## Comportamento desejado

- Quando não existir solução em X/Y, manter a nave no lado pelo qual começou
  a aproximação, usando a posição atual do obstáculo e a margem 0.08.
- Tratar colisão com sólido estático e móvel (previousZ != center.z).
- Preserve do comportamento original de fuga quando a nave já começou
  sobreposta e está saindo do volume.
- Não adicionar barreiras invisíveis, alterar a largura ±72 ou interceptar
  voo sem contato real.
- Preservar HUD, nave, câmera, boss, RPG, pontuação, velocidade e controle.

## Testes

- Duas direções com passagem em alta velocidade.
- Parede em movimento, avanço grande por frame e posterior repouso.
- Sair de sobreposição sem bloqueio.
- Trajeto livre sem colisão.
- Suíte completa da Cidade e gameplay; Playwright seis shards em CI.

## Publicação

- Base QA160 #405, que depende da QA159 #404. Merge apenas na ordem correta
  após review, CI FULL e homologação física/visual.
- Release candidata v1.27.155; não publicar automaticamente.

## Evidência da preparação da candidata

- [Sync generated web #44592818396](https://github.com/trucco86/nova-wing-3d/actions/runs/44592818396): execução concluída com sucesso, incluindo preparação v1.27.155, geração HTML e validação.
- A PR #407 continua Draft; executar e verificar quality + todos os seis shards Playwright no SHA final, Source Repair e preview Cloudflare.
- O teste de regressão foi concebido para falhar antes da mudança quando o piloto cruza uma barreira integral de -Z para +Z, sem espaço para desvio em X/Y.
- Homologação no smartphone físico, vídeo dos dois sentidos de aproximação e investigação completa da issue #285 seguem pendentes.
