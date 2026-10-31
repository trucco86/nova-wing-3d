# Nova Wing — City 2.9: orçamento mobile de GPU e microdetalhes urbanos

## Motivação
O Galaxy S21 apresentou lentidão em Alto. A Cidade 2.8 incluiu adaptação de resolução, mas o pós-processador ainda renderizava a cena e executava três passes adicionais de tela inteira, inclusive no celular e em Médio. Drones aéreos eram essencialmente elipsoides luminosos, reduzindo a percepção de realismo.

## Implementação
- `src/visuals.js` agora seleciona **renderização direta** em dispositivos de ponteiro touch e em todos os dispositivos configurados em **Médio**, mantendo luzes, materiais, geometria, transparência e modelos 3D. Só o desktop em Alto mantém o bloom cinematográfico com três passes e alvos off-screen. A filtragem não modifica a física nem a geometria e ocorre na própria renderização.
- Alvos de pós-processamento no modo direto não são redimensionados nem usados, reduzindo alocação de buffers, render passes e sobrecarga de GPU em smartphones com tela de alta densidade.
- O renderizador registra chamadas de desenho e triângulos referentes ao **render da cena antes do bloom**, separando de passes de pós-processamento. `Pause > FPS` mostra os dados do frame atual quando a interface de renderizador os fornece; as métricas são indicadores de cena, não tempo GPU.
- `src/city-urban-drones.js`: drones ganharam silhueta de veículo aéreo com fuselagem facetada, asas, vãos mecânicos, rotores, patins, compartimento inferior e linhas luminosas. A geometria foi fundida com **cores por vértice** em **uma malha por modelo**, sem novo material pass por peça ou nova draw call. Beacons pulsam a partir do progresso de jogo e congelam em Pause.
- Preservados o trânsito detalhado da Cidade 2.8, os gráficos adaptativos, a NOVA-7 limpa da Graphics 3.4 e a separação QA/prod.

## Critérios de QA
1. `tests/graphics-3-5-mobile-budget.test.mjs`: smartphone Alto e desktop Médio usam uma única renderização da cena, desktop Alto preserva quatro renders (cena + três passes), draw calls capturados da cena correta.
2. Geometria composta dos drones possui normais, índices e cores válidas; duas draw calls instanciadas por trecho, seis drones em Médio e 12 em Alto, animação determinística, sem colisão.
3. Regressão das 392+ suites existentes, lint, build sincronizado, validação e Playwright (desktop, mobile, boss, pausa, menus).
4. Comparação FPS p95 e FPS médio no Galaxy S21 por 60 segundos na mesma parte da primeira fase: Médio, Automático e Alto. Registrar resolução interna, quantidade de draw calls e triângulos.
5. Verificar sombras, bloom, transparências e leitura dos LEDs em Alto touch sem o filtro cinematográfico; não afirmar fidelidade AAA nem ganho percentual de FPS sem teste físico.

## Gate
A candidata não está homologada por pessoa e não deve ser mesclada/promovida para DEV, HML ou produção até o aceite visual, FPS real e regressão.
