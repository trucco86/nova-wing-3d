# World 4.0 — Direção visual dos 10 setores (QA)

## Objetivo

Fim do cenário genérico: cada destino exige **planeta, clima, topografia, iluminação, objetos, meios de transporte, chefes, pontos fracos e ataques** coerentes. A qualidade de materiais, relevo, céu e microdetalhes precisa ser consistente com a cidade do setor 1, sem poluição do retículo/HUD e com limites para mobile.

## Implementação desta PR #217

- **Fase 1 · Terra / Cidade das Máquinas**: manter City 3.3, reduzir serrilhado aumentando o limite DPR móvel em Alto/Médio e os samples MSAA da trilha desktop. Medir FPS/frame-time p95 no iPhone e reduzir por adaptação se necessário.
- **Fase 2 · Marte / Deserto de Marte**: substitui integralmente porto/oceano; solo com relevo, dunas e rochas instanciadas, mesas sedimentares, céu vermelho-ocre com iluminação quente, Fobos e Deimos como satélites independentes, Curiosity estilizado com seis rodas, sensores, braço e mastcam. Boss: COLOSSO DAS DUNAS com patas escavadoras. Cenário não reutiliza cidade, Lua rachada ou o oceano.
- **Fase 3 · Cinturão de Asteroides**: preserva jornada com entrada e combate dentro do asteroide; interior agora usa rochas mais refinadas, inclusões minerais e travessas de mineração instanciadas. Boss PERfurador com silhueta de broca e dentes metálicos.
- **Dez chefes**: todos com silhuetas próprias definidas em `boss-visual-identity.js`; as armas e os pontos destruíveis seguem a PR #216, sem mudar os volumes de dano.
- **Novos testes**: isolamento por setor, simulação/pause do campo de Marte, duas luas, Curiosity, 10 chefes, AA e captura real de WebGL em desktop/mobile.

## Mapa criativo para as próximas ondas de acabamento

| Setor                  | Bioma e identidade                                 | Chefe/elementos                        |
| ---------------------- | -------------------------------------------------- | -------------------------------------- |
| 1 Terra                | Megacidade corporativa, metal e neon               | Interceptador ROK, asas rápidas        |
| 2 Marte                | Deserto, Fobos, Deimos, rover                      | Colosso das Dunas, patas e escavadeira |
| 3 Cinturão             | Mineração de asteroides + caverna interna          | Perfurador, broca e minerais           |
| 4 Órbita-9             | Complexo industrial zero-g, plataformas e docas    | Fortaleza-research, escudos de reator  |
| 5 Tempestade de plasma | Proeminências solares e explosões eletromagnéticas | Fênix, penas incandescentes            |
| 6 Setor congelado      | Lua glacial, formações de gelo, ventos cortantes   | Colosso Glacial, armadura e punhos     |
| 7 Nebulosa             | Biocristais e crescimento orgânico espacial        | Colmeia Viva, sete cabeças             |
| 8 Frota                | Couraçados em batalha e destroços próprios         | Ômega, baterias de artilharia          |
| 9 Abismo de Órion      | Distorção, gravidade e lentes                      | Bastião, anéis gravitacionais          |
| 10 Trono de Marvin     | Fortaleza final e coroa imperial                   | Marvin, garras e eclipse               |

**Gates:** build reproduzível, testes Node, 4/4 shards Playwright (sem mascarar falhas legadas), fotos 16:9 e 390x844, benchmark físico iPhone/Android Alto/Médio, inspeção de FPS/serrilhado e aceite do jogador. Os temas 4–10 têm assets do projeto original; não declarar que foram recriados nesta PR. Preview QA isolado, sem merge em DEV/HML/PROD.
