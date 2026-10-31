# Nova Wing Graphics 3.6 — Reflex Boost e brilho seletivo de armas

## Problemas relatados
Após a Cidade 2.9 o Galaxy S21 passou a usar renderização direta para controlar GPU e perdeu o bloom de tela inteira. A NOVA-7, o robô e os disparos ficaram mais apagados. O usuário deseja um mecanismo evasivo de câmera lenta ativado via BOOST sob chuva de projéteis e maior fidelidade ao visual de referência.

## Onda A — Weapon reactive light / brilho seletivo
- Módulo `src/hero-weapon-vfx.js` vinculado ao modelo do jogador e às duas bocas de canhão articuladas do robô.
- Clarão curto de disparo, anel de energia frontal e reflexos aparentes na superfície das asas. O robô ilumina o peito e o punho correspondente; tiro de precisão usa o braço esquerdo, tiro comum o braço direito. Tiros carregados têm pulso mais longo.
- Telas touch renderizam esses elementos emissivos aditivos **sem voltar com o bloom de tela inteira** e sem `PointLight`. Desktop em Alto pode usar **uma luz pontual curta** próxima ao canhão. Os reflexos do celular são **efeito artístico simulado**, não reflexos PBR fisicamente calculados.
- Estado do brilho segue tempo de jogo e é escondido ao sair/pausar; não gera hitboxes nem altera dano, tiros ou acerto.

## Onda B — Reflex Boost (protótipo jogável)
- Ativação quando o piloto **segura SHIFT/BOOST**, com pelo menos **4 projéteis hostis próximos e convergindo**, **45 unidades de energia** e fora da etapa do boost obrigatório de lançamento orbital.
- Dispara janela de **1,55 s** com munições hostis e seu tempo de vida a **38% da velocidade normal**, além de cadência de ataque de inimigos e chefes desacelerada nos ciclos em que o efeito está ativo. Movimentação e fogo do jogador, missões e relógios avançam normalmente.
- A esquiva do piloto fica **40% mais responsiva** durante essa janela. Custo de ativação de **14 pontos de energia**, além do consumo normal do boost; **9 s** de recarga.
- O BOOST existente mostra a indicação `REFLEX` ao lado do botão, fora do centro do gameplay; mensagem curta informa a ativação. Não acrescenta overlay central.
- Escopo deliberado: **bullet time tático local**, e não dilatação temporal global. É um primeiro protótipo de combate para evitar dessincronizar boss telegraphs, trilha, física ou lançamento orbital.

## Critérios para QA
1. Testes unitários de ameaça em 3D, aproximação, consumo único, cooldown, pausa, limite de energia, gating do lançamento e reset de fase.
2. Testes de efeitos emissivos no mobile, luz pontual exclusiva de desktop Alto, flashes no punho esquerdo/direito e descarte do pulso.
3. Renderizações reais de nave, robô e tiros no Galaxy S21 e desktop (Alto/Médio) para comprovar legibilidade e impacto visual sem perder FPS.
4. Testar boss com muitos projéteis, BOOST contínuo, câmera aérea, fase 1 e transformação no instante do tiro. Assegurar que o dodge não atravessa hitboxes.
5. Browser shards, lint, build, validação e homologação visual devem passar antes de promover ambientes.

## Pipeline gráfico para se aproximar da imagem de referência
A arquitetura Three.js/WebGL suporta assets GLB e materiais PBR, mas **a maior parte dos modelos ainda é procedural**. Este pacote recupera impacto visual e traz uma mecânica evasiva; **não significa que a qualidade da imagem de referência foi atingida**.
A próxima onda estrutural deve comparar a nave GLB da PR #187 com a silhueta clean aprovada na PR #191, definir LOD High/Medium, perfis PBR/emissive/normal e critérios mínimos de FPS no S21. A integração GLB não faz parte deste pacote.

## Status
Candidata QA v1.27.41 baseada na Cidade 2.9, sem alteração em produção. Nenhuma homologação humana implícita.
