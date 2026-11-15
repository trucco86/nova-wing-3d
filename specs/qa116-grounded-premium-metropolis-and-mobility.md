# QA116: metrópole premium com sustentação e mobilidade funcional

## Objetivo

Usar como norte visual o concept da Fase 1 aprovado na conversa de 12/11/2026, sem equiparar uma imagem offline ao frame WebGL em tempo real. Preservar os outdoors genéricos do QA110, fachadas geométricas PBR do QA113-115, narrativa de ascensão, controles e orçamento mobile.

## Problemas observados

1. Três passarelas superiores com deck e brackets colidíveis terminavam no ar, sem apoio até o solo.
2. Tráfego com 12 carros terrestres, sete carros voadores e seis naves de evacuação, sem ônibus.
3. A iluminação base ainda tinha faixas rosa/magenta e ciano intenso, com aspecto menos realista que a referência.

## Implementação

- Seis pilares exteriores ancorados em **y=-7** com extensões físicas dos decks, travamento horizontal e base afastada de **x±72**. O pilar oeste do deck central fica fora da cobertura da estação maglev. Não criar barreiras invisíveis no espaço.
- Preservar geometria, altitude, ordem de entrada e colisores originais dos três decks. Extensões expostas passam a ter colisão real. Nave consegue passar abaixo ou acima da travessia, sem ser teleportada lateralmente.
- Ônibus urbanos longos no solo: **2 Medium / 4 High**, carroceria, rodas, vidros, portas, luminárias e identificação de linha fictícia, usando **um único lote de geometria mesclada**. Sem tráfego atingir o avião ou veículos no corredor.
- Aumentar carros voadores de **4 para 7 no Medium** e de **7 para 13 no High**. Rota ao lado do corredor de voo, fora dos prédios e acima do maglev. Movimento por distância percorrida, determinístico durante Pause.
- Recuperar orçamento GPU realocando o material da luz traseira para a geometria mesclada do carro voador. **Meta: manter 22 batches de tráfego por tile**; checar chamadas e FPS reais antes de merge.
- Reduzir rosa/ciano saturados da arquitetura da Fase 1 em favor de metal escovado, vidro em cores naturais, iluminação branca/dourada e detalhes ciano discretos. Sem alteração das cores funcionais de perigos, armas ou HUD.
- Reutilizar o inventário de mídia genérica já introduzido no QA110 e adicionar dois espaços traseiros por tile quando houver fachada livre, com painéis orientados para o lado de fora, suporte preso à estrutura real e sem novos batches; não conectar ad server.

## Critérios verificáveis

1. As passarelas exibem pilares conectados ao solo; coliders apenas onde há decks/brackets/extensões visíveis.
2. Os dois tiles da Fase 1 preservam os obstáculos e ônibus/carro voador respeitam faixas laterais, sem atravessar os prédios.
3. Os dois perfis High/Medium exibem ônibus e aviões com as densidades contratadas e sem objetos gerados por frame.
4. Exibir pelo menos um outdoor nas costas de um prédio em cada tile, orientado corretamente e sem atravessar a fachada ou outra torre. Os testes do inventário QA110 continuam obrigatórios.
5. Contratos Node, geometria, CI completa, screenshots desktop/mobile, leitura dos outdoors e métricas de FPS WebGL no dispositivo são exigidos **no SHA final**, sem relaxar testes.
6. Não publicar na main nem atualizar produção sem homologação visual e autorização específica.

## Riscos e limites

A extensão dos decks muda a colisão lateral próximo às extremidades: testar aproximação, desvio por baixo e por cima, boost e wrap. O objetivo é maior coerência física, não obstrução arbitrária. Bus e carros voadores são cenográficos, não adversários ou obstáculos de combate. Referência 2D não garante qualidade AAA em todos os dispositivos. Suporte, colisões e fluidez exigem QA real no navegador. O custo GPU deve ser medido; batch count é apenas um orçamento parcial.

## Roteiro obrigatório de revisão visual

Comparar screenshots reais de desktop e celular nos perfis Médio e Alto, utilizando exatamente a mesma trajetória de voo: aproximação de cada uma das três pontes, ônibus próximos ao chão, carros voadores em profundidade e outdoors vistos de frente, lateral e por trás. Registrar clipping, interferência no HUD, iluminação, materiais, FPS e draw calls reais. A melhoria cromática não deve reduzir o contraste de ataques ou dos alertas de colisão. A observação de uma imagem conceitual isolada não substitui o teste WebGL.

Na revisão dos outdoors traseiros, verificar se a campanha é legível sem espelhamento pela câmera da nave, se os suportes não atravessam as coberturas e se a face da peça permanece voltada para fora da construção. A aprovação visual deve usar o preview do mesmo SHA validado pela CI.
