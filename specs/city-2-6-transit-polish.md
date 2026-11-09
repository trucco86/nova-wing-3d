# Cidade das Máquinas 2.6 — monotrilho esculpido e publicidade dinâmica

## Diagnóstico

A Cidade 2.5 já acrescentou trilhos robustos, trem de três vagões, três distritos, piso 3D e seis outdoors, mas a composição ainda é procedural e precisa superar a leitura de blocos uniformes. Esta entrega é um refinamento isolado sobre a branch de QA City 2.5; não é uma promoção de ambiente nem prova de fidelidade AAA.

## Mudanças de implementação

- **Silhueta do monotrilho:** duas pontas aerodinâmicas facetadas com geometria real de 12 vértices e índices triangulados, frontais luminosos, chassis de levitação por vagão e saias/linhas laterais. Preserva os três vagões, os nomes para telemetria, o itinerário e a infraestrutura de trilhos de City 2.5.
- **Outdoors vivos:** cada painel possui um beacon luminoso exclusivo, com modulação determinística por distância percorrida. O brilho congela durante Pause, sem recriação de CanvasTexture a cada frame. Mantém seis marcas fictícias.
- **Performance:** sem novos objetos de colisão, sons ou serviços externos. O modelo geométrico do nariz é compartilhável pelo sistema do Three.js; os detalhes adicionais elevam draw calls por trem e deverão ser medidos em preview, principalmente no celular.
- **Compatibilidade:** Médio preserva o trem à direita, Alto habilita o segundo; nenhum novo recurso é carregado de rede. Suporta a cidade duplicada e a transição para órbita.

## Testes automatizados incluídos

- Verifica nariz 3D em ambas as pontas, geometria finita, chassis em três vagões e ausência de hitboxes.
- Verifica seis anúncios, animação determinística, textura reutilizada e proteção contra NaN.
- Verifica que Pause congela a iluminação e que a cidade sai da visão durante a ascensão orbital.

## Homologação pendente — obrigatória antes de merge

1. Captura real do trem no primeiro trecho (Médio e Alto), incluindo frente, lateral e material refletivo.
2. Comparação High/Medium da Cidade 2.5 x 2.6 nos mesmos pontos de gameplay.
3. Quality, build/HTML determinístico, todos os shards Playwright em SHA final.
4. Medição de frame-time p95 e FPS de 30 s em desktop e celular reais; revisar custo extra de meshes.
5. Revisar legibilidade do HUD, mira, controle, áudio, passagem para órbita e ausência de interferência no cenário.

**Critério de liberação:** CI completo e aprovação humana visual. Até lá, somente PR draft, base City 2.5; DEV/HML/produção intactos.
