# Aprendizados e decisões

## Estrutura deve corresponder ao repositório

O README de referência descreve uma organização modular que não estava integralmente materializada na árvore consultada. Esta edição implementa os diretórios e comandos documentados e valida links locais para reduzir divergência entre explicações e código.

## Testar o código real

A fábrica `createGame` permite injetar interfaces do navegador, relógio e renderer. O harness executa a lógica de produção; não mantém uma segunda implementação da física. Isso torna verificáveis pausa, cadência, proteção temporária, chefe e reinício sem depender de WebGL.

Essa separação tem um limite explícito: um renderer simulado não compila shaders nem prova que o jogo está bonito. Testes de navegador complementam a camada determinística.

## Uma fonte de verdade

A fonte editável vive em `src/`; o HTML raiz é gerado. A comparação de build detecta esquecimentos de regeneração sem modificar arquivos durante a validação. Skills são mantidas em um só lugar e descobertas por links simbólicos.

## Resultados coerentes

Tiros e bombas precisam usar o mesmo caminho de dano do chefe. Caso contrário, uma ação pode reduzir sua vida sem encerrar corretamente a missão. O teste de bomba final verifica essa transição.

## Entrada móvel precisa de cancelamento

Toque pode terminar por interrupção do sistema, não apenas por soltar o dedo. O evento de cancelamento e a perda de foco devem liberar controles para evitar movimento preso.

## Evidências antes de promessas

Relatórios distinguem teste aprovado, falha e teste não executado. O ambiente de navegador usado durante o desenvolvimento não oferecia WebGL; isso limita a validação visual local. A CI foi preparada para Chromium com renderização por software, cuja execução precisa ser confirmada no GitHub.

## Harness não equivale a garantia absoluta

Instruções orientam agentes; scripts verificam contratos; regras do GitHub podem bloquear merges. Nenhuma dessas camadas isoladamente impede todos os defeitos. A documentação mantém explícita a diferença entre workflow versionado e proteção de branch ativada.
