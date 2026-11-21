# QA173: acesso seguro ao reator da fase 4

## Estado

- Base: `main` v1.27.157, commit `40af775`.
- A PR #422 removeu a coluna fantasma. Essa correção não pode regredir.
- A PR #418 acumula 360 commits à frente e dois atrás da `main`.
- Esta PR QA173 **não altera a gameplay**. Integra apenas o contrato e os testes.

## Contrato dos três módulos

- Setor 4 da campanha, índice 3.
- Gatilho em 62% do tempo da missão, sem chefe ou subchefe ativos.
- CIRCUITOS: `transmission-a`.
- REFRIGERAÇÃO: `reactor-map`.
- MOTORES: `broken-beacon`.
- O reator só libera após exatamente três IDs distintos e válidos.
- QA do chefe, outros setores e modo 2D não acionam o desembarque.

## Etapas seguintes

1. Conectar o motor da campanha e suspender voo, combate e relógio.
2. Integrar a caminhada e o direcional com os modelos Five Cats.
3. Conectar a cena 3D ao HUD e ao fluxo de retorno ao reator.
4. Preservar a arena sem coluna, o chefe e a órbita 360 graus.
5. Validar a experiência em desktop e mobile antes de publicar.

## Gates obrigatórios

- Um ou dois módulos não podem liberar o núcleo.
- IDs repetidos ou inválidos não podem abrir o chefe.
- A exploração não deve alterar saves, ranking, créditos ou equipamento.
- A fase continua sendo o setor 4, sem uma missão separada.
- Testar entrada, três ativações, retorno e combate ponta a ponta.
- Conferir 390×844, 844×390 e desktop com Playwright.
- Passar Quality, Source Repair e seis shards de browser.
- Não declarar melhoria de FPS sem medição em aparelho físico.

## Fora do escopo

- Sem novos inimigos, sentinelas, golpes ou áudio da PR #418.
- Sem merge direto da cadeia antiga de PRs.
- Sem publicação ou homologação da exploração nesta etapa.
