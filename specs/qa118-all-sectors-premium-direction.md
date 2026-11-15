# QA118 | Padrão premium transversal às dez fases

## Direção aprovada

Usar a Fase 1 premium como referência de composição, mas cada planeta/fase precisa de materiais, estrutura, iluminação, tráfego ambiental e cores próprios. Evitar objetos flutuantes sem sustentação, cenários genéricos, neon rosa/ciano dominante, atravessamento de objetos e perda de performance em celulares. Os modelos devem ser WebGL reais, não uma imagem conceitual estática.

## Primeira implementação transversal

1. **Fase 1, cidade:** preservar QA116/QA117: ruas, ônibus, fachadas, anúncios, pontes sustentadas, caças. Consolidar módulos de janelas PBR com menos triângulos sem mudar o limite QA114 (menos de 3% de geometria incremental).
2. **Fase 2, Marte:** veículos de exploração com sensores, outriggers e carenagem, paleta de argila, luz ambar e visibilidade na poeira. Preservar Fobos/Deimos, Curiosity, Olympus e tempestade.
3. **Fase 3, asteroides:** rocha fraturada com veio metálico esculpido e ambiente de mineração distante, sem impactar curso de obstáculos, subchefe ou transição do túnel.
4. **Fase 4, nave-mãe:** shuttles de manutenção com asas, cockpit e propulsores; luz industrial neutra e de manutenção. Não recolocar anéis genéricos nos corredores.
5. **Fase 5, Vênus:** objetos térmicos com núcleo e velas laterais, cores solar/cerâmica e luz atmosférica; manter os ataques de plasma.
6. **Fase 6, Europa:** fragmentos facetados de gelo, céu frio, luz de superfície e neblina específica, sem falsificar colisores do gelo/túnel.
7. **Fase 7, Netuno:** organismos tridimensionais com esporos, antenas e contrastes orgânicos; preservar pontos fracos e ataques reais.
8. **Fase 8, Saturno:** escoltas detalhadas com asas/motores e iluminação gelo/dourado; anéis, Divisão de Cassini e meteoros intactos.
9. **Fase 9, Órion:** estruturas de lentes gravitacionais com núcleo e anéis decompostos, luz fria e névoa controlada; preservar roteiro e combate.
10. **Fase 10, Marvin/Titã:** interceptores imperiais negros com detalhes vermelhos e motores, iluminação de fortaleza; preservar perseguição e chefe final.

## Engenharia e performance

- As dez silhuetas ambientais são compostas por peças coloridas em geometria mesclada, com **um material PBR e dois lotes instanciados por fase**. Zero materiais, draw calls ou colisores extras por peça.
- Os campos de detritos rochosos, gelo, matéria orgânica e plasma, antes com 60 objetos individuais cada, passam a usar **um InstancedMesh por ambiente**: aproximadamente 59 chamadas de renderização a menos em cada uma das fases 3, 5, 6 e 7 quando visíveis.
- Ambientação de fundo sempre fora do corredor central de voo, sem hitbox falsa, com desenho determinístico durante Pause.
- Perfis Médio/Alto continuam com o mesmo limite de objetos ambientais: [10,14] e [18,28] nas duas camadas existentes.
- Luz, fill, rim e névoa em nove fases não urbanas têm parâmetros PBR coerentes, sem full-screen filter ou novos passes.

## Critérios de aceite

- Verificar no **SHA final**: lint, build, Node, Playwright FULL (quatro shards), navegação das 10 fases, modo Médio/Alto e pausa.
- Não afrouxar o teste de custo da cidade QA114 nem outras asserções.
- Renderizar screenshots comparáveis na mesma rota/câmera para desktop e mobile. Medir FPS p95, draw calls e triângulos reais. Contagens de entidades isoladas não comprovam a fluidez.
- Homologar visualmente separadamente cada uma das dez fases; **o primeiro lote transversal não equivale à homologação artística completa**, nem modifica os ataques e chefes.
- Não realizar merge ou deploy de produção sem autorização.

## Próximo lote planejado

Refinar por fase geometria de primeiro plano, texturas procedurais, animações, materiais, superfícies/impactos e chefes. Ordem de risco: Marte e asteroides (transições/colisão), Europa (túnel/garra), nave-mãe (salões/reator), Saturno (anéis/gelo), Vênus/Netuno/Órion/Titã. Nunca substituir estruturas necessárias por decoração ou refazer mecânicas aprovadas sem QA.
