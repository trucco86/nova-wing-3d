# QA106 | Multi-lock seguro ao perder foco

## Problema

Durante multi-lock do robô, pressionar N e trocar de janela pode provocar `blur` e pausa sem disparar `keyup`. O `releaseControls()` limpa as teclas, mas conserva `lockHeld`, `lockEnabled` e `lockQueue`. Após retomar, o robô mantém mira suspensa e bloqueia disparos automáticos normais.

## Contratos observáveis

1. Perda de foco, pausa ou liberação geral dos controles cancela o multi-lock em andamento sem disparar, gastar energia ou permanecer pressionado.
2. Após retomar, `multiLockHeld=false`, `multiLockTargets=0` e `lockEnabled=false` quando havia uma sequência multi-lock ativa.
3. Um toque rápido N segue alternando o auto-aim; segurar e soltar N durante gameplay segue liberando a rajada, se houver alvos e energia.
4. Estado, UX, gameplay, níveis e pontuação de outros setores não mudam.
5. Teclado e toque compartilham a mesma liberação, inclusive eventos cancelados.
6. Cenário determinístico do harness: iniciar boss com robô, segurar N até adquirir alvo, emitir `blur`, verificar cancelamento e energia, retomar e verificar novo LOCK válido.

## Gate

`npm run validate`, quatro shards browser, status da release e artefato HTML sincronizado no SHA final. Qualquer falha bloqueia promoção para HML e produção.
