# Graphics 3.4 — NOVA-7 Clean Futurista + Mecha (QA)

## Objetivo
Reverter o excesso de carenagens e pods introduzidos na Graphics 3.3, preservando exatamente a silhueta da nave aprovada na Cidade 2.7. Acrescentar acabamento discreto, uma pequena ampliação visual e turbinas com mecânica visível. Robô segue a mesma direção.

## Alterações
- `addFighterDetail` mantém o corpo e asas do modelo anterior e abandona os grandes `airframe-swept-fairing`, `airframe-hull-armor` e `airframe-weapon-pod` da Graphics 3.3.
- NOVA-7: dois frisos discretos por lateral, seis entradas de ar compactas, quatro anéis de turbinas, 12 aletas internas nos dois motores, dois núcleos luminosos e um contorno dorsal fino. Componentes limitados aos extremos da silhueta anterior.
- Ampliação de 5% **apenas nos componentes visuais** do `fighter()` do piloto, pela função idempotente `scaleFighterVisual`. Nó raiz do player mantém a escala base e os volumes de colisão, tiro e movimento não mudam. Módulos trocados no hangar adotam a mesma escala visual.
- Mecha: escala local vertical/de profundidade passa de 0,94 para 0,99 e largura acompanha as variações existentes do modelo de nave (~5% a mais). Não se alteram as juntas ou os sistemas de mira, boost e armas; são retiradas as placas salientes do peito para manter a armadura original com vincos, aletas, anéis e seis estatores mecânicos no conjunto principal de turbina.
- Inimigos, chefes, lojas e veículos da PR Graphics 3.3 permanecem inalterados.

## Critérios de aceite
1. Visão traseira e lateral da nave reconhecível como a NOVA-7 original, sem pods anexados nem carenagem grosseira.
2. Motores evidentes em visão traseira, durante BOOST e na troca nave/robô.
3. O robô mantém dois canhões independentes, asa de mesma identidade da nave, turbinas em movimento.
4. Testes unitários e 4/4 Playwright, screenshot comparativo em PC e celular, FPS em modo Médio/Alto.
5. Testar as trocas de modelo/skin no hangar e a evolução RPG para verificar se a ampliação permanece proporcional.
6. Sem promoção a produção até a aprovação humana.

> Os detalhes ainda são procedurais; o pacote profissional GLB da PR #187 permanece para integração e QA posteriores.
