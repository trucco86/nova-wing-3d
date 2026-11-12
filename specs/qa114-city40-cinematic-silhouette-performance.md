# QA114 | Graphics 4.0: silhueta cinematográfica com custo controlado

## Diagnóstico
A QA113 foi homologada tecnicamente com 775 testes Node e 4/4 shards do Playwright, mas o ganho visual era localizado: 0,316% dos pixels no desktop e 1,258% no mobile, em enquadramento A/B idêntico. Não havia evidência de desempenho em telefone real.

## Objetivo
Melhorar a identidade visual DURANTE o voo sem adicionar draw calls de materiais, novas luzes, postprocesses ou colisões invisíveis.

## Implementação
- Fase 1 mantém os 285 metros de edifícios reais modelados, nos distritos civic/industrial.
- Duas nervuras arquitetônicas por prédio nas faces voltadas para a rota, com vidro em alturas completas, cornijas físicas, diversidade industrial/cívica e âncoras nos footprints conhecidos.
- Um anel de 12 facetas tridimensionais integrado ao landmark distante e suportado pela passarela existente. É parte do skyline não jogável e respeita o corredor da nave.
- Todos os detalhes entram nos mesmos quatro buffers de material por tile, mais os mesmos três buffers do monumento, sem um draw call por peça.
- Preservam-se geometria física QA109, ads QA110, áudio QA111 e parâmetros de qualidade Alto/Médio.

## Limites mensuráveis
- 4 meshes por tile de arquitetura e 3 meshes por monumento, iguais à QA113.
- Menos de 3 MiB por tile, 256 KiB no monumento e 45 mil triângulos por tile.
- Comparativo da MESMA câmera e quadro: <=8 draw calls extras em relação ao mundo sem Graphics4.0; <21 mil triângulos extras.
- Delta de pixels RGB >=10 sobre cenário: desktop >0,2%, mobile >1,0%, como piso de visibilidade e não como medida de qualidade estética.
- QA browser verifica shaders, perfis Medium/High, ausência de novos colliders e captura A/B.
- A aprovação de qualidade ainda exige inspeção humana no celular real e FPS observável. O gate de screenshots não mede FPS.

## Liberação
PR Draft baseada em QA113/#324. CI FULL no HEAD final, Cloudflare Preview, testes Node e browser, sem merge na main ou publicação de produção sem autorização do usuário. Não declarar todos os backlogs concluídos.
