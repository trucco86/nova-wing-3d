# Nova Wing — homologação da nave e do robô (01/11/2026)

Candidata: [PR #239](https://github.com/trucco86/nova-wing-3d/pull/239), empilhada sobre [PR #236](https://github.com/trucco86/nova-wing-3d/pull/236). **Não é produção.**

## Contratos de gameplay

- Nave: segurar Q/E/Z ou o botão GIRO mantém a inclinação a 90°; toque curto faz o giro completo de 360°. Soltar um comando longo não deve produzir um segundo giro.
- Robô: o botão torna-se DASH e desloca lateralmente para o lado comandado. Sem esquerda/direita no WASD, setas ou joystick, o dash é bloqueado sem consumo de energia ou cooldown. Duração de 0,24 s, cooldown de 1,55 s e custo de 18 pontos de energia.
- Efeitos: em boost, dois pós-combustores com camada externa e núcleo claro; em dash, ativa somente o jato do lado oposto ao deslocamento. Quando inativo, os jatos laterais desaparecem.
- Fase 3: o robô não pode atravessar visualmente a parede do asteroide nem mesmo por um único frame. A regra também se aplica durante o dash.
- Satélites hostis e escoltas carregadoras: possuem HP, explosão e remoção de colisão após destruição. Paredes, trilhos e estruturas permanentes continuam sólidas.
- Escala: preservar o tamanho reduzido da nave e do robô, inclusive nos estágios altos de evolução.

## Cenários de aceite no navegador

1. **Desktop, teclado:** segurar Q por 450 ms, soltar sem giro de 360°, tocar E rapidamente e confirmar o giro completo. Transformar em robô e executar Z com D segurado; confirmar deslocamento, consumo de energia, rastro no espaço e jato visível à esquerda.
2. **Mobile horizontal:** segurar GIRO até a nave ficar de lado; cancelar e confirmar retorno à posição neutra. Transformar; tocar DASH, verificar que sem direcional o DASH não ativa; depois segurar o stick à esquerda ou direita e confirmar deslocamento, rastro persistente com fade, propulsor correto, botão acessível e nenhum bloqueio pelo HUD.
3. **Energia e cooldown:** gastar energia com boost, impedir dash com menos de 18 pontos, recuperar energia, exigir esquerda/direita e executar apenas um dash por janela de cooldown.
4. **Asteroide, fase 3:** usar TESTAR FASES (somente QA), levar o robô até a parede, acionar DASH para a parede e verificar clipping, colisão e indicador de escudo.
5. **Alvos físicos:** destruir satélite e nave hostil com tiros normais e robô; confirmar HP, pontuação, explosão e ausência de hitbox fantasma.
6. **Regressão visual/performance:** comparar capturas no iPhone horizontal e no desktop, qualidade Alto/Médio, funcionamento dos controles sem perda da mira e estabilidade de FPS.
7. **Preservação:** verificar fases 1–2, fase 4, câmera, armas, menu, ranking e login sem mudanças não aprovadas.

## Versão desta rodada

A candidata usa `v1.27.62`, com package, lockfile, metadados de release e HTML compilado sincronizados. O teste final deve rodar sobre o commit completo de QA; a geração do build não autoriza publicação em produção.

## Gates antes da promoção

Executar no commit final sincronizado: `npm ci`, `npm run format:check`, `npm run build:check`, `npm run validate`, `npm test` e `npm run test:browser`. Confirmar os resultados da CI, do preview Cloudflare isolado e o aceite visual no celular.

As duas asserções de visualização para QA são `snapshot().mecha.dashJetSide` e `snapshot().mecha.boostCoreCount`. Elas observam efeitos visuais, não substituem as capturas reais de WebGL.

Não fazer merge em DEV/HML/main, alterar Firebase ou liberar produção sem gates verdes e homologação explícita.

## Efeitos de velocidade

- Rastro de esquiva: pool de até 16 planos de energia em coordenadas de mundo, com dissipação em 320 ms. Nenhuma geometria de colisão extra.
- Propulsão do robô: jato central, saídas laterais e motores dorsais agora ficam visivelmente mais longos em BOOST, com a ponta estreita ancorada na boca do motor; confirmar em qualidade Alto e Médio no iPhone.

## Boss Combat 4.0 — primeira entrega: Descarga do Motor (Devastador)

- Fase 4, não fases 1–3: ataque exclusivo `reactor-vent` com alvo travado no início da preparação; área vermelha retangular no radar usa a mesma física do dano.
- O motor esquerdo ou direito fica visivelmente energizado durante o aviso e a descarga. O jogador sai do eixo horizontal (dash lateral do robô ou movimento da nave); o golpe não transporta a nave-mãe como se fosse uma investida.
- Válvula destruída não pode lançar a descarga, inclusive se a destruição acontecer durante o aviso. Ao destruir os dois motores, a descarga física é substituída pela rajada do núcleo; as salvas ficam limitadas às armas restantes.
- Testes: `tests/boss4-reactor-exhaust.test.mjs` verifica origem, aviso, área segura, motor destruído, modelo 3D e laboratório; a mesma suíte cobre resposta imediata do HUD ao uso de bombas em WebGL lento.
- **Aceite visual pendente:** em modo Alto/Médio e em celular horizontal, validar que a chama e o radar mostram o MESMO lado, que a descarga fica legível sem cobrir o retículo e que o dash sai da zona de impacto. Não promover a produção sem Playwright 4/4 e aprovação humana.
