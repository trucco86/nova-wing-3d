# QA141: cidade premium mais brilhante sem poluição visual

## Problema
Prédios distantes eram percebidos como fachadas apagadas no modo Médio.
A estrutura maior no horizonte tinha volumes fortes, mas poucas janelas,
nervuras estruturais ou sinalização de escala.

## Solução
1. Megasestrutura, mesma localização original (z=-1130): fachadas iluminadas
   pela frente e pelo lado, plataformas, treliças conectadas e detalhes de
   coroa. As quatro famílias de material de base são instanciadas; dois
   lotes de precisão ficam em High, além do único torus já existente.
2. Cidade distante, 42 prédios: pelo menos uma janela âmbar e uma ciano
   integrada à fachada de cada edifício, visível em Médio e Alto.
   Mantidos os dois batches high antigos de luzes adicionais.
3. Horizonte urbano e assinatura central: iluminação realmente visível em
   Médio e detalhes geométricos incorporados aos mesmos três meshes.

## Orçamento de render
- Cidadela: até 5 draws em Médio, 7 em Alto; sem Canvas/texture extra.
- Iluminação base cidade34: 2 InstancedMesh de 42 instâncias cada,
  sem Mesh individual por janela e sem luzes reais de sombra.
- Nenhum hitbox, ad slot, colisão, mudança de altura/posição de
  monumentos, câmera ou gameplay.

## Aceite
- Fotos comparativas no mesmo ponto da fase 1, modo Alto e Médio,
  tanto portrait quanto landscape.
- Conferir leitura de anúncios e inimigos e ausência de brilho ofuscante.
- Perf: draw calls, FPS, p95/p99 frame time, memória em aparelhos reais.
- Npm validate e 4 Playwright shards verde antes de considerar pronta.

**Draft em branch isolada. Merge/deploy só após autorização explícita.**
