# Nova Wing — City 2.8 / Adaptive Performance + Urban Realism

## User feedback

Galaxy S21: modo Alto perceptivelmente lento. Carros ainda simplificados; cidade precisa de movimento e detalhes sem multiplicar custo de renderização.

## Mudanças implementadas

- `src/graphics-quality.js`: heurística conservadora para telas touch de alto DPI. Medium inicial DPR 0,98; High inicia com DPR até 1,12, sem ignorar a escolha manual. Controller utiliza a amostragem do percentil 75 dos intervalos de quadros em janelas de 2,2 s, aquece antes de adaptar, exige 2 janelas consecutivas de queda, mantém cooldown e pode reduzir resolução até 68% no touch. No modo Automático faz fallback de High para Medium. Se a degradação severa persistir mesmo com a resolução mínima, aplica também um fallback emergencial em High manual, sem alterar a preferência salva. Após uma janela longa de estabilidade, pode recuperar resolução.
- `src/game.js`: controlador conectado à atualização real da partida, sem usar o delta da física como medida de FPS. Não mede menus, pausas ou abas ocultas. A aba de auditoria de FPS informa qualidade efetiva e escala interna. Mantém a renderização das interfaces e a resolução de layout.
- `src/city-traffic.js`: rodas, rodas iluminadas, linhas de carroceria, grades, faróis, propulsores, aletas e acabamento mecânico em carros, táxis aéreos e naves. Cada classe tem os acabamentos unidos em uma malha `vertexColors` e uma chamada instanciada à GPU por trecho, sem um draw call por peça. Os táxis passam por rotas aéreas mais legíveis (mais altos e mais próximos da avenida).
- `src/city-urban-drones.js`: doze drones de serviço/segurança/entrega com trajetória 3D ondulante, separados dos carros, em duas malhas instanciadas, com seis visíveis no Médio. Animados por progresso da fase; congelam no Pause e desaparecem ao sair do setor da Terra.
- Orçamento de objetos instanciados de cena: 146 em vez de 136, apesar de vários componentes visuais adicionais; duas das chamadas extras por trecho pertencem aos drones, três aos acabamentos detalhados dos veículos. Validar FPS real.

## Gates e limitações

- Tests de FPS adaptativo, pausa, queda de frames, geometria composta, trajetórias, LOD e troca de setores.
- O algoritmo reage a FPS medidos e capacidade heurística, não identifica o GPU do S21 pela marca ou presume uma pontuação de benchmark. Necessária medição real por 30–60 s no S21, incluindo cenas pesadas (cidade, combate e boss).
- Renderização mobile pode reduzir definição interna para preservar a jogabilidade; opções Medium / High permanecem acessíveis. Não alegar 60 FPS fixos antes de medição.
- Material procedimental/instancing melhora a densidade visual, mas ainda não é substituto para arte PBR avançada em GLB nem para otimização profiling de GPU com captura real.
- Candidata QA isolada, sem promover DEV/HML/produção antes de regressão Playwright, homologação humana e FPS medido.
