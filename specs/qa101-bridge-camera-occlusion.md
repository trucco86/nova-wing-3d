# QA 1.27.101 — câmera sob passarelas sem perder colisão

## Por que a v1.27.100 ainda exigia ajuste

O PR #293 corrigiu o bug físico e permitiu subir sobre passarelas reais. As capturas `overpass-physical-contact` de desktop e mobile mostram uma enorme região escura no topo da tela: a face inferior da travessa entre câmera e nave. Embora a física esteja correta, o jogador perde leitura do cenário. O problema não deve ser resolvido desativando colisores, escondendo pontes inteiras ou alterando os limites de voo.

## Regra de renderização

- Somente estruturas de ponte com collider ativo **entre câmera e piloto** podem sofrer fade. A interseção é contínua e considera a margem vertical do enquadramento (a face visível pode obstruir a parte superior mesmo sem encostar na linha central).
- Fading gradual até 17% da opacidade da estrutura; sem esconder a malha (`visible` continua true), sem mudar posição, escala, collider, dano, tiro, pontos fracos ou movimento.
- Famílias com material independente em cada tile: passarelas antigas `city-elevated-crossings`, trilho transversal `city32-maglev-crossing-guideway`, viadutos superiores `city-upper-skybridge-*`. Não compartilhar alpha com outros prédios nem com o segundo tile distante.
- Transparência ativa apenas durante oclusão, sem escrever profundidade nos pixels semitransparentes; material volta a opaco e `depthWrite=true` fora do corredor, ao reiniciar ou ao sair da cidade.
- A geometria física permanece registrada independentemente de alpha: **nunca usar opacidade como sinal de collision enable/disable**.
- Manter limite de voo x±72 e altitude y=184 no setor 1; todos os demais setores, gameplay e sequência orbital aprovados não são alterados.

## Regressão adicional de HUD mobile

No setor orbital, um tiro sobre blindagem fechada pode retornar honestamente `data-impact=blocked` / `SEM DANO`. O teste `mobile-hud-audit` verificava obrigatoriamente `boss` / `ACERTO +N`, embora fosse um teste de posição no HUD. Aceitar _somente_ os dois feedbacks coerentes com sua própria mensagem; preservar teste de posição, controles e capacidade de detectar quando um disparo é bloqueado. Não transformar um disparo bloqueado em dano fictício.

## Provas obrigatórias

1. Node: a mesma plataforma física continua ativa ao receber fade, sem deslocar o jogador; outro tile e fundo distante não mudam.
2. WebGL desktop/mobile: screenshot durante oclusão mostra o cenário e a nave através da travessa translúcida; quando o caminho limpa, material volta a opaco. Voo livre por cima não aciona fade.
3. WebGL mobile: `mobile-hud-audit` passa nas duas resoluções sem aumentar a área da tag BLINDADO nem sobrepor os controles.
4. Build, lint, suíte Node, quatro shards WebGL e verificação física de FPS em aparelho real antes de produção.
