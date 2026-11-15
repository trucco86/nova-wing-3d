# QA137 | RPG sanfonado e controle de poluição visual no mobile

## Evidência
Captura portrait em iPhone (15/11/2026) mostra painel do RPG com 3 ações rápidas
permanentes, botão QA Berserk e habilidade tática expandida simultaneamente,
ocupando a área de mira. O aviso sobrepõe outras áreas. O chefe de Marte e a
tempestade também foram criticados, mas as mudanças de gameplay correspondentes
são tratadas na PR #361 (QA136), não duplicadas nesta branch.

## Contrato do HUD
1. Em dispositivo de toque, mostrar por padrão apenas o summary `RPG / EV`,
   com área de toque de pelo menos 44px, sem perder o nível.
2. Abrir sob demanda um único painel com ações rápidas, poder QA apenas quando
   autorizado, progresso, scan e habilidades; conteúdo deve rolar quando exceder
   o espaço e usar fundo semitransparente de boa leitura.
3. O RPG deve fechar após executar um poder; trocar arma/especial não fecha, pois
   pode exigir ciclos adicionais. Toque fora, controles de voo ou Escape fecha
   sem interferir em controles multitouch, boost, tiro e órbita.
4. Alertas de combate devem ocupar a faixa superior direita separada do resumo
   RPG no portrait, com até duas linhas para comunicação secundária. O chefe
   continua legível e os avisos críticos mantêm prioridade.
5. Respeitar safe-area, dispositivos estreitos, landscape, teclado, pausa,
   reinício, intermission e `prefers-reduced-motion`; QA Berserk nunca aparece
   em sessão comum.

## QA
- Testes de integração do menu e contratos estruturais: `node --test
  tests/qa137-mobile-rpg-accordion.test.mjs`.
- Executar `npm run format`, `npm run build`, `npm run validate`, 4 shards
  browser, capturas portrait 390x844 e 320x568, landscape 844x390, revisão
  de occlusão e interações reais no iPhone.
- Não declarar êxito visual nem ganho de FPS com base em CSS e testes Node.
- PR draft empilhada sobre #361; não publicar/mergear sem aprovação explícita.
