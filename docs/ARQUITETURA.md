# Arquitetura

## Fluxo de execução

`src/main.js` chama `createGame()` de `src/game.js`. A fábrica monta a cena Three.js, interface, controles e ciclo de animação. `src/visuals.js` fornece modelos de naves, cenário procedural e pós-processamento.

O movimento para a frente é simulado pelo deslocamento dos elementos em relação à nave. A nave controla posição horizontal e vertical em uma área limitada. Objetos que passam pelo jogador são removidos ou reposicionados. O cenário usa instâncias para reduzir chamadas de desenho.

## Estado e tempo

O jogo alterna entre menu, partida, pausa e resultado. O ciclo visual utiliza delta de tempo limitado; testes avançam o mesmo código por `step(dt)`. Ondas aparecem durante a missão e o chefe entra após aproximadamente 145 segundos. O dano do chefe passa por uma função comum para tiros e bombas, evitando diferenças no encerramento da vitória.

Escudo, bombas, energia, pontuação e entidades pertencem à instância do jogo. Reiniciar limpa entidades e repõe recursos. Pausa congela a simulação. Perder foco limpa teclas pressionadas e pausa a partida.

## Entradas

Teclado e controles de toque alimentam as mesmas ações. Eventos de cancelamento de ponteiro devem liberar o movimento. A fábrica aceita relógio, gerador aleatório, agendamento e renderer para testar sem GPU. Essas interfaces não expõem mutações do jogo como comandos globais no navegador.

## Renderização

Three.js 0.170.0 permanece fixado para preservar compatibilidade com shaders e materiais já utilizados. Geometrias compartilhadas reduzem alocações entre instâncias de naves. Água, cidade, lua, estrelas e propulsores são procedurais. Bloom acrescenta brilho à composição; não é um motor físico de iluminação.

A verificação estrutural de malhas não substitui renderização real. Erros de shader, enquadramento e legibilidade precisam dos testes no navegador e de revisão visual.

## Interface e áudio

O HTML contém HUD, diálogos e controles; CSS adapta a interface para telas menores. Efeitos sonoros usam Web Audio após interação do usuário. Não há trilha musical nem sistema completo de mixagem. Fontes externas são opcionais, com fallback CSS.

## Build e distribuição

`tools/build.mjs` usa esbuild para incorporar Three.js e o código do jogo, CSS e retrato WebP em `index.html`. `src/shell.html` contém marcadores de substituição. `build:check` recompõe a saída em memória e compara com o arquivo versionado.

A entrega em um HTML simplifica hospedagem estática. O custo é um bundle gerado grande; agentes devem consultar fontes, não esse arquivo. `tools/build.py combine` é um atalho de compatibilidade. Não existe operação de divisão que reescreva fontes a partir do bundle.

## Dependências

Node 24 é a referência de desenvolvimento. `npm ci` utiliza o lockfile. Atualizações de dependências exigem validar o build e, para Three.js, renderização real. Não há backend, conta de jogador nem persistência de progresso.

## Extensões futuras

Novas fases devem extrair dados de encontros para um módulo próprio antes de multiplicar condicionais. Persistência e música exigem especificações separadas. Mudanças de performance devem trazer medições reproduzíveis com dispositivo, resolução e cenário, sem promessas de FPS baseadas apenas em inspeção.
