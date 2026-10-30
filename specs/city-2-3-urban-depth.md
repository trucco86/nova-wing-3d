# Cidade das Máquinas 2.3 — horizonte e cidade viva (QA)

## Problema visual observado
A rota central parecia infinita e os prédios laterais pareciam uma pista de jogo antigo, sem profundidade, tráfego ou um destino arquitetônico frontal. A referência visual pede metrópole densa, estruturas elevadas, camadas urbanas, iluminação e vida em movimento.

## Escopo implementado

- **Frente da cidade:** `city-distant-horizon`, independente dos dois tiles de 1900 unidades. Três camadas escalonadas (quase, média e distante) com prédios e coroas em InstancedMesh, mais megahub suspenso ao fundo.
- **Paralaxe:** skyline permanece longe do jogador, com deriva horizontal leve e sem atravessar o corredor de voo. Parte do horizonte é ocultada pela neblina urbana para evitar recortes bruscos.
- **Trem suspenso:** linhas de transporte a x = ±80, com dois trens em trajetórias opostas e velocidades relativas diferentes. O trem no corredor oeste permanece no Médio; o leste adiciona atividade no Alto.
- **Evacuação:** sete veículos civis pequenos, entre os edifícios, acelerando em direção à altitude orbital. Dois veículos aparecem no Médio; todos podem aparecer no Alto. Eles não são inimigos nem alvos, não disparam e não têm hitboxes.
- **Cenário anterior preservado:** janelas em fachadas e laterais, corrimãos em Médio/Alto, passarelas elevadas, placas e frisos do piso industrial.
- **Separação de setor:** skyline e trânsito urbano aparecem só quando o tema é cidade. Saem durante a subida para a órbita e não invadem a fase oceânica.
- **Pausa:** veículos só mudam de posição quando `world.update(..., playing=true)`; pausas não avançam a simulação de tráfego.
- **Controle de custo:** instâncias para fachadas/horizonte, dois níveis de detalhe, nenhum colisor extra, animação por transform simples sem física.

## Aceite e limites reais

1. Em Alto, o usuário deve enxergar cidade também **à frente**, sem criar um muro de colisão e sem ocultar permanentemente a mira.
2. O trem suspenso deve aparecer em movimento perceptível durante o gameplay, junto de suas guias.
3. As pequenas naves devem subir ao fundo sem se confundir com inimigos ou jogar o desempenho abaixo do alvo.
4. Alto/Médio devem preservar identidade arquitetônica e diferir em densidade, sem alterar gameplay.
5. Não declarar equivalência à imagem de referência: texturas premium, PBR e iluminação cinematográfica permanecem pendentes.
6. Exigir captura comparativa em 1366×768 e mobile 844×390, com FPS, p95 frame-time e avaliação humana. Metas iniciais: desktop 60 FPS e mobile 30 FPS, ainda não aferidos.
7. Homologação e merge em produção ficam bloqueados até testes de navegador (4 shards) e aprovação visual.

## Próximos passos após a homologação

- Substituir blocos genéricos do skyline por fachadas estilizadas, cúpulas, antenas maiores e estações urbanas.
- Diferenciar as zonas da cidade ao longo da fase (distrito comercial, industrial e base de lançamento).
- Implementar trens com detalhes adicionais/estação e trajetórias de fuga mais naturais.
- Materiais PBR, iluminação urbana localizada, reflexos e LOD por distância.
