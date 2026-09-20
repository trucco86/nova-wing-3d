# Fundação do repositório

## Objetivo

Organizar o protótipo 3D existente segundo a estrutura modular documentada pelo Nova Wing e oferecer um fluxo verificável de atualização por agentes.

## Escopo

Uma missão com teclado e toque; modularização, build estático, documentação, skills, testes, CI e exportação para GitHub. Não inclui novas fases, loja, música ou reprodução integral de Star Fox Zero.

## Critérios de aceitação

- O build gera HTML único sem buscar Three.js em CDN.
- Fontes e saída permanecem consistentes, verificadas por `build:check`.
- A lógica real passa nos casos de pausa, combate, toque, chefe e reinício.
- Skills têm identidade válida e descoberta sem duplicação.
- Documentação local não contém links quebrados.
- CI possui gates de qualidade e navegador com permissões mínimas.
- O upload é confirmado por commit remoto; publicação do jogo e proteção de branch têm status separado.

## Evidências

Consulte `artifacts/validation.json` após cada execução e a CI do commit enviado. Testes de navegador só são considerados aprovados após execução real; a existência de sua configuração não satisfaz esse critério.
