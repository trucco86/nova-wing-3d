# QA173 | Integração segura do acesso ao reator na fase 4

## Situação e limites da entrega

- Base: `main` v1.27.157, commit `40af775587a38c09c376a607691c857d650adfa3`.
- A PR #422 removeu a coluna fantasma no salão do reator; essa remoção **não pode regredir**.
- A PR #418 traz a experiência completa, mas tem histórico empilhado de #415, #416, #417 e #406. Comparação em 21/11/2026: 360 commits à frente, 2 atrás de `main`. Não fazer merge direto da cadeia.
- **Este recorte QA173 ainda NÃO altera a gameplay**. Porta só o contrato puro de acesso e seus testes da PR #418 para permitir integração gradual, auditável e reproduzível.

## Contrato importado da PR #418

- Apenas setor de campanha com índice `3` (fase 4).
- Gatilho em `elapsed >= duration * 0.62`, com voo 3D ativo, encontro de fase e nenhum boss/subboss em curso.
- Três IDs únicos: `transmission-a` (CIRCUITOS), `reactor-map` (REFRIGERAÇÃO), `broken-beacon` (MOTORES).
- O chefe é inacessível com zero, um ou dois módulos ou com IDs duplicados/desconhecidos.
- QA de outros setores, encontro direto de chefe e modo 2D não devem acionar o desembarque.

## Etapas de integração restantes

1. **Engine/campanha**: adaptar apenas as seções pertinentes da PR #418 em `src/game.js`. Criar estado transitório `reactorAccessActive`/`reactorAccessComplete`, congelar relógio/tiros na entrada, sinalizar callback e retornar ao mesmo setor, preservando piloto, nave, armas, pontuação e saves. Não copiar `src/game.js` inteiro, nem a nova artilharia das sentinelas.
2. **Exploração e controles**: reconciliar `src/exploration-preview.js` existente em `main` com `src/orbit9-free-roam.js`, `src/orbit9-locomotion.js`, `src/orbit9-stage-art.js` e modelos/controles das PRs #415 a #417. A caminhada e o joystick devem obedecer à orientação real do personagem em mobile. Sem rota independente Órbita-9 no menu.
3. **Shell/UI**: conectar `src/main.js` e apenas os elementos necessários de `src/shell.html`/`src/styles.css`, mantendo a nave invisível e controles de voo suspensos enquanto o piloto explora. Ativar os três módulos, com HUD/minimapa claro e sem sobreposição.
4. **Transição e combate**: voltar ao chefe original do reator na fase 4, mantendo o salão corrigido da v1.27.157 e a órbita 360°. Não incluir no mesmo lote novos ataques, sentinelas ou alterações gerais de áudio da PR #418, que precisam de homologação própria.
5. **Release/gates**: incluir Playwright ponta a ponta nas visões 390×844, 844×390 e desktop; passar nas seis divisões da CI com versão e arquivos gerados sincronizados; comparar objetos no centro da arena e confirmar ausência de coluna. Publicar somente com CI pós-merge e rollback confirmados.

## Cenários obrigatórios

- Uma ou duas ativações não liberam o reator. Três IDs válidos e únicos liberam.
- Repetir um módulo, ID desconhecido, atravessar cenário ou pular o menu não libera o chefe.
- Sem duelo ativo durante exploração e sem avanço do tempo da fase; pausa e retomada consistentes.
- Checkpoint, save, créditos, armamento, personagem, ranking e demais setores intactos.
- Retorno ao mesmo setor 4, com transição visual, chefe e pontos fracos visíveis, sem coluna atravessável e sem bloqueio invisível.
- Sem FPS alegado sem medição real em dispositivo físico.

## Evidências

- Origem do contrato: PR #418 `src/devastador-reactor-access.js` e `tests/devastador-reactor-access.test.mjs`.
- O teste de domínio deste recorte cobre IDs, unicidade, setor correto, limiar, modos excluídos e condições de boss/subboss.
- Aprovação neste recorte NÃO significa que a experiência completa já esteja integrada ou pronta para produção.
