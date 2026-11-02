# Phoenix Combat 4.0 — duas ações físicas em Vênus (vertical slice)
- **Objetivo:** diferenciar combate da Fênix do padrão de garras/broca e dar ao jogador duas esquivas observáveis.
- **Mudança:** no setor 5 (index 4), mergulho de plasma quando o piloto voa alto ou acelera; varredura horizontal das asas quando o piloto voa baixo. Uma janela de rajada preserva o ritmo de recuperação.
- **Contrato:** alvo X/Y é fixado uma única vez no início do windup (2,2s); tiros/telegraph/radar não retargetam após a esquiva. O golpe só causa dano quando a posição continua dentro do mesmo predicado usado pelo radar. Após saída da área vermelha, o jogador não recebe dano desse golpe.
- **Integração:** reutilizar o ciclo de ataque e animação de asas que já existem; origem semântica do ataque é núcleo solar ou asas da Fênix. Não criar timers nem entidades de colisão separadas.
- **Fora do escopo:** rastro persistente de plasma, novos shaders, mudança de ataques nas fases 1–4, IA completa dos chefes 5–10, alteração da câmara de sabotagem.
- **Aceite:** duas zonas visualmente distintas no radar (elipse vertical ou faixa horizontal), sinais de alerta legíveis, esquiva física e retorno da câmera sem oclusão no modo mobile. Validar via teste Node + Playwright e avaliação visual real.
