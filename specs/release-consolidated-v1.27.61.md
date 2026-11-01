# Nova Wing v1.27.61 — plano de promoção consolidada para produção

## Escopo autorizado

Consolidar a campanha de 10 setores e a experiência visual aprovada pelo proprietário:
Marte 4.x com areia sem torus; ascensão/descida e fuga de planetas; Europa,
Vênus, Netuno, Saturno, Júpiter, Órion e Titã; PBR e polimento da cidade;
controles de QA somente em hosts de testes; sem adulterar saves/ranking.

A base dessa candidata é a branch `feat/planetary-visual-polish-20261101`
(commit `d4a3c208c006921099d9b540ca28de7952f2c5f7`), que incorpora
as mudanças empilhadas antes de `#222`, incluindo `#220` e `#221`.

## Bloqueios da CI anteriores à promoção

CI de 1.27.60: qualidade 451/451 verde; browser vermelho nos quatro shards.
Os testes que falharam incluíram:
- abertura/seleção Five Cats em CI WebGL software;
- fluxo inicial de renderização e pausa;
- boost sustentado e retomado em hardware simulado;
- botão FIRE segurado aguardando charge >65% sem avançar tempo simulado;
- subchefe em três layouts do celular, avançando passo a passo com render desnecessário.

Não declarar estes bugs resolvidos sem reexecutar o suite. Os testes de
navegador que originalmente falharam devem continuar validando os mesmos
controles, limiares físicos, HUD, salvamento e o mesmo código-fonte do jogo.
Ajustes no harness/browser: avançar deterministicamente o relógio da
simulação em cenas de QA; manter eventos reais de teclado/toque; renderizar
no checkpoint, não a cada passo artificial; dar janela maior aos testes
WebGL em SwiftShader; sem skip ou regravação de golden screenshots.

## Critérios de liberação (todos obrigatórios)

1. `npm run release:prepare -- 1.27.61`, formato, build, build:check,
   validate e suíte Playwright completa sem falhas, sobre o mesmo commit.
2. Build final `index.html` sincronizado com `src/`, notas e changelog
   efetivamente versionados, sem arquivos locais ou tokens.
3. PR de integração ao `main`: sem conflito e com checks obrigatórios
   `quality` e `browser` verdes; verificar branch principal antes de merge.
4. Checagem funcional de jogos 1–10 e painel de QA sem aparecer em produção;
   mobile portrait/landscape, controles, áudio, HUD e bosses.
5. Fazer merge por PR (nunca push forçado), aguardar deploy `pages` no `main`
   e conferir SHA/link/versão antes de anunciar produção.
6. Se qualquer gate falhar, parar a promoção, manter produção anterior
   e registrar bug; aprovação do usuário não autoriza falsificar checks.

## Rollback

Identificar o SHA do `main` antes da promoção. Se surgirem regressões,
criar PR de revert do commit de integração, rodar CI e verificar Pages.
Não desabilitar branch protection nem regravar histórico compartilhado.

## Gate real do candidato inicial (executado e reprovado)

Na preparação de `v1.27.61`, os 16 testes focados do menu/Marte/boost
passaram; a bateria de 8 cenários focados de produção teve **6 aprovações,
2 reprovações e 2 skips específicos de plataforma**:
- **Bug funcional:** selecionar Calvinho no hangar ainda mostrava BIA no HUD
  logo após pular a cinemática. Corrigir o HUD no momento da chamada
  `start()` e exigir o piloto selecionado antes do primeiro tick.
- **Bloqueio de observação:** a UI do subchefe em três viewports era testada
  por um avanço de ~35s de simulação WebGL e excedia 120s de CI. O
  `startDeveloperScenario(0, 'subboss')` existente já cria **o subchefe real**,
  sua barra real e é isolado do ranking; o fixture localhost pode acioná-lo
  diretamente sem alterar hitbox/HP ou simular 35s não relacionados ao HUD.

A bateria revisada tem de permanecer verde; não retirar verificações de
seleção/vida dos Five Cats, bloqueio central do HUD, collision ou ranking.
Sem sucesso do Playwright completo e resolução da divergência com main,
**não publicar a nova versão em produção**.
