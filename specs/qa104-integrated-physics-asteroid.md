# QA104 | Integração de física, navegação e fase 3

Status: proposta técnica para implementação, não homologada.
Base: dev. Não alterar fases 1 e 2 aprovadas fora das correções físicas estritamente necessárias.

## P0 Colisões físicas localizadas
- A nave deve navegar por toda a área visível e jogável, sem caixa de colisão global artificial.
- Somente meshes de objetos sólidos devem bloquear movimento; volumes decorativos e efeitos não bloqueiam.
- Viadutos, prédios, trem e destroços devem impedir atravessamento da nave, respeitando altura e geometria.
- Destroços caem sob gravidade, colidem com superfície e param ou quicam sem atravessar o chão; não podem ficar suspensos.
- Separar colisores estáticos, dinâmicos e gatilhos. Usar varredura entre posições anteriores e novas para evitar tunneling em boost.
- Câmera e obstáculos não devem ocultar continuamente a nave nem o ponto de mira.

## P0 Fase 3: entrada no asteroide
- Entrada cinematográfica contínua com aproximação e escala progressiva, sem teleporte, flash de cenário ou troca abrupta de câmera.
- Segmento jogável de desvio de rochas, espinhos e corredores estreitos, com espaço legível e rotas possíveis.
- Giro sustentado da nave deve permitir atravessar gargalos definidos, com feedback visual e sem ignorar colisões.
- Inimigos não surgem dentro de rochas nem atravessam superfícies.
- Preservar chefe aprovado; enriquecer traseira com geometria, propulsores, armas e pontos de interesse, sem comprometer silhueta.

## P1 Polimento integrado
- Cidade: mais vida nos planos intermediário e distante, sem interferir na leitura dos obstáculos.
- Chefes: bocas de canhão, origem de projéteis, telegráficos de ataque e pontos fracos claramente visíveis.
- Robô: dash lateral na direção do comando, animação de recuperação e colisão consistente.
- HUD: mensagens breves, não sobrepor centro de gameplay; manter controles touch utilizáveis.

## Testes obrigatórios
1. Nave percorre extremos superior, inferior, esquerdo e direito de cada arena, salvo bloqueio por objeto real.
2. Nave não atravessa viaduto nem trem em velocidade normal ou boost.
3. Destroços de diferentes tamanhos colidem com chão em desktop e mobile, sem interpenetração persistente.
4. Giro da fase 3 passa por gargalo apropriado; sem giro, colide corretamente.
5. Transição asteroide não apresenta flicker, clipping ou salto de câmera.
6. Regressão fases 1 e 2; controles desktop/touch, pausa, RPG e orbitar.
7. Medir FPS, draw calls e triângulos em Alto e Médio; comparar com baseline do mesmo aparelho.
8. Executar npm run build:check, npm run validate e npm run validate -- --browser, além de smoke WebGL real.

## Release gate
Implementar em branch isolada; consolidar PRs existentes por diff e SHA, não por nome. CI completa, evidência de vídeo/capturas, homologação em celular, DEV e HML antes de produção. Sem merge ou deploy automático.
