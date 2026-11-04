# HUD Quiet Combat — menos texto, mais jogo (v1.27.82, somente QA)

## Problema
O HUD empilha mensagens de rádio, ataque, HP baixo, itens coletados, briefing, Boss State e inventário. Na batalha contra chefes isso aumenta ruído cognitivo, disputa o espaço central com canhões, projéteis, weak points e radar, especialmente em 320×568, 390×844 e 844×390.

## Hierarquia visual
1. **Crítico:** integridade crítica, fuga/emergência. Único aviso e alta visibilidade.
2. **Ação imediata:** telegraph real do chefe e direção de esquiva. Uma linha ou até duas curtas, nunca competindo com texto de rádio.
3. **Atenção:** escudo baixo, chegada de chefe, item coletado.
4. **Ambiente:** transmissões de piloto, upgrades, nomes de formação.

Só **uma faixa de aviso prioritário** aparece por vez. Reduzir a legibilidade jamais significa esconder o risco.

## Política de mensagens
- Texto de rádio compacto, em duas linhas pequenas no máximo. Remover o nome de piloto repetido, já identificado pelo avatar; favorecer verbos e instruções.
- Duração: ambiente 1,65 s, ação 2,1 s, emergência 2,5 s. Antes eram 3 s para tudo.
- Não repetir a mesma informação por 7 s (3 s se emergência); limitar uma nova mensagem de contexto a cada 4 s; o perigo preempta mensagens menores imediatamente.
- Nunca sobrescrever alerta crítico por falas não essenciais; reiniciar política a cada missão. Modo legado preserva seus textos.
- **Acessibilidade:** texto integral mantido em `aria-label` e tooltip, além de não remover avisos prioritários do DOM.

## Organização de tela
- `#hudNotices`: trilho de prioridade superior, compacto; avisos de ataque e rádio no máximo 2 linhas. Itens não geram uma segunda coluna concorrente.
- `#bossHUD`: barra de integridade + somente uma linha de estado tático; pontos fracos e arma física continuam visíveis.
- Inventário `petCareHud`: visível entre confrontos, não durante batalha com o chefe. Recompensa de item mantém áudio/feedback em momentos normais.
- RPG, ORBITAR, FIRE, BOOST, reticle, barra de HP e radar mantêm suas posições e alvos de toque.
- Reaproveita lógica de `#hudNotices` para desktop e mobile; não adiciona canvas, partículas nem custo de renderização 3D.

## Testes de aceite
- Unit tests: prioridade de emergência, instrução e ambientação; remoção de repetições; duração; restauração; primeiros alertas da missão; texto integral.
- Playwright: um alerta ao mesmo tempo, com estado original presente no DOM, em 390×844, 320×568 e 844×390. Nenhum texto intercepta controles.
- Teste de regressão com chefes da fase 6 e 8 e avisos de fuga Devastador, progressão e ORBITAR.
- Homologar percepção visual e acessibilidade em celular físico antes de produção.

**Escopo limitado a UI/comunicação.** Não altera comportamento de ataque de chefes, colisões, câmera, física de disparos, armas ou gameplay aprovado.
