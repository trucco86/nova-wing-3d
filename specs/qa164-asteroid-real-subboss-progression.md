# QA164 | Prova de progressão real da fase 3

## Contexto

O P0 #338 exige uma evidência de jogabilidade do **setor do asteroide**.
`tests/asteroid-course-game.test.mjs` atravessa rochas sem encontros.
`tests/qa105-asteroid-subboss.test.mjs` cria subchefe diretamente em QA,
mas não percorre a missão normal. Os helpers de separação do chefe também
não exercitam o fluxo inteiro do gameloop.

## Contrato

Este novo teste carrega um save normal no setor 3 e chama `start(true)`,
com **spawnEncounters true** e o curso físico ativo, sem o atalho de
cenários de desenvolvedor que desliga os encontros normais. O piloto usa controles
de giro e direção reais, cruza a fenda, contorna os fragmentos, completa
o curso, aguarda o subchefe único e comprova:

- nenhum subchefe é inserido antes de completar as rochas;
- chefe final não sobrepõe subchefe em nenhum passo;
- subchefe correto, HUD, pose de aproximação, invulnerabilidade do pause;
- bomba real reduz HP sem pular para o chefe.

Cura periódica é injetada pela API existente `collect('shield')` para
manter o piloto vivo no teste de duração longa. Inimigos, colisões, tempo,
câmera e gate de chefes permanecem ativos.

## Limites

Esta é **somente regressão do percurso e chegada ao subchefe**, não
uma vitória E2E, nem teste visual no iPhone. Não altera o gameplay;
não incrementa versão nem gera cópia de produção. PR empilhada sobre
QA163 #409, sujeita ao gate de quality e seis shards Playwright.
Não fazer merge/deploy sem aprovação, manter #338 aberta.
