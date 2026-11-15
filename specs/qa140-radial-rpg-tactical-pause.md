# QA140 | Menu RPG radial e pausa tática de combate

## Decisão de produto

No mobile, o RPG é apenas um botão circular `RPG · EV` quando fechado.
Ao abrir, a simulação congela, preservando nave, projéteis, inimigos,
movimento de chefes, tempestades, dano e cronômetros, enquanto o último
frame 3D permanece visível atrás de uma camada leve de escurecimento.
A pausa do RPG não deve abrir a interface convencional de PAUSA.

## Fluxo

1. Clicar no gatilho circular mostra exclusivamente quatro categorias
   em roda: Armas, Especiais, Berserk e Utilitários.
2. Selecionar uma categoria mantém a simulação congelada e abre painel
   compacto, rolável, só com ações daquela categoria.
3. `VOLTAR` retorna ao radial sem retomar gameplay.
4. Ativar uma habilidade com sucesso, tocar fora, fechar ou usar Escape
   volta para o jogo imediatamente. O clique do jogador nunca vira tiro
   ou boost involuntário.
5. Trocar arma ou tipo de especial pode ser feito repetidamente, sem
   fechar o submenu até o jogador decidir.
6. No desktop, preservar as ações existentes no disclosure tradicional.

## Regras especiais

- Berserk na campanha só após atingir EV 13 e consumir energia/cooldown reais.
  O comando QA existente só aparece em sessão de testes.
- Não conceder imunidade nem resetar tempo, HP, pontos, bombas ou progresso
  ao fechar; nada avança enquanto a roda está aberta.
- Ao pausar o RPG, soltar inputs presos, silenciar o carregamento/plasma e
  pausar a música; ao fechar, restaurar a música respeitando as preferências.
- Sem animações WebGL adicionais ou shader de blur; usar CSS de baixo custo.
- Verificar operação em 320x568, 390x844 e 844x390, com modo canhoto,
  ações multitouch e safe-area.

## QA obrigatório

`node --test tests/qa140-radial-rpg.test.mjs`, `npm run validate`,
`npm run build:check`, quatro shards Playwright e captura de screenshot
do radial e dos quatro submenus. Sem merge ou produção antes de homologação.

## Follow-up QA140 | PAUSA e vibração (captura iPhone, 15/11/2026)

- A **PAUSA convencional** é uma interface modal exclusiva; botão circular
  `RPG · EV` e qualquer outro controle de RPG ficam completamente ocultos
  desde o primeiro frame de pausa, inclusive na aba CONTROLES e em OPÇÕES.
  Ao tocar CONTINUAR, o botão retorna sem alterar a simulação.
- Preserve a distinção: o RPG aberto congela a simulação sem mostrar a
  PAUSA convencional; a PAUSA convencional não deixa o RPG interativo/visível.
- `navigator.vibrate()` só dispara quando o navegador realmente expõe a
  API. Em Safari do iPhone não há API padrão de vibração; não tentar
  workarounds de WebKit que falham em versões modernas do iOS.
- A opção VIBRAÇÃO indica claramente quando está indisponível e não pode
  ser ligada nessas plataformas. A preferência persistida em outro aparelho
  permanece guardada sem falsas promessas neste dispositivo.
- Um plugin nativo de haptics do Capacitor pode ser usado **somente se já
  estiver instalado e detectado no app nativo**. Isto não transforma a
  prévia web em aplicativo nativo nem comprova suporte háptico no iPhone.
- Em navegadores compatíveis, ativar a opção gera feedback físico curto
  como confirmação; colisões e tempestade continuam usando pulsos limitados.

**Evidências de aceitação:** testes Node de PAUSA, detecção de suporte e
pulsos reais/negados; Playwright mobile com screenshot da PAUSA sem RPG
em 320x568, 390x844 e 844x390; opção desabilitada em navegador sem
`navigator.vibrate`. Verificação física no iPhone fica pendente.

## Roteiro manual no preview isolado

1. No iPhone, iniciar a fase, tocar PAUSA e abrir CONTROLES.
   Nenhum botão RPG pode permanecer sobre a janela.
2. Retomar a fase e confirmar o retorno do botão RPG.
   Abrir o radial e fechar sem acionar tiro, boost ou órbita.
3. Abrir OPÇÕES no iPhone: VIBRAÇÃO deve estar indisponível e
   trazer uma mensagem de suporte, sem prometer haptics no Safari.
4. Em Android com navegador compatível, ativar VIBRAÇÃO e
   confirmar o pulso curto; verificar feedback em impactos.
5. Registrar o commit exibido pelo preview, a resolução testada
   e qualquer sobreposição. Não confundir preview com produção.
