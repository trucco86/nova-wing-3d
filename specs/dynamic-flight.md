# Voo dinâmico — validação web

Escopo: curvas contínuas, subida orbital, passagem por conduítes espaciais, cenário final de buraco negro, desafios de nave 2D e pinturas compráveis. Preservar dez setores, combate, limites, controles e checkpoints existentes. Recursos novos ficam desativados quando nativeLifecycle=true até validação do usuário nos apps.

- A deformação visual da rota deve atingir cenário e entidades de combate juntos; colisões continuam no referencial local da rota. É voo guiado, não exploração livre 360°.
- Curvas e subida entram suavemente; chefes retornam à perspectiva de perseguição. Pausa congela rota e desafio. Reinício limpa ambos.
- Setores espaciais possuem conduítes de anéis, com entrada e saída visíveis; os túneis industriais preservam colisões existentes.
- Setores 3 e 7 recebem desafio lateral 2D de 18 segundos no começo do percurso, antes dos subchefes. WASD/setas/toque movem a nave, Espaço/TIRO disparam. Alvos rendem créditos e acertos; colisão reduz prêmio, sem retirar vidas da campanha. Retorno preserva entidades e recursos e entrega recompensa uma única vez.
- Último setor exibe horizonte negro, disco quente e arcos de luz estilizados; não alegar simulação relativística.
- Hangar oferece pinturas sem bônus de combate. Preço usa créditos existentes, duas skins exigem acertos da campanha. Itens adquiridos são equipáveis sem nova cobrança. Checkpoint carrega propriedade, seleção e acertos com validação; saves antigos continuam válidos.
- Testar pausa/perda de foco, retorno, compras insuficientes/repetidas, persistência, cenas finitas, desktop/toque e erros WebGL. Não declarar FPS, validação física nem publicação em lojas.
