# Nova Wing v1.27.94 — integração única de QA

## Objetivo

O próximo preview precisa apresentar uma **única versão integrada** com todas as melhorias verificadas das linhas QA v1.27.63–69 (Marte, robô Premium V4, cidade concept, colisão física localizada e exploração livre) e QA encadeada até v1.27.93 (10 setores, chefes e ataques diferenciados, Europa, Saturno, fase 4, HUD, mobile, áudio, trem/destruição e progressão orbital).

## Fontes e política de resolução

- Fonte de campanha completa: `fix/stage1-orbital-pacing-train-clean-route-20261106` (v1.27.93), que herda melhorias desde fase 4, Saturno, Europa, chefes, UI/HUD e eventos urbanos.
- Fonte de atualizações recentes: `feat/mars-storm-moons-warp-exit` (v1.27.69, PR #287). Mantém cidade inspirada no concept, braços/mira/turbinas Mecha Premium V4.1, limpeza de Marte, warp universal, colisão individual e fachadas reativas aos tiros.
- Integração somente em `qa/integrated-premium-v12794-20261107`, PR #288 em rascunho. Não alterar `main`, `dev`, produção ou PR originais.
- Arquivos com conflito de três vias são resolvidos pelo contrato do jogador, **não** escolhendo arbitrariamente um arquivo inteiro. Recursos que representam o mesmo evento (trem suspenso, dash, colisão) não podem ser simulados duas vezes.

## Contratos que precisam permanecer válidos

1. **Fase 1 livre:** nave pode usar a faixa lateral completa originalmente implementada (x±72); só colide com geometria física realmente visível, permitindo sobrevoar corrimãos baixos e evitar trens/pilares. Eventos de destruição têm contato físico correto e são tangíveis.
2. **Fase 1 cinematográfica:** skyline e ruas premium do concept (prédios com volume, neon ciano/âmbar, painéis, trilhos), carro/placa/fachadas destruídos, trem pendurado com rota de fuga, alerta sem poluição visual, Super Boost obrigatório e entradas de inimigos apenas depois da órbita.
3. **Modo robô:** ação de giro vira esquiva lateral real dirigida pelo jogador, nunca barrel roll; o giro 360° permanece exclusivo da nave, inclusive para limpar areia de Marte. Transformação, mira esquerda, recoil independente, animações de torso/joelho/asas e turbinas legíveis. Não duplicar dois integradores de dash e não permitir invulnerabilidade infinita.
4. **Fase 2:** aproximação com duas luas, touchdown, Olympus/Curiosity, tempestade com turbulência, areia limpa somente pelos giros da nave e boss ocre mantidos.
5. **Fase 3:** asteroide e multi-lock, navegação sem atravessar paredes.
6. **Fase 4:** nave orbita núcleo/chefe fixos em área ampla, boss vira para acompanhar o jogador, sem cenário girar no lugar da nave.
7. **Fase 5+ / Marvin:** papel do rival preservado, origem dos ataques identificável.
8. **Fase 6 Europa:** alerta de túnel/rachaduras, destroços com chão e paredes sólidos, saída da superfície legível, chefe colosso com garras fisicamente visíveis, sem penetrar no chão e arena livre.
9. **Fase 8 Saturno:** tom/anéis fiéis à referência, travessia de anéis/gelo, chefe reage à retaguarda/laterais, mordida/garras/tentáculos.
10. **UX:** menus/hangar sem rolagem excessiva, botões mobile acessíveis de tiro/BOOST/ORBITAR/RPG/DASH, textos PT/EN/ES consistentes, HUD com mensagens curtas priorizadas, pausa/reset e saves preservados.
11. **Qualidade:** render PBR/LOD quando possível, sem geometria/material por frame; modos Alto/Médio, 30/60 FPS, orçamento e bundle reprodutível; nenhum teste omitido para declarar sucesso.

## Gates de aceite

- `npm ci`, `npm run release:prepare -- 1.27.94`, `npm run format`, `npm run build`, `npm run validate`, `npm run build:check` na mesma árvore SHA.
- Browser real desktop e mobile via 4 shards Playwright, com screenshots comparáveis à imagem aprovada, fluxos das fases e controles, sem falhas.
- Inspeção visual e FPS no dispositivo real; se não houver hardware/evidência não alegar aprovação final.
- PR em draft até homologação; o usuário decide quando levar a produção.

## Estado de integração

Históricos unidos no PR #288 (merge local): reparos de compatibilidade e gates em andamento. Não confundir histórico de branch integrado com funcionalidade pronta/homologada sem testes.
