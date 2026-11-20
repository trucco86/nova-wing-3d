# Five Cats Universe: Órbita-9 com circulação livre

**Status:** vertical slice de exploração 3D em Developer/QA. Não é mundo aberto planetário completo. Implementação isolada da campanha e da produção.

## Comportamento observável

1. A entrada permanece pela Central, painel Developer/QA, no botão de explorar Órbita-9. O protótipo inicia em (`x=0,z=12`) e usa o modelo 3D do gato selecionado, derivado do mesmo construtor do hangar.
2. A estação deixa de ser um único corredor: átrio central, laboratório oeste, praça do reator leste e arquivos sudoeste dividem um único espaço navegável `[-56,56] × [-100,18]`. Pode-se ir diretamente de um setor a outro sem mudar de tela.
3. O átrio tem um núcleo sólido e há outros quatro volumes de arquitetura com bloqueio. Jogador desliza nos eixos de colisão, não atravessa a arquitetura; iluminação/pistas e pisos decorativos não impedem a navegação.
4. Três pistas originais ficam distribuídas entre laboratório `(-38,-18)`, praça `(39,-55)` e arquivos `(-37,-82)`. Sobrevivente fica na área sul `(9,-92)`.
5. Minimap fixo no canto, sem capturar toques, representa jogador, três pistas, coletadas e sobrevivente. Nome do setor é atualizado enquanto anda. Interação por E/SCAN a distância de 8,5 unidades continua existente.
6. Decisão do sobrevivente, gate para chefe da Rota Fantasma, bloqueio antes de coletar as pistas, saída e limpeza de WebGL permanecem inalterados. Nenhum checkpoint, login, ranking, Firebase ou save de exploração é modificado.
7. A sessão restaura as três pistas quando o usuário sai e abre novamente. QA `__novaExploreQA.moveTo` só teleporta para coordenadas válidas, sem atravessar volumes sólidos.
8. O modelo felino é criado e destruído apenas com a sessão e não permanece carregado durante o rail shooter.

## QA e matriz

- Node: regiões e pontos de interesse acessíveis, limites finitos, detecção de volumes sólidos, deslizamento lateral e coordenadas normalizadas do minimapa.
- Browser desktop: fluxo real Central → Developer → exploração, troca de setores, coleta das três pistas, decisão, gate do chefe e ausência de persistência.
- Browser mobile portrait 390×844 e landscape 844×390: joystick e SCAN alcançáveis, minimapa não obstrui controles, screenshot, fechamento e abertura reinicializam estado.
- Validação completa, build sincronizado e revisão visual são necessários antes de merge. Sem alegar FPS medido ou finalização do mundo aberto antes das medições.

## Limites conhecidos

- Região única da estação. Sem planeta explorável, câmera manual orbital, NPC com IA, inventário de exploração, recompensas persistentes ou combate terrestre.
- Obstáculos usam caixas AABB simples e foram posicionados para não impedir os três pontos de missão. A direção artística definitiva requer análise visual em dispositivo.
- A branch está empilhada na candidata cinematográfica do Nova Wing, sem alteração automática da `main`.
