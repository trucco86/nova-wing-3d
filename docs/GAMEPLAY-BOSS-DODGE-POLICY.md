# Política de esquiva de chefes

Primeiro componente de um jogador sintético reativo. Usa apenas direção publicada no HUD do radar, ameaça e janela de aviso/ataque. Converte as setas em teclas ou deslocamento do joystick; não consulta coordenadas ocultas nem modifica escudo ou física.

O agente mantém a posição quando está seguro. Sem direção específica, não inventa uma rota. A falta de orientação deve ser registrada separadamente pelo futuro executor.

## Próximo teste de integração

Começar com Rok e Colossus (Europa), usando o cenário de chefe da fixture WebGL. Comparar perfil passivo e reativo sob o mesmo cenário. Registrar intenção visível, sequência de entradas, posição, escudo antes/depois, ataques distintos, ameaça antes/depois da esquiva e clips de falhas. Não comparar dano sem controlar a variabilidade do cenário e exposição. Não usar recuperação artificial de escudo ou teleporte.

A política não executa uma batalha sozinha. Não comprova esquiva bem-sucedida, dificuldade justa ou diversão. Os quatro testes unitários desta branch e a integração ao navegador precisam ser executados. Preservar a validação da PR #447; integrar somente depois de seu CI e calibração.
