# QA166 | PERFURADOR com silhueta inteira no celular

## Evidência antes da correção
A captura real `asteroid-boss-arena.png` da QA165 no Chromium
390 × 844 mostra o PERFURADOR muito grande na orientação retrato,
com componentes cortados e disputando espaço visual com o HUD.
Os testes da QA165 provam a progressão da fase 3, mas não o enquadramento.

## Alteração proposta
- Nova lente de **89 graus**, aplicada progressivamente pelo camera rig
  somente quando o setor 3 está em luta contra o chefe e a tela tem
  proporção inferior a 0,7.
- Desktop, landscape, cockpit, outros setores e gameplay pré-chefe
  preservam suas lentes atuais.
- Não altera escala/posição física do modelo, hitboxes, geradores, dano,
  armas, origem dos disparos, posição do piloto ou gameplay.
- Sem novos meshes, draw calls nem texturas. A FOV maior pode renderizar
  mais cenário, portanto FPS deve ser medido fisicamente antes do merge.

## Verificações
- Testes Node de seleção de lente e interpolação temporal.
- Playwright para browser mobile e desktop: capturas frontais, flanco
  e traseira do **chefe real**, com HUD, geradores e snapshots de órbita.
- Revisão humana obrigatória das imagens do artefato Playwright.
- Teste do jogo completo QA165 mantido sem alterações.

## Limites
Não prova que o boss permanece totalmente visível sob todos os
movimentos extremos, nem testa iluminação em aparelho físico.
PR Draft dependente da QA165, sem merge ou deploy em produção.
