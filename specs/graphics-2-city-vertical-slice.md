# Graphics 2.0 — Cidade das Máquinas (QA vertical slice)

## Objetivo
- Jogo web Three.js/WebGL, sem instalar aplicativo ou engine.
- Três seleções nas Opções: **Automático, Médio e Alto**, com traduções PT/EN/ES.
- Em Automático, iniciar em Médio nos dispositivos touch ou com memória de até 4 GB; iniciar em Alto nos demais. Heurística inicial, não promessa de FPS.
- Em Alto, acrescentar três camadas de instâncias (estrutura de fachadas, frisos luminosos e antenas) nos dois blocos da cidade.
- Em Médio, retirar as camadas extras, limitar a densidade de pixels e reduzir a resolução intermediária do bloom.
- Preservar física, colisões, chefes, tiro, movimento, ranking, autenticação, saves e controles.

## Escopo real da primeira entrega
É uma melhoria jogável nos modelos procedurais e no pipeline de renderização; **não** é um resultado idêntico à imagem de IA. Importação de modelos PBR, texturas comprimidas, iluminação volumétrica e reestruturação de outras fases são ondas posteriores.

## Gates de qualidade
1. `npm run release:prepare -- 1.27.26`, `npm run format`, `npm run build`, `npm run validate`.
2. Testes nativos de perfis, cenas em dois blocos e armazenamento.
3. Quatro grupos Playwright: opções e persistência, menu, missão/controles e HUD em retrato/paisagem.
4. Antes de integrar, avaliação em 1366×768, 844×390 e 390×844; registrar FPS e frame-time em 30 segundos em cada modo, com modelo de GPU e resolução.
5. Isolar de DEV/HML/PROD até aprovação técnica e visual. O primeiro preview não implica homologação.

## Critério para evolução posterior
Adotar glTF/GLB + texturas KTX2 e LOD para assets da nave/cidade após observar frame-times e custo do carregamento. Evitar inflar o HTML único ou quebrar a entrega web.
