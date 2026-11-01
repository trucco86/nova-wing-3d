# Nova Wing — QA integrada: núcleo fixo, cenários vivos e chefes premium

Data: 2026-11-01. Candidata: PR #244. Ambiente isolado, sem merge em produção.

## O que foi implementado

- Fase 4: a nave percorre a órbita real ao redor do núcleo; salão e reator ficam fixos.
- A câmera persegue a nave ao longo da trajetória orbital; os tiros miram o reator.
- Controles J/L e orbitadores de toque permanecem disponíveis na arena.
- Dez fases recebem atividade visual em planos médio e distante, com perfis distintos.
- Qualidade Média reduz instâncias; qualidade Alta exibe a população completa.
- Dez chefes recebem peças móveis, servos e detalhe mecânico sem novas hitboxes.

## Como homologar

1. Abrir o preview desta PR e entrar em TESTAR FASES (QA).
2. Iniciar fase 4 no encontro do núcleo. Esperar a aproximação do reator.
3. Segurar J/L ou botões de órbita: observar **a nave mudar de posição e ângulo**
   enquanto o núcleo, paredes, elevadores e estruturas permanecem no lugar.
4. Completar uma volta, acertar circuitos laterais e traseiros, pausar e retomar.
5. Explorar fases 1, 2 e 3, e ao menos duas fases posteriores: observar atividade
   dos planos médio e distante, sem tiros ou hitboxes fantasmas.
6. Comparar modo Alto e Médio e validar gráficos/HUD em desktop e celular horizontal.
7. Verificar chefes variados: peças movem durante combate, mas os alvos não se deslocam.

## Gates e limitações

- Fonte e teste Node passam pela preparação de QA. Exigir CI no **SHA final**.
- Playwright em quatro shards e avaliação visual real são gates de homologação.
- Sucesso do preview FAST não é autorização de produção.
- Não foram configurados Firebase, ranking ou nenhuma integração autenticada.
- Capturas em aparelho físico e FPS ainda exigem medição, não inferência.
