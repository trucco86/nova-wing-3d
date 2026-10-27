# P0 — Comandos de RPG na faixa superior do HUD

**Candidata:** PR #92, baseada na PR #82 (mobile unificada). **Sem homologação em aparelho físico.**

## Premissa de UX

Durante a partida, o centro do campo de visão é exclusivo do gameplay: nave/robô, inimigos, projéteis, anéis e retículo. Comandos persistentes devem usar a faixa superior ou inferior, sem bloquear a mira.

## Layout

- **Topo esquerdo:** seletor de RPG e três comandos rápidos (trocar arma, escolher especial, ativar especial), em uma única linha touch compacta.
- **Topo — faixa separada:** avisos de risco, escudo e comunicações. Não devem interceptar os botões de RPG.
- **Topo direito:** radar, informação do chefe, pausa e câmera, conforme a geometria de cada viewport.
- **Parte inferior:** analógico, disparo, boost, bomba, esquiva e órbita, sem regressões.
- **Ao expandir RPG:** painel rolável apenas sob ação intencional do jogador; os atalhos persistentes deixam de interceptar o painel.
- **Desktop/teclado:** comandos originais preservados.

## Gates

1. Viewports touch de 320×568, 390×844 e 844×390.
2. Três botões no mesmo eixo Y, cada um com altura mínima de 44 px e alvo real em `elementFromPoint`.
3. Nenhuma sobreposição do conjunto de RPG com avisos ou radar; sem elementos permanentes na faixa central.
4. Painel expandido utilizável e rolável, com altura limitada.
5. Quality, browser 4/4, screenshots dos três formatos, inspeção visual e aceite em celular físico antes de HML/produção.

**Estado:** mudanças no código não equivalem à aprovação funcional ou visual.
