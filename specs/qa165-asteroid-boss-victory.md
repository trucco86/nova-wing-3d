# QA165 | Fase 3 completa: subchefe, chefe, vitória e saída

## Objetivo e escopo

Amplia a [QA164](https://github.com/trucco86/nova-wing-3d/pull/410)
para testar uma campanha real iniciada por save do setor 3
(`start(true)` e `spawnEncounters: true`), sem atalho de DEV e
sem alteração da lógica de jogo.

## Gates do teste

1. Percorrer fenda, fragmentos e corredor com controles reais.
2. Derrotar o subchefe real usando bombas com o escudo de entrada respeitado;
   o HUD do subchefe deve fechar.
3. Verificar 7,5 segundos sem aviso/chefe e o aviso apenas após o mínimo de
   8 segundos desde a derrota do subchefe.
4. Aguardar a entrada do chefe, checar os dois geradores reais e o escudo de chegada.
5. Orbitar os dois flancos com `game.orbit()` e usar `game.damageBoss()`
   (API real de budget de dano) para validar vulnerabilidade e destruição.
   Este teste **não** equivale a acertar tiros manualmente com o retículo.
6. Destruir o núcleo aberto, entrar em `collapsing`, iniciar o salto
   automático após 5,8 segundos e chegar à loja da missão concluída.

## Segurança e limites

- Nenhum estado interno, vida do inimigo, relógio ou checkpoint é
  adulterado; usam-se APIs existentes de controles, bombas e dano.
- `collect('shield')` periódico mantém o personagem vivo durante
  os longos testes do ciclo sem desabilitar IA e físicas.
- O percurso da QA164 continua preservado na PR base.
- Performance em dispositivo real, capturas visuais, precisão do retículo
  e testes mobile seguem pendentes. Não concluir a issue P0 por CI verde.
- PR Draft, empilhada sobre QA164, **sem merge nem deploy de produção**.

## Evidência automatizada no SHA de sincronização

- [Sync da QA165, run 44661397782](https://github.com/trucco86/nova-wing-3d/actions/runs/44661397782): sucesso.
- Antes da validação geral, o novo gate focalizado
  `node --test tests/qa164-asteroid-real-subboss-progression.test.mjs`
  concluiu com sucesso.
- `npm run format`, `npm run build` e `npm run validate`:
  concluídos com sucesso. O arquivo `index.html` permanece
  equivalente ao runtime original, sem lógica de gameplay alterada.
- A CI FULL com os seis shards Playwright, Source Repair e preview
  no SHA humano final devem ser conferidos separadamente.
- O teste não prova pontaria física dos tiros, FPS do iPhone nem
  inspeção visual humana da cena do chefe.
