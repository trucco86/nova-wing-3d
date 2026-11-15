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
