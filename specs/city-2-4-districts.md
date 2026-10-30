# Cidade das Máquinas 2.4 — distritos urbanos e infraestrutura monumental

## Motivação e composição

O cenário anterior ganhou um horizonte e veículos, mas edifícios repetitivos ainda podem transmitir a sensação de pista infinita. Esta etapa adiciona identidade a três zonas percorridas em sequência, com arquitetura assimétrica, pontos de referência e estação de monotrilho. Preserva a imagem de referência como direção criativa, sem alegar equivalência gráfica.

## Implementação

- **Distrito comercial** (~z -300): torres altas, coroas estreitas, iluminação vertical e detalhe âmbar no topo.
- **Distrito industrial** (~z -885): megablocos largos, chaminés/gantries e painéis contrastantes.
- **Distrito espacial** (~z -1490): plataformas amplas, estruturas elevadas e marcação de hubs de lançamento.
- **Estações de monotrilho** oeste (~x -80, z -585) e leste (~x 80, z -1315): piso de embarque, canópias, colunas, iluminação direcional e advertência lateral. Os trens existentes percorrem o trilho em movimento, sem alteração da física.
- **Médio:** núcleos dos três distritos, estações e iluminação básica. **Alto:** faixas adicionais de janelas e luzes de destaque.
- **Controle GPU:** cinco novas malhas InstancedMesh por bloco urbano (total dez nas duas cópias), compartilhando geometria e material; elementos de estação com geometria unitária compartilhada.
- **Limite de jogabilidade:** construções em x mínimo ~108, estações em x ±80, fora do corredor central. Não há hitbox, dano nem alterações de tiro, IA ou colisão.
- **Transições:** estruturas no próprio bloco da cidade, acompanhando loop e desaparecendo na saída da cidade e no setor oceânico; reset reutiliza o cenário sem adicionar novos objetos.

## Critérios para aceitar

1. Três zonas identificáveis no gameplay, sem parecer a mesma torre copiada infinitamente.
2. Estação próxima da linha suspensa, com trem visível passando e altura de plataforma legível.
3. Em Médio, cidade e estações permanecem presentes, sem remoção dos corrimãos anteriores.
4. Em Alto, mais janelas e assinaturas de iluminação, com custo adicional limitado.
5. Renderização sem erros WebGL em desktop e mobile; capturas comparativas 1366×768 e 844×390.
6. Medir FPS, p95 de frame-time e memória por aparelho; metas 60 FPS desktop e 30 FPS mobile sujeitas a homologação real.
7. Não homologar nem integrar DEV/HML/produção com testes Playwright falhando. O último CI da Cidade 2.3 teve a etapa quality aprovada mas dois shards browser com falhas; regressões precisam ser discriminadas.

## Próximas ondas

- Vagões e estação com sinalização e anúncio visual de chegada.
- Variação de zonas durante a missão, incluindo parallax e skyline menos repetitivo.
- Materiais PBR/glTF de qualidade, texturas comprimidas, reflexão localizada e LOD para monumentos e naves.
