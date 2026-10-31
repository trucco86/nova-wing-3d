# HOTFIX P0 — Mobile BOOST oculta no arco de ações (Graphics 3.7 / City 3.0)

## Causa identificada (cascata CSS)

A versão em meia-lua mudou o grupo `.actions` de grid para `display:block` e esperava `position:absolute` em cada botão. Entretanto, uma regra herdada `#touch #boostTouch, #touch #fireTouch { position: relative; }` tem **dois seletores de ID** e prevalecia sobre a regra geral nova `body.in-mission #touch .actions button { position: absolute; }`. BOOST e TIRO acabavam participando do fluxo normal do bloco; os offsets top/left só os deslocavam, deixando o BOOST abaixo/fora da viewport. Dar `z-index` e `opacity` não corrige esse problema.

## Correção

- Regra definitiva de maior especificidade força `position:absolute !important` em **BOOST e TIRO**, preservando a distribuição meia-lua, hitbox, textos, Reflex Boost e handlers existentes.
- BOOST permanece com prioridade visual sobre o TIRO e opacidade mínima de 78%, respeitando o controle de transparência do Options.
- Não interfere no layout desktop/teclado, nem em bônus Arcade onde BOOST pode ser propositalmente desabilitado por regras de gameplay.

## Gates de aceite

- Validar em Playwright a **posição computada** `absolute` de ambos botões, ausência de sobreposição, limites de viewport e `elementFromPoint` no centro de BOOST, com LOCK visível nos breakpoints 320×568, 390×844 e 844×390.
- Validar que segurar o BOOST realmente muda o estado do jogo (não apenas aparência), inclusive após alternar robô/nave, pause e chefe.
- Testar no **Samsung Galaxy S21 físico** em paisagem. Medir FPS antes de promover DEV/HML/produção.
- PR isolada sem merge. Não declarar aprovação humana.
