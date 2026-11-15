# QA148 | Tempestade de Marte com profundidade e movimento contínuo

## Objetivo
Tornar a tempestade da fase 2 mais legível e cinematográfica sem reduzir a
visibilidade do alvo por HUD, aumentar draw calls ou alterar a física do vento.

## Contratos
- Manter exatamente 240 partículas num único Points e três planos de névoa.
- Reutilizar a geometria compartilhada, sem criar texturas ou objetos por quadro.
- Três bancos de areia com diferentes opacidades, deriva transversal, variação
  vertical e inclinação em resposta ao vento. O shader combina poeira baixa,
  nuvens largas e linhas finas de areia, sem texture fetch.
- Eliminar o salto de posição provocado pelo módulo do campo de partículas.
- Preservar o aviso antecipado, a janela de tempestade, turbulência, dano,
  acúmulo de areia na nave, giro de limpeza, pausar e reiniciar.
- Preservar controle móvel, HUD radial e o modo High da integração QA138-146.
- Novas medições no mesmo celular: 35 segundos na fase 2, mesmo perfil,
  draw calls p95, frame p95/p99, resolução interna e memória.

## Aceite e risco
Testar início, ápice, desaparecimento da tempestade e navegação com chefe em
iPhone portrait/landscape e Android. Confirmar ausência de tiras artificiais
ou obscurecimento excessivo da mira, além de compilação do shader WebGL.
A alteração melhora a composição visual pretendida, mas não confirma
qualidade, FPS ou GPU real antes do teste no dispositivo.

**Branch empilhada na PR #377, sem merge/deploy de produção até FULL CI e QA visual.**
