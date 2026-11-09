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

## Revisão 3.1 após CI completo

A primeira versão 1.27.44 passou no teste direcionado de BOOST, mas **falhou em três shards de navegador** por regressões adicionais:

- botões de ação com altura inferior ao mínimo de 60 px, apesar de TIRO e BOOST visíveis;
- tamanhos de analógico incompatíveis com 320/390/430 px e paisagem, afetando também espaço de órbita;
- BOOST do minigame Arcade 2D permaneceu visível (onde deve ser intencionalmente oculto);
- teste legado de canvas exigia backing buffer interno fixo mesmo com DPR adaptativo.

Na candidata **1.27.45** o mesmo hotfix evolui para o Mobile Controls 3.1: hit areas de no mínimo 60×60 CSS px para os seis botões comuns e LOCK, três colunas sem sobreposição em portrait, quatro em landscape, joystick 88/102/128/91 px por breakpoint e órbita reposicionada. O Arcade mantém BOOST desativado e a validação WebGL exige a imagem ocupar o viewport CSS inteiro, respeitando escalonamento de resolução interno por FPS. Não alterar física nem a nova Cidade 3.0.

**Gate prioritário:** Playwright móvel de `mobile-hud-audit`, `mobile-stick-hitbox`, `mobile-thumb-arcs`, `city-30-boost-options`, `dynamic` (Arcade/estratégia) e `game` (WebGL, segurar BOOST), além de suíte desktop de thumbs e CI global. Nenhuma homologação humana até teste no Galaxy S21.
