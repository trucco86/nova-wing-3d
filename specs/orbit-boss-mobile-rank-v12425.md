# Nova Wing v1.24.25 — UX orbital, entrada do chefe e ranking compacto

## Requisitos da rodada

- **Órbita**: satélite grande e reconhecível ao lado da Terra após início da transição orbital; corpo, painéis solares, antena, luz de navegação, com presença consistente mesmo sem spawn de obstáculos. Inexistente antes da subida, oculto em outros setores.
- **Naves**: casco, painéis, aletas, luzes, sistemas de propulsão e armas mais trabalhados sem alterar colisão, balanço ou controles.
- **Chefe**: deve partir visualmente da doca da nave-mãe em perspectiva, não nascer diretamente na frente do jogador. Durante a saída, sinalização na faixa superior e sem ataque/dano até estar na arena; preservar comportamento do chefe depois.
- **Ascensão**: aviso persistente e piscante **no topo** durante a fase obrigatória de BOOST, com SHIFT (teclado) ou BOOST (mobile) e indicador no botão mobile. Desaparece após consumir energia e atravessar a atmosfera. Nunca no centro do gameplay.
- **Capa mobile**: arte integral sem corte por CSS background-size contain, conteúdo e CTA utilizáveis entre 320 e 430 px, safe areas, viewport pequeno e rolagem vertical quando necessário.
- **Conta/Ranking**: identidade e ranking com linguagem visual sci-fi integrada ao menu; ranking como informação principal, texto secundário em `<details>` acessível por ícone **i**, configuração opt-in em painel fechado, histórico opcional. Preservar IDs/atributos usados em testes e APIs, condições de consentimento e exclusão LGPD.
- **I18n**: novos textos em PT/EN/ES. Respeitar tradução global Options e manter informações obrigatórias de exclusão acessíveis.
- **Não subir PROD**: primeiro preview de PR HML e screenshot real/revisão mobile 390x844/844x390 antes de publicar.

## Evidências

Testes unitários de telemetria, satélite, spawn e nomenclatura; `npm run validate` e browser-shards no SHA final. Homologação visual humana e Firebase/D1 reais permanecem independentes.
