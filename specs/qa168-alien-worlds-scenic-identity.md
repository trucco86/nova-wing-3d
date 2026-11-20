# QA168 · Identidade visual dos mundos alienígenas

## Evidência visual de entrada

Cinco capturas de gameplay recebidas em 20/11/2026 mostram problema recorrente de cenografia: esfera/planeta monumental ocupando o centro, anéis concêntricos luminosos sem função, torres e triângulos flutuantes, campo glacial de blocos brancos sem pontos de interesse e variação insuficiente de materiais. Preservar os cenários, árvores e paisagens já aprovados nas outras fases.

## Contrato de direção artística

1. **Vênus, setor 5:** templo de pirâmides sulfúricas sobre plataformas de rocha e nuvens densas, relâmpagos nos horizontes laterais. Não reintroduzir sol central nem corredores de anéis de neon.
2. **Europa, setor 6:** ruínas de cofres glaciais de tecnologia antiga parcialmente enterrados, gelo, penhascos e fissuras. Reduzir a sensação de geometria branca de protótipo, preservando a área legível do chefe.
3. **Netuno, setor 7:** arquitetura biomecânica de colmeia e esporos, silhuetas orgânicas estruturadas e camadas atmosféricas azuis. Não repetir as pirâmides de Vênus.
4. **Órion, setor 9:** anomalia gravitacional e monólitos colossais, sem segundo planeta artificial ou torus concêntrico central.
5. **Titã, setor 10:** cidadela final de Marvin com pirâmides de obsidiana e instalações conectadas ao terreno de metano, não uma cópia da batalha de Vênus.

## Regras de câmera, missão e astronomia

- Nenhuma esfera planetária persiste no horizonte das arenas terrestres/atmosféricas: aproximar lateralmente no início e ocultar até 12 s.
- Saturno é a única exceção dos anéis: seus anéis astronômicos permanecem vinculados ao planeta e aos encontros da fase 8.
- Manter setor 3 e seu gateway funcional, fase 4 dentro da Devastador, câmera de perseguição, boss logic, cenário congelado/órbita, fases 1 e 2 aprovadas.
- Não colocar torres, colunas, pirâmides ou efeitos sobre o retículo ou corredor x ±72, nem adicionar colisões invisíveis.
- Objetos devem pertencer a conjuntos arquitetônicos identificáveis, com base/terraço, estrutura e marcação luminosa; evitar assets desconexos.

## Escopo técnico deste PR

A primeira passada substitui o bloco universal esfera+quatro torus por cinco assinaturas arquitetônicas, seis batches instanciados por mundo e chegada orbital fora do eixo. Materiais e proporções são protótipos de arte editáveis, não acabamento premium final. HUD, IA, bosses, controles, save e pontuação não são alterados.

## Gates de homologação

- [ ] Prettier, bundle `index.html`, `npm run validate`, qualidade e testes de navegador no SHA final
- [ ] Capturas de início, meio e chefe para os cinco mundos nos perfis Alto/Médio
- [ ] Visual QA de profundidade, arquitetura com base, iluminação, borda do corredor, repetição de props e entrada/saída em warp
- [ ] Bench no iPhone real com 430 × 711 @ DPR 3: FPS médio, p95/p99, calls, triangles, geometria e memória antes/depois
- [ ] Saturno, subchefe/caverna do asteroide, Devastador, Europa e HUD sem regressão
- [ ] Aprovação visual humana e integração da pilha de PRs pendentes antes de merge ou deploy

A situação de CI e render do preview é evidência independente. Não declarar entregue em produção sem ela.
